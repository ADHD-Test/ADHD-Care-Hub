import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../../lib/audit.js';
import { notFound } from '../../lib/errors.js';

export const usersRouter = Router();
usersRouter.use(authenticate);

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  phone: z.string().max(32).optional(),
  locale: z.string().max(10).optional(),
  timezone: z.string().max(64).optional(),
});

usersRouter.get('/me', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, email: true, role: true, status: true, createdAt: true,
        profile: { select: { firstName: true, lastName: true, locale: true, timezone: true, phone: true } },
        consents: { select: { type: true, documentVersion: true, grantedAt: true, withdrawnAt: true } },
      },
    });
    if (!user) throw notFound('Account not found');
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
});

usersRouter.patch('/me/profile', validate(updateProfileSchema), async (req, res, next) => {
  try {
    const profile = await prisma.profile.update({ where: { userId: req.user!.id }, data: req.body });
    await recordAudit(req, { action: 'profile.updated', entityType: 'Profile', entityId: profile.id });
    res.json({ data: profile });
  } catch (error) {
    next(error);
  }
});

/** GDPR Art. 20 — machine-readable export of everything tied to the account. */
usersRouter.get('/me/export', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const [profile, consents, screenings, checkIns, routines, consultations] = await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.consentRecord.findMany({ where: { userId } }),
      prisma.screeningSession.findMany({ where: { userId }, include: { responses: true } }),
      prisma.dailyCheckIn.findMany({ where: { userId } }),
      prisma.routine.findMany({ where: { userId }, include: { completions: true } }),
      prisma.consultation.findMany({
        where: { patientId: userId },
        select: { id: true, scheduledAt: true, status: true, durationMin: true },
      }),
    ]);

    await recordAudit(req, { action: 'gdpr.data_exported', entityType: 'User', entityId: userId });
    res.setHeader('Content-Disposition', 'attachment; filename="adhd-care-hub-export.json"');
    res.json({ exportedAt: new Date().toISOString(), profile, consents, screenings, checkIns, routines, consultations });
  } catch (error) {
    next(error);
  }
});

/** GDPR Art. 17 — soft delete now, scheduled purge later; audit rows are retained. */
usersRouter.delete('/me', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'DEACTIVATED', deletedAt: new Date() },
    });
    await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await recordAudit(req, { action: 'gdpr.erasure_requested', entityType: 'User', entityId: userId });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
