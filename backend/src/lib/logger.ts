import pino from 'pino';
import { env, isProduction } from '../config/env.js';

// Health data must never reach the log sink. Add every new PHI-bearing field here.
const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.notes',
  'req.body.clinicalNote',
  'req.body.reasonForVisit',
  'req.body.responses',
  'res.headers["set-cookie"]',
];

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: { paths: redactPaths, censor: '[redacted]' },
  transport: isProduction ? undefined : { target: 'pino-pretty', options: { colorize: true } },
});
