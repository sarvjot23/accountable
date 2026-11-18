// Timelines (REC-6, REC-8).
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { activity } from '../../test/fixtures';
import { mockApi, renderWithApp } from '../../test/render';
import { Timeline } from './Timeline';

const entries = [
  activity({
    id: 3,
    type: 'stage_change',
    description: 'Moved from Proposal to Negotiation',
    occurred_at: '2026-11-16T10:00:00Z',
    deal_id: 7,
    deal_name: 'Cloud migration',
    from_stage: 'proposal',
    to_stage: 'negotiation',
  }),
  activity({
    id: 2,
    type: 'call',
    description: 'Called about budget',
    occurred_at: '2026-11-12T10:00:00Z',
    follow_up_date: '2026-11-14',
    follow_up_status: 'overdue',
  }),
  activity({ id: 1, type: 'email', description: 'Sent the SOW', occurred_at: '2026-11-01T10:00:00Z' }),
];

function setup() {
  mockApi({ 'GET /contacts/1/timeline': entries, 'GET /contacts': [], 'GET /deals': [] });
  renderWithApp(<Timeline kind="contacts" id={1} preset={{ contact_id: 1 }} />);
}

describe('Timeline', () => {
  it('[REC-6] shows entries newest first, as the API sends them', async () => {
    setup();
    const items = await screen.findAllByTestId('timeline-entry');
    expect(items.map((i) => within(i).getByText(/Moved|Called|Sent/).textContent)).toEqual([
      'Moved from Proposal to Negotiation',
      'Called about budget',
      'Sent the SOW',
    ]);
  });

  it('[REC-6] has an icon per type, its other linked record and its follow-up', async () => {
    setup();
    const [stageChange, call, email] = await screen.findAllByTestId('timeline-entry');
    expect(within(stageChange!).getByText('Stage change')).toBeInTheDocument();
    expect(within(call!).getByText('Call')).toBeInTheDocument();
    expect(within(email!).getByText('Email')).toBeInTheDocument();
    expect(within(stageChange!).getByRole('link', { name: 'Cloud migration' })).toHaveAttribute('href', '/deals/7');
    expect(within(call!).getByRole('checkbox', { name: /Done/ })).toBeInTheDocument();
    expect(within(call!).getByText(/overdue/)).toBeInTheDocument();
  });

  it('[REC-8] edits a stage change only in its words and time', async () => {
    setup();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Actions for Moved from Proposal to Negotiation' }),
    );
    await userEvent.click(await screen.findByRole('menuitem', { name: /Edit/ }));
    expect(await screen.findByRole('heading', { name: 'Edit stage change' })).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toHaveValue('Moved from Proposal to Negotiation');
    expect(screen.getByLabelText('When')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Type' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Contact' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Deal' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Follow-up date')).not.toBeInTheDocument();
  });

  it('[REC-8] says deleting a stage change leaves the deal in its stage', async () => {
    setup();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Actions for Moved from Proposal to Negotiation' }),
    );
    await userEvent.click(await screen.findByRole('menuitem', { name: /Delete/ }));
    expect(
      await screen.findByText('Only the entry is deleted. The deal stays in its current stage.'),
    ).toBeInTheDocument();
  });

  it('[REC-6] shows the contact on a deal’s timeline, and a follow-up due today', async () => {
    mockApi({
      'GET /deals/7/timeline': [
        activity({
          id: 4,
          description: 'Call back',
          contact_id: 9,
          contact_name: 'Ava Grant',
          follow_up_date: '2026-11-18',
          follow_up_status: 'today',
        }),
      ],
      'GET /contacts': [],
      'GET /deals': [],
    });
    renderWithApp(<Timeline kind="deals" id={7} preset={{ deal_id: 7 }} />);
    const entry = await screen.findByTestId('timeline-entry');
    expect(within(entry).getByRole('link', { name: 'Ava Grant' })).toHaveAttribute('href', '/contacts/9');
    expect(within(entry).getByText(/today/)).toBeInTheDocument();
  });

  it('[REC-6] says what to do when nothing is logged yet', async () => {
    mockApi({ 'GET /contacts/1/timeline': [], 'GET /contacts': [], 'GET /deals': [] });
    renderWithApp(<Timeline kind="contacts" id={1} preset={{ contact_id: 1 }} />);
    expect(
      await screen.findByText('Nothing logged yet. Log a call, an email or a note to start the history.'),
    ).toBeInTheDocument();
  });

  it('[REC-10] opens the Log activity form from the timeline', async () => {
    setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Log activity' }));
    expect(await screen.findByRole('heading', { name: 'Log activity' })).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toHaveValue('');
  });

  it('[REC-8] deletes an activity after asking', async () => {
    const fetchMock = mockApi({
      'GET /contacts/1/timeline': entries,
      'GET /contacts': [],
      'GET /deals': [],
      'DELETE /activities/1': null,
    });
    renderWithApp(<Timeline kind="contacts" id={1} preset={{ contact_id: 1 }} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Actions for Sent the SOW' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Delete/ }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete this activity?' });
    expect(within(dialog).getByText('Only this activity is deleted.')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Activity deleted')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith('/api/activities/1', expect.objectContaining({ method: 'DELETE' }));
  });
});
