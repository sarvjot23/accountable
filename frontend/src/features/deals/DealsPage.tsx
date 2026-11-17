import { createColumnHelper } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { cx } from '../../lib/cx';
import { date, money, percent, plural } from '../../lib/format';
import { OPEN_STAGES, STAGES } from '../../lib/stages';
import { Button } from '../../ui/Button';
import { Chips, ToggleChip } from '../../ui/Chips';
import { DataTable } from '../../ui/DataTable';
import { EmptyState } from '../../ui/EmptyState';
import { PageHeader } from '../../ui/PageHeader';
import { PageState } from '../../ui/PageState';
import { useDeals, type Deal } from './api';
import { DealSheet, DeleteDeal } from './DealForm';
import styles from './Deals.module.css';
import { LateChip } from './LateChip';
import { StageChip } from './StageChip';

const column = createColumnHelper<Deal>();
const stageIndex = (key: string) => STAGES.findIndex((s) => s.key === key);

/** Deals columns (TBL-11), with the late chip and date in Raspberry (TBL-13). */
const columns = [
  column.accessor('name', {
    header: 'Name',
    cell: (info) => (
      <Link to={`/deals/${info.row.original.id}`} onClick={(e) => e.stopPropagation()}>
        {info.getValue()}
      </Link>
    ),
  }),
  column.accessor('organization_name', {
    header: 'Organization',
    cell: (info) => (
      <Link to={`/organizations/${info.row.original.organization_id}`} onClick={(e) => e.stopPropagation()}>
        {info.getValue()}
      </Link>
    ),
  }),
  column.accessor((d) => d.contact_name ?? '', {
    id: 'contact',
    header: 'Contact',
    cell: (info) =>
      info.row.original.contact_id ? (
        <Link to={`/contacts/${info.row.original.contact_id}`} onClick={(e) => e.stopPropagation()}>
          {info.getValue()}
        </Link>
      ) : null,
  }),
  column.accessor((d) => stageIndex(d.stage), {
    id: 'stage',
    header: 'Stage',
    cell: (info) => <StageChip stage={info.row.original.stage} />,
  }),
  column.accessor('value', { header: 'Value', meta: { numeric: true }, cell: (info) => money(info.getValue()) }),
  column.accessor('probability', { header: 'Probability', meta: { numeric: true }, cell: (info) => percent(info.getValue()) }),
  column.accessor('expected_revenue', {
    header: 'Expected revenue',
    meta: { numeric: true },
    cell: (info) => money(info.getValue()),
  }),
  column.accessor((d) => d.close_date ?? '', {
    id: 'close_date',
    header: 'Close date',
    cell: (info) => {
      const deal = info.row.original;
      if (!deal.close_date) return <span className={styles.none}>–</span>;
      return (
        <span className={styles.close}>
          <span className={cx('mono', deal.is_late && styles.late)}>{date(deal.close_date)}</span>
          {deal.is_late && <LateChip />}
        </span>
      );
    },
  }),
];

type StageFilter = 'all' | 'open' | (typeof STAGES)[number]['key'];

export function DealsPage() {
  const query = useDeals();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const stageFilter = (params.get('stage') as StageFilter | null) ?? 'all';
  const lateOnly = params.get('late') === '1';
  const [editing, setEditing] = useState<Deal | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Deal | null>(null);
  const deals = query.data ?? [];

  const shown = deals.filter(
    (d) =>
      (stageFilter === 'all' ||
        (stageFilter === 'open' ? OPEN_STAGES.includes(d.stage) : d.stage === stageFilter)) &&
      (!lateOnly || d.is_late),
  );
  const openDeals = deals.filter((d) => OPEN_STAGES.includes(d.stage));
  const lateCount = deals.filter((d) => d.is_late).length;

  function setFilter(stage: StageFilter, late: boolean) {
    const next: Record<string, string> = {};
    if (stage !== 'all') next.stage = stage;
    if (late) next.late = '1';
    setParams(next, { replace: true });
  }

  const add = (
    <Button variant="primary" onClick={() => setEditing(null)}>
      <Plus aria-hidden /> Add deal
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Deals"
        summary={
          <>
            {plural(openDeals.length, 'open deal')} worth <b>{money(openDeals.reduce((s, d) => s + d.value, 0))}</b>
            {lateCount > 0 && ` · ${lateCount} running late`}
          </>
        }
        actions={add}
      />
      <PageState query={query}>
        <DataTable
          data={shown}
          columns={columns}
          searchLabel="Search deals"
          rowLabel={(d) => d.name}
          onOpen={(d) => navigate(`/deals/${d.id}`)}
          onEdit={setEditing}
          onDelete={setDeleting}
          initialSort={[{ id: 'stage', desc: false }]}
          toolbar={
            <>
              <Chips
                label="Filter by stage"
                value={stageFilter}
                onChange={(stage) => setFilter(stage, lateOnly)}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'open', label: 'Open' },
                  ...STAGES.map((s) => ({ value: s.key, label: s.label })),
                ]}
              />
              <ToggleChip pressed={lateOnly} onChange={(late) => setFilter(stageFilter, late)}>
                Late only
              </ToggleChip>
            </>
          }
          empty={
            deals.length === 0 ? (
              <EmptyState message="No deals yet. Add the first sale you're working on." action={add} />
            ) : (
              <EmptyState
                message={lateOnly ? 'No deals are running late. Nice work.' : 'No deals match this filter.'}
              />
            )
          }
        />
      </PageState>
      <DealSheet open={editing !== undefined} onOpenChange={(open) => !open && setEditing(undefined)} deal={editing ?? undefined} />
      <DeleteDeal deal={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </>
  );
}
