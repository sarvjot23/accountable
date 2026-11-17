import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, refreshAfterDelete, refreshAll } from '../../lib/api';
import type { components } from '../../lib/api-types';
import { plural } from '../../lib/format';

export type Deal = components['schemas']['DealOut'];
export type DealInput = components['schemas']['DealIn'];
export type MoveInput = components['schemas']['MoveIn'];
type Impact = components['schemas']['DealDeleteImpact'];

export function useDeals() {
  return useQuery({ queryKey: ['deals'], queryFn: () => api.get<Deal[]>('/deals') });
}

export function useDeal(id: number) {
  return useQuery({ queryKey: ['deals', id], queryFn: () => api.get<Deal>(`/deals/${id}`) });
}

export function useSaveDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id?: number; values: DealInput }) =>
      id ? api.put<Deal>(`/deals/${id}`, values) : api.post<Deal>('/deals', values),
    onSuccess: () => refreshAll(queryClient),
  });
}

/** PIPE-16: one call saves a card's stage and place. */
export function moveDeal(id: number, move: MoveInput) {
  return api.patch<Deal>(`/deals/${id}/move`, move);
}

export function useMoveDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, move }: { id: number; move: MoveInput }) => moveDeal(id, move),
    onSuccess: () => refreshAll(queryClient),
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del(`/deals/${id}`),
    onSuccess: (_, id) => refreshAfterDelete(queryClient, 'deals', id),
  });
}

/** RULE-10, RULE-12: what deleting the deal does to its activities, in words. */
export function useDealConsequences(id: number | undefined) {
  const query = useQuery({
    queryKey: ['impact', 'deals', id],
    queryFn: () => api.get<Impact>(`/deals/${id}/delete-impact`),
    enabled: id !== undefined,
    staleTime: 0,
    gcTime: 0,
  });
  if (!query.data) return undefined;
  const { activities } = query.data;
  return activities
    ? `Only the deal is deleted: its ${plural(activities, 'activity')} stay as history and still show in recent activity.`
    : 'Nothing else is linked to it.';
}
