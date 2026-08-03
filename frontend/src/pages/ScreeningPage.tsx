import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import type { ScreeningResult, ScreeningSessionStart } from '@/api/types';
import { Button, Card, ErrorNote, SectionHeading } from '@/components/ui';

const OPTIONS = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Rarely' },
  { value: 2, label: 'Sometimes' },
  { value: 3, label: 'Often' },
  { value: 4, label: 'Very often' },
];

const BAND_COPY: Record<string, string> = {
  LOW: 'Few of the traits screened for',
  MODERATE: 'Some of the traits screened for',
  HIGH: 'Many of the traits screened for',
};

export function ScreeningPage() {
  const [session, setSession] = useState<ScreeningSessionStart | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<ScreeningResult | null>(null);

  const start = useMutation({
    mutationFn: () => api.post<ScreeningSessionStart>('/screening/sessions', { instrumentCode: 'DEMO_SCREENER_V1' }),
    onSuccess: (data) => {
      setSession(data);
      setAnswers({});
      setResult(null);
    },
  });

  const submit = useMutation({
    mutationFn: () =>
      api.post<ScreeningResult>(`/screening/sessions/${session!.sessionId}/submit`, {
        responses: Object.entries(answers).map(([itemId, value]) => ({ itemId, value })),
      }),
    onSuccess: setResult,
  });

  const answeredAll = session ? session.items.every((item) => answers[item.id] !== undefined) : false;

  if (result) {
    return (
      <div className="space-y-4">
        <SectionHeading eyebrow="Result" title={BAND_COPY[result.indicationBand] ?? 'Result'} />
        <Card>
          <p className="text-sm text-slate">{result.nextStep}</p>
          <p className="mt-4 border-t border-edge pt-4 text-xs text-slate">
            This questionnaire is a screening aid, not a diagnosis. Only a qualified clinician can diagnose ADHD.
          </p>
        </Card>
        <div className="flex gap-2">
          <Link to="/consultations"><Button>Book a consultation</Button></Link>
          <Button variant="secondary" onClick={() => start.mutate()}>Retake</Button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <SectionHeading eyebrow="Screening" title="Check your symptoms">
          A short questionnaire about attention, restlessness and organisation over the past six months.
        </SectionHeading>
        <Card>
          <p className="mb-4 text-sm text-slate">
            Your answers are stored against your account and visible only to you and clinicians you book with.
            The result is an indication, never a diagnosis.
          </p>
          <Button onClick={() => start.mutate()} disabled={start.isPending}>
            {start.isPending ? 'Loading…' : 'Start questionnaire'}
          </Button>
          {start.isError && <div className="mt-3"><ErrorNote message={(start.error as Error).message} /></div>}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeading eyebrow={session.instrument.name} title="How often, in the past six months?" />

      <ol className="space-y-3">
        {session.items.map((item) => (
          <li key={item.id}>
            <Card>
              <fieldset>
                <legend className="mb-3 text-sm">
                  <span className="mr-2 text-slate">{item.ordinal}.</span>
                  {item.text}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        answers[item.id] === option.value ? 'border-sage bg-sage-soft text-ink' : 'border-edge text-slate hover:border-sage'
                      }`}
                    >
                      <input
                        type="radio"
                        name={item.id}
                        value={option.value}
                        checked={answers[item.id] === option.value}
                        onChange={() => setAnswers((prev) => ({ ...prev, [item.id]: option.value }))}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </Card>
          </li>
        ))}
      </ol>

      {submit.isError && <ErrorNote message={(submit.error as Error).message} />}

      <Button onClick={() => submit.mutate()} disabled={!answeredAll || submit.isPending}>
        {submit.isPending ? 'Submitting…' : 'See my result'}
      </Button>
      {!answeredAll && <p className="text-xs text-slate">Answer every question to continue.</p>}
    </div>
  );
}
