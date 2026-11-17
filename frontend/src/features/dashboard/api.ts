import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { components } from '../../lib/api-types';

export type Dashboard = components['schemas']['Dashboard'];
export type FunnelStage = components['schemas']['FunnelStage'];
export type Month = components['schemas']['Month'];

/** DASH-1: every figure in one call, fresh each time the dashboard is shown. */
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<Dashboard>('/dashboard'),
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
