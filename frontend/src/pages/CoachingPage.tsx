import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { CoachingProgram } from '@/api/types';
import { Button, Card, EmptyState, SectionHeading } from '@/components/ui';

export function CoachingPage() {
  const queryClient = useQueryClient();
  const programs = useQuery({
    queryKey: ['programs'],
    queryFn: () => api.get<CoachingProgram[]>('/coaching/programs'),
  });

  const enrol = useMutation({
    mutationFn: (programId: string) => api.post('/coaching/enrolments', { programId }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['programs'] }),
  });

  return (
    <div>
      <SectionHeading eyebrow="Coaching" title="Structured programmes">
        Self-paced modules built around planning, task initiation and attention.
      </SectionHeading>

      {programs.data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {programs.data.map((program) => (
            <Card key={program.id}>
              <p className="mb-1 text-xs uppercase tracking-[0.14em] text-slate">{program.weeks} weeks</p>
              <h3 className="mb-2 text-base">{program.title}</h3>
              <p className="mb-4 text-sm text-slate">{program.summary}</p>
              <Button onClick={() => enrol.mutate(program.id)} disabled={enrol.isPending}>
                Join programme
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No programmes published yet." />
      )}
    </div>
  );
}
