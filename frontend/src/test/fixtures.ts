// Small records for tests, shaped like the API's responses.
import type { Activity } from '../features/activities/api';
import type { Contact } from '../features/contacts/api';
import type { Dashboard, Month } from '../features/dashboard/api';
import type { Deal } from '../features/deals/api';
import type { Organization } from '../features/organizations/api';

const at = '2026-11-17T10:00:00Z';

export function organization(fields: Partial<Organization> = {}): Organization {
  return {
    id: 1,
    name: 'Northwind Labs',
    website: null,
    industry: 'Logistics',
    notes: null,
    contacts_count: 0,
    open_deals_count: 0,
    open_value: 0,
    created_at: at,
    updated_at: at,
    ...fields,
  };
}

export function contact(fields: Partial<Contact> = {}): Contact {
  return {
    id: 1,
    first_name: 'Sam',
    last_name: 'Patel',
    name: 'Sam Patel',
    email: null,
    phone: null,
    job_title: null,
    organization_id: 1,
    organization_name: 'Northwind Labs',
    status: 'lead',
    created_at: at,
    updated_at: at,
    ...fields,
  };
}

export function deal(fields: Partial<Deal> = {}): Deal {
  return {
    id: 1,
    name: 'Cloud migration',
    organization_id: 1,
    organization_name: 'Northwind Labs',
    contact_id: null,
    contact_name: null,
    stage: 'proposal',
    value: 10000,
    probability: 50,
    probability_manual: false,
    close_date: '2026-12-01',
    close_date_manual: false,
    position: 1,
    stage_changed_at: at,
    expected_revenue: 5000,
    is_late: false,
    created_at: at,
    updated_at: at,
    ...fields,
  };
}

export function activity(fields: Partial<Activity> = {}): Activity {
  return {
    id: 1,
    type: 'note',
    description: 'Spoke about scope',
    occurred_at: at,
    contact_id: 1,
    contact_name: 'Sam Patel',
    deal_id: null,
    deal_name: null,
    organization_id: 1,
    organization_name: 'Northwind Labs',
    follow_up_date: null,
    follow_up_done: false,
    follow_up_status: null,
    from_stage: null,
    to_stage: null,
    created_at: at,
    updated_at: at,
    ...fields,
  };
}

const MONTHS = [
  '2025-12',
  '2026-01',
  '2026-02',
  '2026-03',
  '2026-04',
  '2026-05',
  '2026-06',
  '2026-07',
  '2026-08',
  '2026-09',
  '2026-10',
  '2026-11',
];

/** December 2025 to November 2026: nothing won until September, then 1, 2 and 3 deals of US$40,000 each. */
export function months(): Month[] {
  return MONTHS.map((month, i) => {
    const won = Math.max(0, i - 8);
    return { month, deals_won: won, revenue_won: won * 40000 };
  });
}

export function dashboard(fields: Partial<Dashboard> = {}): Dashboard {
  return {
    today: '2026-11-17',
    open_pipeline: { value: 248500, count: 7 },
    expected_revenue: { value: 132000, share: 53 },
    won_this_month: { value: 120000, count: 3, last_month_value: 80000, change: 40000, share_of_best_month: 100 },
    late_deals: { count: 2, value: 330000, share_of_open: 47 },
    monthly: months(),
    revenue_won_12_months: 240000,
    deals_won_12_months: 6,
    funnel: { stages: [], new_to_won_share: 0, new_count: 0, won_count: 0 },
    follow_ups: { overdue: 0, due_today: 0, upcoming: 0, items: [] },
    recent_activity: [],
    ...fields,
  };
}
