import type { Request } from 'express';
import { prisma } from './prisma.js';
import { hashIp } from './crypto.js';
import { logger } from './logger.js';

interface AuditInput {
  action: string;
  entityType: string;
  entityId?: string;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Write an append-only audit entry. Never include health data in `metadata` —
 * identifiers and state transitions only.
 */
export async function recordAudit(req: Request, input: AuditInput): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        actorId: input.actorId ?? req.user?.id ?? null,
        ipHash: req.ip ? hashIp(req.ip) : null,
        userAgent: req.get('user-agent')?.slice(0, 255),
        metadata: input.metadata ?? undefined,
      },
    });
  } catch (error) {
    // Auditing must not break the request path, but a failure is operationally significant.
    logger.error({ error, action: input.action }, 'Failed to write audit event');
  }
}
