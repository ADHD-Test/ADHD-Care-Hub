import argon2 from 'argon2';
import { addDays } from 'date-fns';
import { prisma } from '../../lib/prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js';
import { sha256 } from '../../lib/crypto.js';
import { conflict, unauthorized } from '../../lib/errors.js';
import type { LoginInput, RegisterInput } from './auth.schema.js';

const ARGON_OPTIONS = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw conflict('An account already exists for that email address');

  const passwordHash = await argon2.hash(input.password, ARGON_OPTIONS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      status: 'ACTIVE', // switch to PENDING_VERIFICATION once email verification ships
      profile: { create: { firstName: input.firstName, lastName: input.lastName } },
      consents: {
        create: [
          { type: 'TERMS_OF_USE', documentVersion: input.acceptedTermsVersion },
          { type: 'PRIVACY_POLICY', documentVersion: input.acceptedPrivacyVersion },
          { type: 'HEALTH_DATA_PROCESSING', documentVersion: input.healthDataConsentVersion },
        ],
      },
    },
    select: { id: true, email: true, role: true },
  });

  return user;
}

export async function login(input: LoginInput, context: { userAgent?: string; ipHash?: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // Uniform failure message: never reveal whether the address is registered.
  if (!user || user.deletedAt) throw unauthorized('Email or password is incorrect');

  const valid = await argon2.verify(user.passwordHash, input.password);
  if (!valid) throw unauthorized('Email or password is incorrect');
  if (user.status === 'SUSPENDED') throw unauthorized('This account is suspended');

  const tokens = await issueTokens(user.id, user.role, context);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  return { user: { id: user.id, email: user.email, role: user.role }, ...tokens };
}

export async function refresh(refreshToken: string, context: { userAgent?: string; ipHash?: string }) {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw unauthorized('Your session has expired. Sign in again.');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: sha256(refreshToken) } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw unauthorized('Your session has expired. Sign in again.');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.deletedAt) throw unauthorized();

  // Rotate: a refresh token is single-use.
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  return issueTokens(user.id, user.role, context);
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: sha256(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function issueTokens(userId: string, role: 'PATIENT' | 'CLINICIAN' | 'COACH' | 'ADMIN', context: { userAgent?: string; ipHash?: string }) {
  const accessToken = signAccessToken({ sub: userId, role });
  const refreshToken = signRefreshToken(userId);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: sha256(refreshToken),
      expiresAt: addDays(new Date(), 7),
      userAgent: context.userAgent?.slice(0, 255),
      ipHash: context.ipHash,
    },
  });

  return { accessToken, refreshToken };
}
