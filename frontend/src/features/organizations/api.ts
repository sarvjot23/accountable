import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, refreshAfterDelete, refreshAll } from '../../lib/api';
import type { components } from '../../lib/api-types';
import { joinWords, plural } from '../../lib/format';

export type Organization = components['schemas']['OrganizationOut'];
export type OrganizationDetail = components['schemas']['OrganizationDetail'];
export type OrganizationInput = components['schemas']['OrganizationIn'];
type Impact = components['schemas']['OrganizationDeleteImpact'];

export function useOrganizations() {
  return useQuery({ queryKey: ['organizations'], queryFn: () => api.get<Organization[]>('/organizations') });
}

export function useOrganization(id: number) {
  return useQuery({
    queryKey: ['organizations', id],
    queryFn: () => api.get<OrganizationDetail>(`/organizations/${id}`),
  });
}

export function useSaveOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id?: number; values: OrganizationInput }) =>
      id ? api.put<Organization>(`/organizations/${id}`, values) : api.post<Organization>('/organizations', values),
    onSuccess: () => refreshAll(queryClient),
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del(`/organizations/${id}`),
    onSuccess: (_, id) => refreshAfterDelete(queryClient, 'organizations', id),
  });
}

/** RULE-8, RULE-12: what deleting the organization also deletes, in words. */
export function useOrganizationConsequences(id: number | undefined) {
  const query = useQuery({
    queryKey: ['impact', 'organizations', id],
    queryFn: () => api.get<Impact>(`/organizations/${id}/delete-impact`),
    enabled: id !== undefined,
    staleTime: 0,
    gcTime: 0,
  });
  if (!query.data) return undefined;
  const { contacts, deals, activities } = query.data;
  if (contacts + deals + activities === 0) return 'Nothing else is linked to it.';
  const parts = [plural(contacts, 'contact'), plural(deals, 'deal'), plural(activities, 'activity')];
  return `This also deletes ${joinWords(parts)}.`;
}
