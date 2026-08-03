import { prisma } from '../../lib/prisma.js';
import { badRequest, notFound } from '../../lib/errors.js';
import type { IndicationBand } from '@prisma/client';

/**
 * Scoring is deliberately kept to a banded *indication*, not a diagnosis or a
 * treatment recommendation. Changing this function changes the product's
 * regulatory footprint — read docs/mdr-positioning.md first.
 */
export function bandForScore(score: number, itemCount: number): IndicationBand {
  const ratio = score / Math.max(itemCount, 1);
  if (ratio >= 0.66) return 'HIGH';
  if (ratio >= 0.33) return 'MODERATE';
  return 'LOW';
}

export async function startSession(userId: string, instrumentCode: string) {
  const instrument = await prisma.screeningInstrument.findUnique({
    where: { code: instrumentCode },
    include: { items: { orderBy: { ordinal: 'asc' } } },
  });
  if (!instrument || !instrument.isActive) throw notFound('That questionnaire is not available');

  const session = await prisma.screeningSession.create({
    data: { userId, instrumentId: instrument.id },
  });

  return {
    sessionId: session.id,
    instrument: { code: instrument.code, name: instrument.name, version: instrument.version },
    items: instrument.items.map((item) => ({ id: item.id, ordinal: item.ordinal, text: item.text })),
  };
}

export async function submitResponses(
  userId: string,
  sessionId: string,
  responses: { itemId: string; value: number }[],
) {
  const session = await prisma.screeningSession.findFirst({
    where: { id: sessionId, userId },
    include: { instrument: { include: { items: true } } },
  });
  if (!session) throw notFound('Screening session not found');
  if (session.status === 'COMPLETED') throw badRequest('This questionnaire is already submitted');

  const items = session.instrument.items;
  if (responses.length !== items.length) {
    throw badRequest('Answer every question before submitting');
  }

  const byId = new Map(items.map((item) => [item.id, item]));
  let rawScore = 0;

  for (const response of responses) {
    const item = byId.get(response.itemId);
    if (!item) throw badRequest('Unknown question in submission');
    const map = item.scoringMap as Record<string, number>;
    rawScore += map[String(response.value)] ?? 0;
  }

  const band = bandForScore(rawScore, items.length);

  await prisma.$transaction([
    prisma.screeningResponse.createMany({
      data: responses.map((r) => ({ sessionId, itemId: r.itemId, value: r.value })),
      skipDuplicates: true,
    }),
    prisma.screeningSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED', rawScore, indicationBand: band, completedAt: new Date(), disclaimerAckAt: new Date() },
    }),
  ]);

  return {
    sessionId,
    rawScore,
    indicationBand: band,
    isDiagnosis: false,
    nextStep:
      band === 'LOW'
        ? 'Your answers do not point strongly towards ADHD traits. You can retake this any time.'
        : 'Your answers suggest it is worth speaking to a clinician. You can book a consultation from here.',
  };
}

export async function listSessions(userId: string) {
  return prisma.screeningSession.findMany({
    where: { userId, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    select: {
      id: true, rawScore: true, indicationBand: true, completedAt: true,
      instrument: { select: { code: true, name: true, version: true } },
    },
  });
}
