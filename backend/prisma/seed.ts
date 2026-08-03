import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { addDays, setHours, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Development seed only. The screening item wording below is PLACEHOLDER text.
 * Published instruments (ASRS v1.1 and similar) are copyrighted — obtain a
 * licence and load the official wording before any real use.
 */
async function main() {
  const passwordHash = await argon2.hash('DevPassword123!', { type: argon2.argon2id });

  const patient = await prisma.user.upsert({
    where: { email: 'patient@example.de' },
    update: {},
    create: {
      email: 'patient@example.de',
      passwordHash,
      role: 'PATIENT',
      status: 'ACTIVE',
      profile: { create: { firstName: 'Test', lastName: 'Patient' } },
      consents: {
        create: [
          { type: 'TERMS_OF_USE', documentVersion: '2026-01' },
          { type: 'PRIVACY_POLICY', documentVersion: '2026-01' },
          { type: 'HEALTH_DATA_PROCESSING', documentVersion: '2026-01' },
        ],
      },
    },
  });

  const clinician = await prisma.user.upsert({
    where: { email: 'clinician@example.de' },
    update: {},
    create: {
      email: 'clinician@example.de',
      passwordHash,
      role: 'CLINICIAN',
      status: 'ACTIVE',
      profile: { create: { firstName: 'Test', lastName: 'Clinician' } },
    },
  });

  const instrument = await prisma.screeningInstrument.upsert({
    where: { code: 'DEMO_SCREENER_V1' },
    update: {},
    create: {
      code: 'DEMO_SCREENER_V1',
      name: 'Demo attention screener (placeholder content)',
      version: '1.0',
      licenseNote: 'Placeholder items. Replace with licensed instrument text before release.',
      items: {
        create: Array.from({ length: 6 }, (_, i) => ({
          ordinal: i + 1,
          text: `Placeholder question ${i + 1} — replace with licensed item wording.`,
          scoringMap: { '0': 0, '1': 0, '2': 1, '3': 1, '4': 1 },
        })),
      },
    },
  });

  const base = startOfDay(new Date());
  for (let day = 1; day <= 5; day++) {
    for (const hour of [9, 11, 14]) {
      const startsAt = setHours(addDays(base, day), hour);
      const existing = await prisma.availabilitySlot.findFirst({
        where: { providerId: clinician.id, startsAt },
      });
      if (!existing) {
        await prisma.availabilitySlot.create({
          data: { providerId: clinician.id, startsAt, endsAt: new Date(startsAt.getTime() + 30 * 60000) },
        });
      }
    }
  }

  await prisma.coachingProgram.upsert({
    where: { slug: 'focus-foundations' },
    update: {},
    create: {
      slug: 'focus-foundations',
      title: 'Focus foundations',
      summary: 'Six weeks of practical routines for planning, starting tasks and protecting attention.',
      weeks: 6,
      isPublished: true,
      modules: {
        create: [
          { ordinal: 1, title: 'Map your week', body: 'Placeholder module content.' },
          { ordinal: 2, title: 'Starting is the hard part', body: 'Placeholder module content.' },
          { ordinal: 3, title: 'Designing a workspace', body: 'Placeholder module content.' },
        ],
      },
    },
  });

  console.log('Seeded:', { patient: patient.email, clinician: clinician.email, instrument: instrument.code });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
