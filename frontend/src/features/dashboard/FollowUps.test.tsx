// The follow-ups panel (DASH-11, DASH-12, DASH-15).
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { activity } from '../../test/fixtures';
import { mockApi, renderWithApp } from '../../test/render';
import type { Dashboard } from './api';
import { FollowUps } from './FollowUps';

type Item = Dashboard['follow_ups']['items'][number];

function followUp(fields: Partial<Item> = {}): Item {
  return activity({ type: 'call', follow_up_date: '2026-11-20', follow_up_status: 'upcoming', ...fields });
}

function followUps(items: Item[]): Dashboard['follow_ups'] {
  return { overdue: 0, due_today: 0, upcoming: items.length, items };
}

describe('FollowUps', () => {
  it('[DASH-15] says what to do when nothing is due', () => {
    renderWithApp(<FollowUps followUps={followUps([])} />);
    expect(screen.getByText('No follow-ups due. Log an activity from a contact or deal.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Follow-ups' })).not.toBeInTheDocument();
  });

  it('[DASH-11] shows each follow-up with its contact or deal, a link to the record and its date', () => {
    const items = [
      followUp({
        id: 1,
        description: 'Send the contract',
        follow_up_status: 'overdue',
        follow_up_date: '2026-11-10',
        deal_id: 4,
        deal_name: 'Cloud migration',
      }),
      followUp({ id: 2, description: 'Call back', follow_up_status: 'today', follow_up_date: '2026-11-17' }),
      followUp({
        id: 3,
        description: 'Check in',
        follow_up_date: '2026-11-25',
        contact_id: 9,
        contact_name: null,
        deal_name: null,
      }),
    ];
    renderWithApp(<FollowUps followUps={followUps(items)} />);
    const rows = within(screen.getByRole('list', { name: 'Follow-ups' })).getAllByRole('listitem');

    expect(rows).toHaveLength(3);
    expect(within(rows[0]!).getByText('Send the contract')).toBeInTheDocument();
    expect(within(rows[0]!).getByRole('link', { name: 'Sam Patel · Cloud migration' })).toHaveAttribute(
      'href',
      '/deals/4',
    );
    expect(within(rows[0]!).getByText('10 Nov')).toBeInTheDocument();

    expect(within(rows[1]!).getByRole('link', { name: 'Sam Patel · Northwind Labs' })).toHaveAttribute(
      'href',
      '/contacts/1',
    );
    expect(within(rows[1]!).getByText('Today')).toBeInTheDocument();

    expect(within(rows[2]!).getByRole('link', { name: 'Northwind Labs' })).toHaveAttribute('href', '/contacts/9');
    expect(within(rows[2]!).getByText('25 Nov')).toBeInTheDocument();
  });

  it('[DASH-11] says when a follow-up is no longer linked to a record', () => {
    renderWithApp(<FollowUps followUps={followUps([followUp({ contact_id: null, deal_id: null })])} />);
    expect(screen.getByText('No longer linked')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('[DASH-11] offers a plain link when the record has no name to show', () => {
    const item = followUp({ contact_name: null, deal_name: null, organization_name: null, contact_id: 3 });
    renderWithApp(<FollowUps followUps={followUps([item])} />);
    expect(screen.getByRole('link', { name: 'Open the record' })).toHaveAttribute('href', '/contacts/3');
  });

  it('[DASH-11] shows up to 8, then all of them on "Show all"', async () => {
    const items = Array.from({ length: 10 }, (_, i) => followUp({ id: i + 1, description: `Task ${i + 1}` }));
    renderWithApp(<FollowUps followUps={followUps(items)} />);
    const list = screen.getByRole('list', { name: 'Follow-ups' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(8);
    expect(screen.queryByText('Task 9')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Show all 10' }));

    expect(within(list).getAllByRole('listitem')).toHaveLength(10);
    expect(screen.getByText('Task 10')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Show all/ })).not.toBeInTheDocument();
  });

  it('[DASH-12] ticking Done marks the follow-up done', async () => {
    const patches: unknown[] = [];
    mockApi({
      'PATCH /activities/5/done': (body: unknown) => {
        patches.push(body);
        return followUp({ id: 5, follow_up_done: true });
      },
    });
    renderWithApp(<FollowUps followUps={followUps([followUp({ id: 5, description: 'Send the contract' })])} />);

    const check = screen.getByRole('checkbox', { name: 'Done: Send the contract' });
    expect(check).not.toBeChecked();
    await userEvent.click(check);

    await waitFor(() => expect(patches).toEqual([{ done: true }]));
    expect(await screen.findByText('Follow-up done')).toBeInTheDocument();
  });
});
