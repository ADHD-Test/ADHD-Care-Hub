import { describe, expect, it } from 'vitest';
import { bandForScore } from '../src/modules/screening/screening.service';

describe('bandForScore', () => {
  it('returns LOW below the first threshold', () => {
    expect(bandForScore(1, 6)).toBe('LOW');
  });

  it('returns MODERATE in the middle range', () => {
    expect(bandForScore(3, 6)).toBe('MODERATE');
  });

  it('returns HIGH at or above two thirds', () => {
    expect(bandForScore(5, 6)).toBe('HIGH');
  });

  it('does not divide by zero on an empty instrument', () => {
    expect(bandForScore(0, 0)).toBe('LOW');
  });
});
