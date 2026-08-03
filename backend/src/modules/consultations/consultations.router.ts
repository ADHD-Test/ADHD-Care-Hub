import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../../lib/audit.js';
import { encryptField } from '../../lib/crypto.js';
import { conflict, notFound } from '../../lib/errors.js';

export const consultationsRouter = Router();
consultationsRouter.use(authenticate);

const bookSchema = z.object({
  slotId: z.string().uuid(),
  reasonForVisit: z.string().max(500).optional(),
});

const noteSchema = z.object({ note: z.string().min(1).max(10_000) });

/** Open slots across all providers in a date range. */
consultationsRouter.get('/slots', async (req, res, next) => {
  try {
    const from = req.query.from ? new Date(String(req.query.from)) : new Date();
    const to = req.query.to ? new Date(String(req.query.to)) : new Date(Date.now() + 14 * 864e5);

    const slots = await prisma.availabilitySlot.findMany({
      where: { isBooked: false, startsAt: { gte: from, lte: to } },
      orderBy: { startsAt: 'asc' },
      select: {
        id: true, startsAt: true, endsAt: true,
        provider: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } },
      },
    });
    res.json({ data: slots });
  } catch (error) {
    next(error);
  }
});

consultationsRouter.post('/', validate(bookSchema), async (req, res, next) => {
  try {
    const slot = await prisma.availabilitySlot.findUnique({ where: { id: req.body.slotId } });
    if (!slot) throw notFound('That time is no longer listed');
    if (slot.isBooked) throw conflict('That time was just taken. Pick another.');

    const consultation = await prisma.$transaction(async (tx) => {
      // Guard against two patients claiming the same slot.
      const claimed = await tx.availabilitySlot.updateMany({
        where: { id: slot.id, isBooked: false },
        data: { isBooked: true },
      });
      if (claimed.count === 0) throw conflict('That time was just taken. Pick another.');

      return tx.consultation.create({
        data: {
          patientId: req.user!.id,
          providerId: slot.providerId,
          slotId: slot.id,
          scheduledAt: slot.startsAt,
          durationMin: Math.round((slot.endsAt.getTime() - slot.startsAt.getTime()) / 60000),
          status: 'CONFIRMED',
          reasonForVisit: req.body.reasonForVisit,
        },
      });
    });

    await recordAudit(req, { action: 'consultation.booked', entityType: 'Consultation', entityId: consultation.id });
    res.status(201).json({ data: consultation });
  } catch (error) {
    next(error);
  }
});

consultationsRouter.get('/', async (req, res, next) => {
  try {
    const where =
      req.user!.role === 'PATIENT' ? { patientId: req.user!.id } : { providerId: req.user!.id };

    const consultations = await prisma.consultation.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      select: {
        id: true, scheduledAt: true, durationMin: true, status: true, videoRoomId: true,
        provider: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } },
      },
    });
    res.json({ data: consultations });
  } catch (error) {
    next(error);
  }
});

consultationsRouter.post('/:id/cancel', async (req, res, next) => {
  try {
    const consultation = await prisma.consultation.findFirst({
      where: { id: req.params.id!, OR: [{ patientId: req.user!.id }, { providerId: req.user!.id }] },
    });
    if (!consultation) throw notFound('Appointment not found');

    await prisma.$transaction([
      prisma.consultation.update({ where: { id: consultation.id }, data: { status: 'CANCELLED' } }),
      ...(consultation.slotId
        ? [prisma.availabilitySlot.update({ where: { id: consultation.slotId }, data: { isBooked: false } })]
        : []),
    ]);

    await recordAudit(req, { action: 'consultation.cancelled', entityType: 'Consultation', entityId: consultation.id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/** Clinician-only. Notes are encrypted before they touch the database. */
consultationsRouter.post(
  '/:id/notes',
  requireRole('CLINICIAN', 'COACH'),
  validate(noteSchema),
  async (req, res, next) => {
    try {
      const consultation = await prisma.consultation.findFirst({
        where: { id: req.params.id!, providerId: req.user!.id },
      });
      if (!consultation) throw notFound('Appointment not found');

      await prisma.consultation.update({
        where: { id: consultation.id },
        data: { clinicalNoteCipher: encryptField(req.body.note), status: 'COMPLETED' },
      });

      await recordAudit(req, { action: 'consultation.note.written', entityType: 'Consultation', entityId: consultation.id });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);
