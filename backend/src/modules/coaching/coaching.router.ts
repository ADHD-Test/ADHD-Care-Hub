import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../../lib/audit.js';
import { notFound } from '../../lib/errors.js';

export const coachingRouter = Router();
coachingRouter.use(authenticate);

const enrolSchema = z.object({ programId: z.string().uuid() });

coachingRouter.get('/programs', async (_req, res, next) => {
  try {
    const programs = await prisma.coachingProgram.findMany({
      where: { isPublished: true },
      orderBy: { title: 'asc' },
      select: { id: true, slug: true, title: true, summary: true, weeks: true },
    });
    res.json({ data: programs });
  } catch (error) {
    next(error);
  }
});

coachingRouter.get('/programs/:slug', async (req, res, next) => {
  try {
    const program = await prisma.coachingProgram.findUnique({
      where: { slug: req.params.slug! },
      include: { modules: { orderBy: { ordinal: 'asc' }, select: { id: true, ordinal: true, title: true } } },
    });
    if (!program || !program.isPublished) throw notFound('Programme not found');
    res.json({ data: program });
  } catch (error) {
    next(error);
  }
});

coachingRouter.post('/enrolments', validate(enrolSchema), async (req, res, next) => {
  try {
    const enrolment = await prisma.coachingEnrolment.upsert({
      where: { userId_programId: { userId: req.user!.id, programId: req.body.programId } },
      update: {},
      create: { userId: req.user!.id, programId: req.body.programId },
    });
    await recordAudit(req, { action: 'coaching.enrolled', entityType: 'CoachingEnrolment', entityId: enrolment.id });
    res.status(201).json({ data: enrolment });
  } catch (error) {
    next(error);
  }
});

coachingRouter.post('/modules/:moduleId/complete', async (req, res, next) => {
  try {
    const coachingModule = await prisma.coachingModule.findUnique({ where: { id: req.params.moduleId! } });
    if (!coachingModule) throw notFound('Module not found');

    const enrolment = await prisma.coachingEnrolment.findUnique({
      where: { userId_programId: { userId: req.user!.id, programId: coachingModule.programId } },
    });
    if (!enrolment) throw notFound('Join the programme before marking modules complete');

    const progress = await prisma.moduleProgress.upsert({
      where: { enrolmentId_moduleId: { enrolmentId: enrolment.id, moduleId: coachingModule.id } },
      update: { completedAt: new Date() },
      create: { enrolmentId: enrolment.id, moduleId: coachingModule.id, completedAt: new Date() },
    });
    res.json({ data: progress });
  } catch (error) {
    next(error);
  }
});
