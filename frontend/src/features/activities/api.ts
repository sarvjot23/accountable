import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, refreshAll } from '../../lib/api';
import type { components } from '../../lib/api-types';

export type Activity = components['schemas']['ActivityOut'];
export type ActivityInput = components['schemas']['ActivityIn'];
export type ActivityType = Activity['type'];
export type TimelineKind = 'contacts' | 'deals';

export const TYPE_LABELS: Record<ActivityType, string> = {
  note: 'Note',
  call: 'Call',
  email: 'Email',
  stage_change: 'Stage change',
};

/** API-6: a contact's or a deal's activities, newest first. */
export function useTimeline(kind: TimelineKind, id: number) {
  return useQuery({
    queryKey: ['timeline', kind, id],
    queryFn: () => api.get<Activity[]>(`/${kind}/${id}/timeline`),
  });
}

export function useSaveActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id?: number; values: ActivityInput }) =>
      id ? api.put<Activity>(`/activities/${id}`, values) : api.post<Activity>('/activities', values),
    onSuccess: () => refreshAll(queryClient),
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del(`/activities/${id}`),
    onSuccess: () => refreshAll(queryClient),
  });
}

/** DASH-12, REC-9: tick a follow-up done. */
export function useMarkDone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, done }: { id: number; done: boolean }) => api.patch<Activity>(`/activities/${id}/done`, { done }),
    onSuccess: () => refreshAll(queryClient),
  });
}
