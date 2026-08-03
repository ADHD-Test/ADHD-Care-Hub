import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { notFound } from '../../lib/errors.js';

export const trackingRouter = Router();
trackingRouter.use(authenticate);

const checkInSchema = z.object({
  date: z.coerce.date(),
  focusRating: z.number().int().min(1).max(5),
  moodRating: z.number().int().min(1).max(5),
  sleepHours: z.number().min(0).max(24).optional(),
  notes: z.string().max(2000).optional(),
});

const routineSchema = z.object({
  title: z.string().min(1).max(120),
  cadence: z.enum(['DAILY', 'WEEKDAYS', 'WEEKLY']).default('DAILY'),
  timeOfDay: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

trackingRouter.put('/check-ins', validate(checkInSchema), async (req, res, next) => {
  try {
    const { date, ...rest } = req.body;
    const checkIn = await prisma.dailyCheckIn.upsert({
      where: { userId_date: { userId: req.user!.id, date } },
      update: rest,
      create: { userId: req.user!.id, date, ...rest },
    });
    res.json({ data: checkIn });
  } catch (error) {
    next(error);
  }
});

trackingRouter.get('/check-ins', async (req, res, next) => {
  try {
    const days = Math.min(Number(req.query.days ?? 30), 365);
    const since = new Date(Date.now() - days * 864e5);
    const checkIns = await prisma.dailyCheckIn.findMany({
      where: { userId: req.user!.id, date: { gte: since } },
      orderBy: { date: 'asc' },
    });
    res.json({ data: checkIns });
  } catch (error) {
    next(error);
  }
});

trackingRouter.get('/routines', async (req, res, next) => {
  try {
    const routines = await prisma.routine.findMany({
      where: { userId: req.user!.id, isActive: true },
      orderBy: { createdAt: 'asc' },
      include: { completions: { orderBy: { date: 'desc' }, take: 30 } },
    });
    res.json({ data: routines });
  } catch (error) {
    next(error);
  }
});

trackingRouter.post('/routines', validate(routineSchema), async (req, res, next) => {
  try {
    const routine = await prisma.routine.create({ data: { userId: req.user!.id, ...req.body } });
    res.status(201).json({ data: routine });
  } catch (error) {
    next(error);
  }
});

trackingRouter.post('/routines/:id/complete', async (req, res, next) => {
  try {
    const routine = await prisma.routine.findFirst({ where: { id: req.params.id!, userId: req.user!.id } });
    if (!routine) throw notFound('Routine not found');

    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);

    const completion = await prisma.routineCompletion.upsert({
      where: { routineId_date: { routineId: routine.id, date } },
      update: {},
      create: { routineId: routine.id, date },
    });
    res.status(201).json({ data: completion });
  } catch (error) {
    next(error);
  }
});
