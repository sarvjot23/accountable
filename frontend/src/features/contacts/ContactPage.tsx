import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { money, plural } from '../../lib/format';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { Panel } from '../../ui/Panel';
import { PageState } from '../../ui/PageState';
import { MiniTable, RecordColumns, RecordHeader, recordStyles } from '../../ui/Record';
import { Timeline } from '../activities/Timeline';
import { DealSheet } from '../deals/DealForm';
import { StageChip } from '../deals/StageChip';
import { useContact } from './api';
import { ContactSheet, DeleteContact } from './ContactForm';
import { StatusChip } from './StatusChip';

/** A contact's page: details, their organization and deals, and their timeline (REC-1, REC-3). */
export function ContactPage() {
  const id = Number(useParams().id);
  const query = useContact(id);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingDeal, setAddingDeal] = useState(false);
  const contact = query.data;

  return (
    <PageState query={query}>
      {contact && (
        <>
          <RecordHeader
            kind="Contact"
            title={contact.name}
            chips={
              <>
                <StatusChip status={contact.status} />
                {contact.job_title && <span className={recordStyles.muted}>{contact.job_title}</span>}
                {contact.organization_id && (
                  <Link to={`/organizations/${contact.organization_id}`}>{contact.organization_name}</Link>
                )}
              </>
            }
            onEdit={() => setEditing(true)}
            onDelete={() => setDeleting(true)}
          />
          <RecordColumns
            left={
              <>
                <Panel title="Details">
                  <dl className={recordStyles.list}>
                    <dt>Email</dt>
                    <dd>{contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : '–'}</dd>
                    <dt>Phone</dt>
                    <dd className="mono">{contact.phone ?? '–'}</dd>
                    <dt>Job title</dt>
                    <dd>{contact.job_title ?? '–'}</dd>
                    <dt>Organization</dt>
                    <dd>
                      {contact.organization_id ? (
                        <Link to={`/organizations/${contact.organization_id}`}>{contact.organization_name}</Link>
                      ) : (
                        'None'
                      )}
                    </dd>
                    <dt>Status</dt>
                    <dd>
                      <StatusChip status={contact.status} />
                    </dd>
                  </dl>
                </Panel>
                <Panel
                  title="Deals"
                  sub={plural(contact.deals.length, 'deal') + ' as main contact'}
                  actions={
                    contact.organization_id ? (
                      <Button size="small" variant="light" className={recordStyles.soft} onClick={() => setAddingDeal(true)}>
                        <Plus aria-hidden /> Add deal
                      </Button>
                    ) : undefined
                  }
                >
                  {contact.deals.length === 0 ? (
                    <EmptyState message="No deals with this contact yet." />
                  ) : (
                    <MiniTable head={['Deal', 'Stage', 'Value']}>
                      {contact.deals.map((d) => (
                        <tr key={d.id}>
                          <td>
                            <Link to={`/deals/${d.id}`}>{d.name}</Link>
                          </td>
                          <td>
                            <StageChip stage={d.stage} />
                          </td>
                          <td className={recordStyles.mono}>{money(d.value)}</td>
                        </tr>
                      ))}
                    </MiniTable>
                  )}
                </Panel>
              </>
            }
            right={<Timeline kind="contacts" id={contact.id} preset={{ contact_id: contact.id }} />}
          />
          <ContactSheet open={editing} onOpenChange={setEditing} contact={contact} />
          <DeleteContact
            contact={deleting ? contact : null}
            onOpenChange={setDeleting}
            onDeleted={() => navigate('/contacts')}
          />
          <DealSheet
            open={addingDeal}
            onOpenChange={setAddingDeal}
            preset={{ organization_id: contact.organization_id ?? undefined, contact_id: contact.id }}
          />
        </>
      )}
    </PageState>
  );
}
