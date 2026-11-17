import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, refreshAfterDelete, refreshAll } from '../../lib/api';
import type { components } from '../../lib/api-types';
import { joinWords, plural } from '../../lib/format';
import type { PillTone } from '../../ui/Pill';

export type Contact = components['schemas']['ContactOut'];
export type ContactDetail = components['schemas']['ContactDetail'];
export type ContactInput = components['schemas']['ContactIn'];
export type ContactStatus = Contact['status'];
type Impact = components['schemas']['ContactDeleteImpact'];

export const STATUSES: Array<{ key: ContactStatus; label: string; tone: PillTone }> = [
  { key: 'lead', label: 'Lead', tone: 'amber' },
  { key: 'qualified', label: 'Qualified', tone: 'blue' },
  { key: 'customer', label: 'Customer', tone: 'green' },
];

export const statusLabel = (key: ContactStatus) => STATUSES.find((s) => s.key === key)!.label;

export function useContacts() {
  return useQuery({ queryKey: ['contacts'], queryFn: () => api.get<Contact[]>('/contacts') });
}

export function useContact(id: number) {
  return useQuery({ queryKey: ['contacts', id], queryFn: () => api.get<ContactDetail>(`/contacts/${id}`) });
}

export function useSaveContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id?: number; values: ContactInput }) =>
      id ? api.put<Contact>(`/contacts/${id}`, values) : api.post<Contact>('/contacts', values),
    onSuccess: () => refreshAll(queryClient),
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del(`/contacts/${id}`),
    onSuccess: (_, id) => refreshAfterDelete(queryClient, 'contacts', id),
  });
}

/** RULE-9, RULE-12: what deleting the contact does to linked records, in words. */
export function useContactConsequences(id: number | undefined) {
  const query = useQuery({
    queryKey: ['impact', 'contacts', id],
    queryFn: () => api.get<Impact>(`/contacts/${id}/delete-impact`),
    enabled: id !== undefined,
    staleTime: 0,
    gcTime: 0,
  });
  if (!query.data) return undefined;
  const { activities, deals } = query.data;
  const kept: string[] = [];
  if (activities) kept.push(`their ${plural(activities, 'activity')} stay as history`);
  if (deals) kept.push(`${plural(deals, 'deal')} stay${deals === 1 ? 's' : ''} with no main contact`);
  return kept.length ? `Only the contact is deleted: ${joinWords(kept)}.` : 'Nothing else is linked to them.';
}
