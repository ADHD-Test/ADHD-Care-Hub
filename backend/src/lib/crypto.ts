import crypto from 'node:crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const key = Buffer.from(env.PHI_ENCRYPTION_KEY, 'base64');

/**
 * Application-layer encryption for free-text clinical content.
 * Storage format: base64(iv).base64(authTag).base64(ciphertext)
 * Rotate by re-encrypting with a versioned key prefix before going live.
 */
export function encryptField(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return [iv.toString('base64'), cipher.getAuthTag().toString('base64'), ciphertext.toString('base64')].join('.');
}

export function decryptField(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split('.');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Malformed ciphertext');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}

/** One-way hash for IP addresses so the audit trail stays useful without storing PII. */
export function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip + env.JWT_ACCESS_SECRET).digest('hex').slice(0, 32);
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
