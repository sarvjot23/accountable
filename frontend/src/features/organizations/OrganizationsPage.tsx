import { createColumnHelper } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { money, plural } from '../../lib/format';
import { Button } from '../../ui/Button';
import { DataTable } from '../../ui/DataTable';
import { EmptyState } from '../../ui/EmptyState';
import { PageHeader } from '../../ui/PageHeader';
import { PageState } from '../../ui/PageState';
import { useOrganizations, type Organization } from './api';
import { DeleteOrganization, OrganizationSheet } from './OrganizationForm';

const column = createColumnHelper<Organization>();

/** Organizations columns (TBL-8). */
const columns = [
  column.accessor('name', {
    header: 'Name',
    cell: (info) => (
      <Link to={`/organizations/${info.row.original.id}`} onClick={(e) => e.stopPropagation()} className="row-link">
        {info.getValue()}
      </Link>
    ),
  }),
  column.accessor((o) => o.industry ?? '', { id: 'industry', header: 'Industry' }),
  column.accessor((o) => (o.website ?? '').replace(/^https?:\/\//, ''), {
    id: 'website',
    header: 'Website',
    cell: (info) =>
      info.getValue() ? (
        <a href={info.row.original.website!} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
          {info.getValue()}
        </a>
      ) : null,
  }),
  column.accessor('contacts_count', { header: 'Contacts', meta: { numeric: true } }),
  column.accessor('open_deals_count', { header: 'Open deals', meta: { numeric: true } }),
  column.accessor('open_value', {
    header: 'Open value',
    meta: { numeric: true },
    cell: (info) => money(info.getValue()),
  }),
];

export function OrganizationsPage() {
  const query = useOrganizations();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<Organization | null | undefined>(undefined); // null = adding
  const [deleting, setDeleting] = useState<Organization | null>(null);
  const organizations = query.data ?? [];
  const openValue = organizations.reduce((sum, o) => sum + o.open_value, 0);

  const add = (
    <Button variant="primary" onClick={() => setEditing(null)}>
      <Plus aria-hidden /> Add organization
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Organizations"
        summary={
          <>
            {plural(organizations.length, 'organization')} · <b>{money(openValue)}</b> in open deals
          </>
        }
        actions={add}
      />
      <PageState query={query}>
        <DataTable
          data={organizations}
          columns={columns}
          searchLabel="Search organizations"
          rowLabel={(o) => o.name}
          onOpen={(o) => navigate(`/organizations/${o.id}`)}
          onEdit={setEditing}
          onDelete={setDeleting}
          initialSort={[{ id: 'name', desc: false }]}
          empty={<EmptyState message="No organizations yet. Add the first company you work with." action={add} />}
        />
      </PageState>
      <OrganizationSheet
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        organization={editing ?? undefined}
      />
      <DeleteOrganization organization={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </>
  );
}
