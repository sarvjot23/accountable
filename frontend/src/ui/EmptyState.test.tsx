// Empty states say what to do next (DASH-15).
import { screen } from '@testing-library/react';
import { FollowUps } from '../features/dashboard/FollowUps';
import { RecentActivity } from '../features/dashboard/RecentActivity';
import { Timeline } from '../features/activities/Timeline';
import { OrganizationsPage } from '../features/organizations/OrganizationsPage';
import { ContactsPage } from '../features/contacts/ContactsPage';
import { DealsPage } from '../features/deals/DealsPage';
import { mockApi, renderWithApp } from '../test/render';

describe('empty states (DASH-15)', () => {
  it('follow-ups say how to add one', () => {
    renderWithApp(<FollowUps followUps={{ overdue: 0, due_today: 0, upcoming: 0, items: [] }} />);
    expect(screen.getByText('No follow-ups due. Log an activity from a contact or deal.')).toBeInTheDocument();
  });

  it('recent activity says what will show there', () => {
    renderWithApp(<RecentActivity activities={[]} />);
    expect(screen.getByText(/Activities you log, and stage changes, show up here/)).toBeInTheDocument();
  });

  it('a timeline says what to log', async () => {
    mockApi({ 'GET /contacts/1/timeline': [] });
    renderWithApp(<Timeline kind="contacts" id={1} preset={{ contact_id: 1 }} />);
    expect(await screen.findByText(/Nothing logged yet\. Log a call, an email or a note/)).toBeInTheDocument();
  });

  it.each([
    ['organizations', <OrganizationsPage />, 'No organizations yet. Add the first company you work with.', 'Add organization'],
    ['contacts', <ContactsPage />, 'No contacts yet. Add a lead or a customer to get started.', 'Add contact'],
    ['deals', <DealsPage />, "No deals yet. Add the first sale you're working on.", 'Add deal'],
  ])('the %s table says what to add', async (kind, page, message, button) => {
    mockApi({ [`GET /${kind}`]: [] });
    renderWithApp(page);
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: button }).length).toBe(2);
  });
});
