import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../../lib/audit.js';
import * as service from './screening.service.js';

export const screeningRouter = Router();
screeningRouter.use(authenticate);

const startSchema = z.object({ instrumentCode: z.string().min(1) });
const submitSchema = z.object({
  responses: z.array(z.object({ itemId: z.string().uuid(), value: z.number().int().min(0).max(4) })).min(1),
});

screeningRouter.post('/sessions', validate(startSchema), async (req, res, next) => {
  try {
    const result = await service.startSession(req.user!.id, req.body.instrumentCode);
    await recordAudit(req, { action: 'screening.session.started', entityType: 'ScreeningSession', entityId: result.sessionId });
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
});

screeningRouter.post('/sessions/:id/submit', validate(submitSchema), async (req, res, next) => {
  try {
    const result = await service.submitResponses(req.user!.id, req.params.id!, req.body.responses);
    await recordAudit(req, {
      action: 'screening.session.completed',
      entityType: 'ScreeningSession',
      entityId: req.params.id,
      metadata: { band: result.indicationBand },
    });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

screeningRouter.get('/sessions', async (req, res, next) => {
  try {
    res.json({ data: await service.listSessions(req.user!.id) });
  } catch (error) {
    next(error);
  }
});
