import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import { authenticate } from '../../middleware/authenticate.js';
import { recordAudit } from '../../lib/audit.js';
import { hashIp } from '../../lib/crypto.js';
import { isProduction } from '../../config/env.js';
import { badRequest } from '../../lib/errors.js';
import { loginSchema, registerSchema } from './auth.schema.js';
import * as service from './auth.service.js';

export const authRouter = Router();

const REFRESH_COOKIE = 'adhd_rt';
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

authRouter.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const user = await service.register(req.body);
    await recordAudit(req, { action: 'auth.registered', entityType: 'User', entityId: user.id, actorId: user.id });
    res.status(201).json({ data: user });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const context = { userAgent: req.get('user-agent'), ipHash: req.ip ? hashIp(req.ip) : undefined };
    const { user, accessToken, refreshToken } = await service.login(req.body, context);
    await recordAudit(req, { action: 'auth.login', entityType: 'User', entityId: user.id, actorId: user.id });
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions).json({ data: { user, accessToken } });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) throw badRequest('No session to refresh');
    const context = { userAgent: req.get('user-agent'), ipHash: req.ip ? hashIp(req.ip) : undefined };
    const { accessToken, refreshToken } = await service.refresh(token, context);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions).json({ data: { accessToken } });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', authenticate, async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) await service.logout(token);
    await recordAudit(req, { action: 'auth.logout', entityType: 'User', entityId: req.user?.id });
    res.clearCookie(REFRESH_COOKIE, cookieOptions).status(204).send();
  } catch (error) {
    next(error);
  }
});
