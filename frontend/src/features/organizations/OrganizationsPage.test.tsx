// The organizations list (TBL-3 to TBL-5, TBL-7, TBL-8).
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { organization } from '../../test/fixtures';
import { mockApi, renderWithApp } from '../../test/render';
import type { Organization } from './api';
import { OrganizationsPage } from './OrganizationsPage';

const orgs = [
  organization({
    id: 1,
    name: 'Northwind Labs',
    industry: 'Logistics',
    website: 'https://northwind.com',
    contacts_count: 3,
    open_deals_count: 2,
    open_value: 30000,
  }),
  organization({ id: 2, name: 'Atlas Freight', industry: null, website: null, open_value: 12000 }),
];

function setup(data: Organization[] = orgs) {
  mockApi({
    'GET /organizations': data,
    'GET /organizations/1/delete-impact': { contacts: 3, deals: 2, activities: 0 },
  });
  renderWithApp(
    <Routes>
      <Route path="/organizations" element={<OrganizationsPage />} />
      <Route path="/organizations/:id" element={<p>Organization page</p>} />
    </Routes>,
    { route: '/organizations' },
  );
}

describe('OrganizationsPage', () => {
  it('[TBL-8] lists organizations with their counts and open value, sorted by name', async () => {
    setup();
    const header = await screen.findByText(/2 organizations/);
    expect(header).toHaveTextContent('2 organizations · US$42,000 in open deals');
    const headings = screen.getAllByRole('columnheader').map((h) => h.textContent);
    expect(headings.slice(0, 6)).toEqual(['Name', 'Industry', 'Website', 'Contacts', 'Open deals', 'Open value']);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows.map((r) => within(r).getAllByRole('cell')[0]!.textContent)).toEqual([
      'Atlas Freight',
      'Northwind Labs',
    ]);
    const northwind = within(rows[1]!);
    expect(northwind.getByRole('link', { name: 'northwind.com' })).toHaveAttribute('href', 'https://northwind.com');
    expect(northwind.getByText('US$30,000')).toBeInTheDocument();
    expect(within(rows[0]!).getAllByRole('link')).toHaveLength(1);
  });

  it('[TBL-7] shows a short message and the Add button when there are none', async () => {
    setup([]);
    expect(await screen.findByText('No organizations yet. Add the first company you work with.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Add organization' })).toHaveLength(2);
  });

  it('[TBL-3] opens the add form in a side sheet', async () => {
    setup();
    await screen.findByText('Atlas Freight');
    await userEvent.click(screen.getByRole('button', { name: 'Add organization' }));
    expect(await screen.findByRole('dialog', { name: 'Add organization' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('[TBL-4] edits and deletes from the row menu', async () => {
    setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Actions for Northwind Labs' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Edit/ }));
    expect(await screen.findByRole('dialog', { name: 'Edit organization' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Northwind Labs');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await userEvent.click(screen.getByRole('button', { name: 'Actions for Northwind Labs' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Delete/ }));
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('Delete Northwind Labs?');
    expect(
      await within(dialog).findByText('This also deletes 3 contacts, 2 deals and 0 activities.'),
    ).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('[TBL-5] opens the organization’s page from a row click', async () => {
    setup();
    await userEvent.click(await screen.findByText('Logistics'));
    expect(await screen.findByText('Organization page')).toBeInTheDocument();
  });
});
