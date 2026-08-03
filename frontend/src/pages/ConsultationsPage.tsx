import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Consultation, Slot } from '@/api/types';
import { Button, Card, EmptyState, ErrorNote, SectionHeading } from '@/components/ui';

export function ConsultationsPage() {
  const queryClient = useQueryClient();
  const slots = useQuery({ queryKey: ['slots'], queryFn: () => api.get<Slot[]>('/consultations/slots') });
  const booked = useQuery({ queryKey: ['consultations'], queryFn: () => api.get<Consultation[]>('/consultations') });

  const book = useMutation({
    mutationFn: (slotId: string) => api.post('/consultations', { slotId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['slots'] });
      void queryClient.invalidateQueries({ queryKey: ['consultations'] });
    },
  });

  const cancel = useMutation({
    mutationFn: (id: string) => api.post(`/consultations/${id}/cancel`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['slots'] });
      void queryClient.invalidateQueries({ queryKey: ['consultations'] });
    },
  });

  const upcoming = booked.data?.filter((c) => c.status === 'CONFIRMED' && new Date(c.scheduledAt) > new Date()) ?? [];

  return (
    <div className="space-y-8">
      <section>
        <SectionHeading eyebrow="Appointments" title="Your bookings" />
        {upcoming.length ? (
          <ul className="space-y-2">
            {upcoming.map((consultation) => (
              <li key={consultation.id}>
                <Card className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(consultation.scheduledAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    <p className="text-xs text-slate">
                      {consultation.durationMin} min with {consultation.provider.profile?.firstName}{' '}
                      {consultation.provider.profile?.lastName}
                    </p>
                  </div>
                  <Button variant="ghost" onClick={() => cancel.mutate(consultation.id)}>Cancel</Button>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Nothing booked yet. Pick a time below." />
        )}
      </section>

      <section>
        <SectionHeading title="Available times">Video consultations, 30 minutes each.</SectionHeading>
        {book.isError && <div className="mb-3"><ErrorNote message={(book.error as Error).message} /></div>}
        {slots.isLoading && <p className="text-sm text-slate">Loading times…</p>}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {slots.data?.map((slot) => (
            <Card key={slot.id} className="py-3">
              <p className="text-sm font-medium">
                {new Date(slot.startsAt).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
              <p className="mb-3 text-xs text-slate">
                {new Date(slot.startsAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} ·{' '}
                {slot.provider.profile?.lastName}
              </p>
              <Button variant="secondary" onClick={() => book.mutate(slot.id)} disabled={book.isPending}>
                Book
              </Button>
            </Card>
          ))}
        </div>
        {slots.data?.length === 0 && <EmptyState title="No open times in the next two weeks." />}
      </section>
    </div>
  );
}
