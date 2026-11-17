import { createColumnHelper } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { plural } from '../../lib/format';
import { Button } from '../../ui/Button';
import { Chips } from '../../ui/Chips';
import { DataTable } from '../../ui/DataTable';
import { EmptyState } from '../../ui/EmptyState';
import { PageHeader } from '../../ui/PageHeader';
import { PageState } from '../../ui/PageState';
import { STATUSES, statusLabel, useContacts, type Contact, type ContactStatus } from './api';
import { ContactSheet, DeleteContact } from './ContactForm';
import { StatusChip } from './StatusChip';

const column = createColumnHelper<Contact>();

/** Contacts columns (TBL-9). */
const columns = [
  column.accessor('name', {
    header: 'Name',
    cell: (info) => (
      <Link to={`/contacts/${info.row.original.id}`} onClick={(e) => e.stopPropagation()}>
        {info.getValue()}
      </Link>
    ),
  }),
  column.accessor((c) => c.organization_name ?? '', {
    id: 'organization',
    header: 'Organization',
    cell: (info) =>
      info.row.original.organization_id ? (
        <Link to={`/organizations/${info.row.original.organization_id}`} onClick={(e) => e.stopPropagation()}>
          {info.getValue()}
        </Link>
      ) : null,
  }),
  column.accessor((c) => c.job_title ?? '', { id: 'job_title', header: 'Job title' }),
  column.accessor((c) => c.email ?? '', { id: 'email', header: 'Email' }),
  column.accessor((c) => c.phone ?? '', { id: 'phone', header: 'Phone' }),
  column.accessor((c) => statusLabel(c.status), {
    id: 'status',
    header: 'Status',
    cell: (info) => <StatusChip status={info.row.original.status} />,
  }),
];

export function ContactsPage() {
  const query = useContacts();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') as ContactStatus | null) ?? 'all';
  const [editing, setEditing] = useState<Contact | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const contacts = query.data ?? [];
  const shown = status === 'all' ? contacts : contacts.filter((c) => c.status === status);
  const count = (key: ContactStatus) => contacts.filter((c) => c.status === key).length;

  const add = (
    <Button variant="primary" onClick={() => setEditing(null)}>
      <Plus aria-hidden /> Add contact
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Contacts"
        summary={`${plural(contacts.length, 'contact')}: ${count('lead')} leads, ${count('qualified')} qualified, ${plural(count('customer'), 'customer')}`}
        actions={add}
      />
      <PageState query={query}>
        <DataTable
          data={shown}
          columns={columns}
          searchLabel="Search contacts"
          rowLabel={(c) => c.name}
          onOpen={(c) => navigate(`/contacts/${c.id}`)}
          onEdit={setEditing}
          onDelete={setDeleting}
          initialSort={[{ id: 'name', desc: false }]}
          toolbar={
            <Chips
              label="Filter by status"
              value={status}
              onChange={(next) => setParams(next === 'all' ? {} : { status: next }, { replace: true })}
              options={[
                { value: 'all', label: 'All', count: contacts.length },
                ...STATUSES.map((s) => ({ value: s.key, label: s.label, count: count(s.key) })),
              ]}
            />
          }
          empty={
            contacts.length === 0 || status === 'all' ? (
              <EmptyState message="No contacts yet. Add a lead or a customer to get started." action={add} />
            ) : (
              <EmptyState message={`No ${statusLabel(status).toLowerCase()} contacts right now.`} />
            )
          }
        />
      </PageState>
      <ContactSheet
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        contact={editing ?? undefined}
      />
      <DeleteContact contact={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </>
  );
}
