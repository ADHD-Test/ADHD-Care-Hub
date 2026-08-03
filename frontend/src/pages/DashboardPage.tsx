import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import type { CheckIn, Consultation, Routine } from '@/api/types';
import { Button, Card, EmptyState, SectionHeading } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';

export function DashboardPage() {
  const { user } = useAuth();

  const routines = useQuery({ queryKey: ['routines'], queryFn: () => api.get<Routine[]>('/tracking/routines') });
  const checkIns = useQuery({ queryKey: ['check-ins', 7], queryFn: () => api.get<CheckIn[]>('/tracking/check-ins?days=7') });
  const consultations = useQuery({ queryKey: ['consultations'], queryFn: () => api.get<Consultation[]>('/consultations') });

  const next = consultations.data
    ?.filter((c) => c.status === 'CONFIRMED' && new Date(c.scheduledAt) > new Date())
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0];

  const todayLogged = checkIns.data?.some((c) => c.date.slice(0, 10) === new Date().toISOString().slice(0, 10));

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow={new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} title={`Hello, ${user?.profile?.firstName ?? 'there'}`}>
        Three things worth a minute today.
      </SectionHeading>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h3 className="mb-2 text-base">Daily check-in</h3>
          {todayLogged ? (
            <p className="text-sm text-slate">Logged for today. Come back tomorrow.</p>
          ) : (
            <>
              <p className="mb-3 text-sm text-slate">Rate focus and mood — it takes about 20 seconds.</p>
              <Link to="/journal"><Button>Log today</Button></Link>
            </>
          )}
        </Card>

        <Card>
          <h3 className="mb-2 text-base">Next appointment</h3>
          {next ? (
            <p className="text-sm text-slate">
              {new Date(next.scheduledAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })} with{' '}
              {next.provider.profile?.firstName} {next.provider.profile?.lastName}
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm text-slate">Nothing booked.</p>
              <Link to="/consultations"><Button variant="secondary">Find a time</Button></Link>
            </>
          )}
        </Card>
      </div>

      <section>
        <SectionHeading title="Routines" />
        {routines.data?.length ? (
          <ul className="space-y-2">
            {routines.data.map((routine) => (
              <li key={routine.id}>
                <Card className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{routine.title}</p>
                    <p className="text-xs text-slate">{routine.timeOfDay ?? routine.cadence.toLowerCase()}</p>
                  </div>
                  <span className="text-xs text-slate">{routine.completions.length} done</span>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No routines yet." action={<Link to="/journal"><Button variant="secondary">Add one</Button></Link>} />
        )}
      </section>
    </div>
  );
}
