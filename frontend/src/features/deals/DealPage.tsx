import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { cx } from '../../lib/cx';
import { date, money, percent } from '../../lib/format';
import { Panel } from '../../ui/Panel';
import { PageState } from '../../ui/PageState';
import { RecordColumns, RecordHeader, recordStyles } from '../../ui/Record';
import { Timeline } from '../activities/Timeline';
import { useDeal } from './api';
import { DealSheet, DeleteDeal } from './DealForm';
import styles from './Deals.module.css';
import { LateChip } from './LateChip';
import { StageChip } from './StageChip';
import { StageSelector } from './StageSelector';

/** A deal's page: its figures, the stage selector and its timeline (REC-4, REC-5). */
export function DealPage() {
  const id = Number(useParams().id);
  const query = useDeal(id);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deal = query.data;

  return (
    <PageState query={query}>
      {deal && (
        <>
          <RecordHeader
            kind="Deal"
            title={deal.name}
            chips={
              <>
                <StageChip stage={deal.stage} />
                {deal.is_late && <LateChip />}
                <Link to={`/organizations/${deal.organization_id}`}>{deal.organization_name}</Link>
              </>
            }
            onEdit={() => setEditing(true)}
            onDelete={() => setDeleting(true)}
          >
            <StageSelector deal={deal} />
          </RecordHeader>
          <RecordColumns
            left={
              <Panel title="Details">
                <dl className={recordStyles.list}>
                  <dt>Stage</dt>
                  <dd>
                    <StageChip stage={deal.stage} />
                  </dd>
                  <dt>Value</dt>
                  <dd className="mono">{money(deal.value)}</dd>
                  <dt>Probability</dt>
                  <dd className="mono">
                    {percent(deal.probability)}
                    {deal.probability_manual && <span className={styles.manual}> · set by hand</span>}
                  </dd>
                  <dt>Expected revenue</dt>
                  <dd className="mono">{money(deal.expected_revenue)}</dd>
                  <dt>Close date</dt>
                  <dd>
                    {deal.close_date ? (
                      <span className={styles.close}>
                        <span className={cx('mono', deal.is_late && styles.late)}>{date(deal.close_date)}</span>
                        {deal.is_late && <LateChip />}
                      </span>
                    ) : (
                      '–'
                    )}
                  </dd>
                  <dt>Organization</dt>
                  <dd>
                    <Link to={`/organizations/${deal.organization_id}`}>{deal.organization_name}</Link>
                  </dd>
                  <dt>Main contact</dt>
                  <dd>
                    {deal.contact_id ? <Link to={`/contacts/${deal.contact_id}`}>{deal.contact_name}</Link> : 'None'}
                  </dd>
                </dl>
              </Panel>
            }
            right={<Timeline kind="deals" id={deal.id} preset={{ deal_id: deal.id, contact_id: deal.contact_id }} />}
          />
          <DealSheet open={editing} onOpenChange={setEditing} deal={deal} />
          <DeleteDeal deal={deleting ? deal : null} onOpenChange={setDeleting} onDeleted={() => navigate('/deals')} />
        </>
      )}
    </PageState>
  );
}
