// The recent activity panel (DASH-13, DASH-15).
import { screen, within } from '@testing-library/react';
import { activity } from '../../test/fixtures';
import { renderWithApp } from '../../test/render';
import { RecentActivity } from './RecentActivity';

describe('RecentActivity', () => {
  it('[DASH-15] says what will show up here when there is nothing yet', () => {
    renderWithApp(<RecentActivity activities={[]} />);
    expect(screen.getByText('Nothing yet. Activities you log, and stage changes, show up here.')).toBeInTheDocument();
  });

  it('[DASH-13] shows initials, description, organization and date for each activity, newest first', () => {
    const activities = [
      activity({
        id: 2,
        description: 'Moved to Proposal',
        contact_name: 'Grace Liu',
        occurred_at: '2026-11-16T09:00:00Z',
      }),
      activity({
        id: 1,
        description: 'Spoke about scope',
        organization_id: 7,
        organization_name: 'Harbor Finance',
        occurred_at: '2026-11-03T09:00:00Z',
      }),
    ];
    renderWithApp(<RecentActivity activities={activities} />);
    const rows = within(screen.getByRole('list', { name: 'Recent activity' })).getAllByRole('listitem');

    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('GL');
    expect(within(rows[0]!).getByText('Moved to Proposal')).toBeInTheDocument();
    expect(within(rows[0]!).getByRole('link', { name: 'Northwind Labs' })).toHaveAttribute('href', '/organizations/1');
    expect(within(rows[0]!).getByText('16 Nov')).toBeInTheDocument();
    expect(within(rows[1]!).getByRole('link', { name: 'Harbor Finance' })).toHaveAttribute('href', '/organizations/7');
    expect(within(rows[1]!).getByText('3 Nov')).toBeInTheDocument();
  });

  it('[DASH-13] includes activities no longer linked to anything', () => {
    const orphan = activity({
      contact_id: null,
      contact_name: null,
      deal_name: null,
      organization_id: null,
      organization_name: null,
    });
    renderWithApp(<RecentActivity activities={[orphan]} />);
    const row = screen.getByRole('listitem');
    expect(within(row).getByText('No longer linked')).toBeInTheDocument();
    expect(row).toHaveTextContent('–');
    expect(within(row).queryByRole('link')).not.toBeInTheDocument();
  });

  it('[DASH-13] uses the deal name for the initials when there is no contact', () => {
    renderWithApp(
      <RecentActivity
        activities={[activity({ contact_id: null, contact_name: null, deal_id: 3, deal_name: 'Cloud migration' })]}
      />,
    );
    expect(screen.getByRole('listitem')).toHaveTextContent('CM');
  });
});
