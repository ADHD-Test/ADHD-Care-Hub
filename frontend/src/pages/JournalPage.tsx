import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '@/api/client';
import type { CheckIn, Routine } from '@/api/types';
import { Button, Card, EmptyState, SectionHeading } from '@/components/ui';

const RATINGS = [1, 2, 3, 4, 5];

export function JournalPage() {
  const queryClient = useQueryClient();
  const [focusRating, setFocusRating] = useState(3);
  const [moodRating, setMoodRating] = useState(3);
  const [notes, setNotes] = useState('');
  const [routineTitle, setRoutineTitle] = useState('');

  const checkIns = useQuery({ queryKey: ['check-ins', 30], queryFn: () => api.get<CheckIn[]>('/tracking/check-ins?days=30') });
  const routines = useQuery({ queryKey: ['routines'], queryFn: () => api.get<Routine[]>('/tracking/routines') });

  const saveCheckIn = useMutation({
    mutationFn: () =>
      api.put('/tracking/check-ins', {
        date: new Date().toISOString().slice(0, 10),
        focusRating,
        moodRating,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      setNotes('');
      void queryClient.invalidateQueries({ queryKey: ['check-ins'] });
    },
  });

  const addRoutine = useMutation({
    mutationFn: () => api.post('/tracking/routines', { title: routineTitle, cadence: 'DAILY' }),
    onSuccess: () => {
      setRoutineTitle('');
      void queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });

  const completeRoutine = useMutation({
    mutationFn: (id: string) => api.post(`/tracking/routines/${id}/complete`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['routines'] }),
  });

  const chartData = checkIns.data?.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    focus: entry.focusRating,
    mood: entry.moodRating,
  }));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    saveCheckIn.mutate();
  }

  return (
    <div className="space-y-8">
      <section>
        <SectionHeading eyebrow="Journal" title="Today's check-in" />
        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <RatingRow label="Focus" value={focusRating} onChange={setFocusRating} />
            <RatingRow label="Mood" value={moodRating} onChange={setMoodRating} />
            <div>
              <label htmlFor="notes" className="mb-1 block text-sm font-medium">Notes (optional)</label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-edge px-3 py-2 text-sm"
                placeholder="What helped or got in the way today?"
              />
            </div>
            <Button type="submit" disabled={saveCheckIn.isPending}>
              {saveCheckIn.isPending ? 'Saving…' : 'Save check-in'}
            </Button>
          </form>
        </Card>
      </section>

      <section>
        <SectionHeading title="Last 30 days" />
        {chartData?.length ? (
          <Card>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke="#DDE4E8" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#4A5D6B' }} tickLine={false} axisLine={false} />
                  <YAxis domain={[1, 5]} ticks={RATINGS} tick={{ fontSize: 11, fill: '#4A5D6B' }} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="focus" stroke="#3F7F73" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="mood" stroke="#C2762B" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ) : (
          <EmptyState title="Your first few check-ins will show up here as a trend." />
        )}
      </section>

      <section>
        <SectionHeading title="Routines" />
        <Card className="mb-3">
          <div className="flex gap-2">
            <input
              value={routineTitle}
              onChange={(e) => setRoutineTitle(e.target.value)}
              placeholder="e.g. Plan tomorrow before bed"
              aria-label="New routine"
              className="flex-1 rounded-lg border border-edge px-3 py-2 text-sm"
            />
            <Button onClick={() => addRoutine.mutate()} disabled={!routineTitle || addRoutine.isPending}>
              Add
            </Button>
          </div>
        </Card>

        <ul className="space-y-2">
          {routines.data?.map((routine) => (
            <li key={routine.id}>
              <Card className="flex items-center justify-between py-3">
                <span className="text-sm">{routine.title}</span>
                <Button variant="secondary" onClick={() => completeRoutine.mutate(routine.id)}>
                  Mark done
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function RatingRow({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="flex gap-2">
        {RATINGS.map((rating) => (
          <label
            key={rating}
            className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border text-sm transition-colors ${
              value === rating ? 'border-sage bg-sage-soft' : 'border-edge text-slate hover:border-sage'
            }`}
          >
            <input
              type="radio"
              name={label}
              value={rating}
              checked={value === rating}
              onChange={() => onChange(rating)}
              className="sr-only"
            />
            {rating}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
