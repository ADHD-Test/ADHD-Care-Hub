import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12, 'Use at least 12 characters'),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  acceptedTermsVersion: z.string(),
  acceptedPrivacyVersion: z.string(),
  // GDPR Art. 9(2)(a): processing health data needs separate, explicit consent.
  healthDataConsentVersion: z.string(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
