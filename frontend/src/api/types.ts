export type Role = 'PATIENT' | 'CLINICIAN' | 'COACH' | 'ADMIN';
export type IndicationBand = 'LOW' | 'MODERATE' | 'HIGH';

export interface CurrentUser {
  id: string;
  email: string;
  role: Role;
  profile: { firstName: string; lastName: string; locale: string; timezone: string } | null;
}

export interface ScreeningItem {
  id: string;
  ordinal: number;
  text: string;
}

export interface ScreeningSessionStart {
  sessionId: string;
  instrument: { code: string; name: string; version: string };
  items: ScreeningItem[];
}

export interface ScreeningResult {
  sessionId: string;
  rawScore: number;
  indicationBand: IndicationBand;
  isDiagnosis: false;
  nextStep: string;
}

export interface Slot {
  id: string;
  startsAt: string;
  endsAt: string;
  provider: { id: string; profile: { firstName: string; lastName: string } | null };
}

export interface Consultation {
  id: string;
  scheduledAt: string;
  durationMin: number;
  status: 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  videoRoomId: string | null;
  provider: { id: string; profile: { firstName: string; lastName: string } | null };
}

export interface CheckIn {
  id: string;
  date: string;
  focusRating: number;
  moodRating: number;
  sleepHours: number | null;
  notes: string | null;
}

export interface Routine {
  id: string;
  title: string;
  cadence: 'DAILY' | 'WEEKDAYS' | 'WEEKLY';
  timeOfDay: string | null;
  completions: { id: string; date: string }[];
}

export interface CoachingProgram {
  id: string;
  slug: string;
  title: string;
  summary: string;
  weeks: number;
}
