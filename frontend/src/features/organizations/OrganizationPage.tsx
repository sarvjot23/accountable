import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { money, plural } from '../../lib/format';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { Panel } from '../../ui/Panel';
import { PageState } from '../../ui/PageState';
import { MiniTable, RecordColumns, RecordHeader, recordStyles } from '../../ui/Record';
import { ContactSheet } from '../contacts/ContactForm';
import { StatusChip } from '../contacts/StatusChip';
import { DealSheet } from '../deals/DealForm';
import { StageChip } from '../deals/StageChip';
import { useOrganization } from './api';
import { DeleteOrganization, OrganizationSheet } from './OrganizationForm';

/** An organization's page: details and notes, its contacts and its deals (REC-1, REC-2). */
export function OrganizationPage() {
  const id = Number(useParams().id);
  const query = useOrganization(id);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingContact, setAddingContact] = useState(false);
  const [addingDeal, setAddingDeal] = useState(false);
  const org = query.data;

  return (
    <PageState query={query}>
      {org && (
        <>
          <RecordHeader
            kind="Organization"
            title={org.name}
            onEdit={() => setEditing(true)}
            onDelete={() => setDeleting(true)}
            facts={[
              { label: 'Industry', value: org.industry ?? '–' },
              {
                label: 'Website',
                value: org.website ? (
                  <a href={org.website} target="_blank" rel="noreferrer">
                    {org.website.replace(/^https?:\/\//, '')}
                  </a>
                ) : (
                  '–'
                ),
              },
              { label: 'Contacts', value: <span className="mono">{org.contacts_count}</span> },
              {
                label: 'Open deals',
                value: (
                  <span className="mono">
                    {org.open_deals_count} · {money(org.open_value)}
                  </span>
                ),
              },
            ]}
          />
          <RecordColumns
            left={
              <Panel title="Notes">
                {org.notes ? (
                  <p className={recordStyles.notes}>{org.notes}</p>
                ) : (
                  <p className={recordStyles.muted}>No notes yet. Use Edit to add some.</p>
                )}
              </Panel>
            }
            right={
              <>
                <Panel
                  title="Contacts"
                  sub={plural(org.contacts.length, 'contact')}
                  actions={
                    <Button
                      size="small"
                      variant="light"
                      className={recordStyles.soft}
                      onClick={() => setAddingContact(true)}
                    >
                      <Plus aria-hidden /> Add contact
                    </Button>
                  }
                >
                  {org.contacts.length === 0 ? (
                    <EmptyState message="No contacts here yet. Add the people you deal with." />
                  ) : (
                    <MiniTable head={['Name', 'Job title', 'Status']}>
                      {org.contacts.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <Link to={`/contacts/${c.id}`}>{c.name}</Link>
                          </td>
                          <td className={recordStyles.muted}>{c.job_title ?? '–'}</td>
                          <td>
                            <StatusChip status={c.status} />
                          </td>
                        </tr>
                      ))}
                    </MiniTable>
                  )}
                </Panel>
                <Panel
                  title="Deals"
                  sub={plural(org.deals.length, 'deal')}
                  actions={
                    <Button
                      size="small"
                      variant="light"
                      className={recordStyles.soft}
                      onClick={() => setAddingDeal(true)}
                    >
                      <Plus aria-hidden /> Add deal
                    </Button>
                  }
                >
                  {org.deals.length === 0 ? (
                    <EmptyState message="No deals with this organization yet." />
                  ) : (
                    <MiniTable head={['Deal', 'Stage', 'Value']}>
                      {org.deals.map((d) => (
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
          />
          <OrganizationSheet open={editing} onOpenChange={setEditing} organization={org} />
          <DeleteOrganization
            organization={deleting ? org : null}
            onOpenChange={setDeleting}
            onDeleted={() => navigate('/organizations')}
          />
          <ContactSheet open={addingContact} onOpenChange={setAddingContact} preset={{ organization_id: org.id }} />
          <DealSheet open={addingDeal} onOpenChange={setAddingDeal} preset={{ organization_id: org.id }} />
        </>
      )}
    </PageState>
  );
}
