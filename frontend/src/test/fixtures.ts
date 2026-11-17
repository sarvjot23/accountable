// Small records for tests, shaped like the API's responses.
import type { Activity } from '../features/activities/api';
import type { Contact } from '../features/contacts/api';
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
