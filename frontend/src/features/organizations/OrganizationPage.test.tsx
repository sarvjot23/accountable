// An organization's page (REC-1, REC-2).
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { contact, deal, organization } from '../../test/fixtures';
import { mockApi, renderWithApp } from '../../test/render';
import type { OrganizationDetail } from './api';
import { OrganizationPage } from './OrganizationPage';

function detail(fields: Partial<OrganizationDetail> = {}): OrganizationDetail {
  return {
    ...organization({
      id: 1,
      name: 'Northwind Labs',
      industry: 'Logistics',
      website: 'https://northwind.com',
      notes: 'Met at the logistics fair.',
      contacts_count: 1,
      open_deals_count: 1,
      open_value: 24000,
    }),
    contacts: [contact({ id: 5, name: 'Sam Patel', job_title: 'CTO', status: 'customer' })],
    deals: [deal({ id: 7, name: 'Cloud migration', stage: 'proposal', value: 24000 })],
    ...fields,
  };
}

function setup(record: OrganizationDetail | (() => never) = detail()) {
  const fetchMock = mockApi({
    'GET /organizations/1': record,
    'GET /organizations/1/delete-impact': { contacts: 1, deals: 1, activities: 4 },
    'DELETE /organizations/1': null,
    'GET /organizations': [organization({ id: 1, name: 'Northwind Labs' })],
    'GET /contacts': [],
  });
  renderWithApp(
    <Routes>
      <Route path="/organizations/:id" element={<OrganizationPage />} />
      <Route path="/organizations" element={<p>All organizations</p>} />
    </Routes>,
    { route: '/organizations/1' },
  );
  return fetchMock;
}

describe('OrganizationPage', () => {
  it('[REC-2] shows the details, notes, contacts and deals', async () => {
    setup();
    const header = await screen.findByRole('region', { name: 'Organization details' });
    expect(within(header).getByRole('heading', { name: 'Northwind Labs' })).toBeInTheDocument();
    expect(within(header).getByText('Logistics')).toBeInTheDocument();
    expect(within(header).getByRole('link', { name: 'northwind.com' })).toHaveAttribute(
      'href',
      'https://northwind.com',
    );
    expect(within(header).getByText('1 · US$24,000')).toBeInTheDocument();
    expect(screen.getByText('Met at the logistics fair.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sam Patel' })).toHaveAttribute('href', '/contacts/5');
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cloud migration' })).toHaveAttribute('href', '/deals/7');
  });

  it('[REC-2] says when there are no notes, contacts or deals yet', async () => {
    setup(detail({ industry: null, website: null, notes: null, contacts: [], deals: [] }));
    expect(await screen.findByText('No notes yet. Use Edit to add some.')).toBeInTheDocument();
    expect(screen.getByText('No contacts here yet. Add the people you deal with.')).toBeInTheDocument();
    expect(screen.getByText('No deals with this organization yet.')).toBeInTheDocument();
    expect(screen.getAllByText('–')).toHaveLength(2);
  });

  it('[REC-1] opens the edit form from the header', async () => {
    setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    expect(await screen.findByRole('dialog', { name: 'Edit organization' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Northwind Labs');
  });

  it('[REC-1] deletes the organization and goes back to the list', async () => {
    const fetchMock = setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(
      await within(dialog).findByText('This also deletes 1 contact, 1 deal and 4 activities.'),
    ).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('All organizations')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/organizations/1', expect.objectContaining({ method: 'DELETE' }));
  });

  it('[REC-2] adds a contact with the organization preset', async () => {
    setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Add contact' }));
    expect(await screen.findByRole('dialog', { name: 'Add contact' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Organization' })).toHaveTextContent('Northwind Labs'),
    );
  });

  it('[REC-2] adds a deal with the organization preset', async () => {
    setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Add deal' }));
    expect(await screen.findByRole('dialog', { name: 'Add deal' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Organization' })).toHaveTextContent('Northwind Labs'),
    );
  });

  it('says so when the organization cannot be loaded', async () => {
    setup(() => {
      throw new Error('We couldn’t find that organization');
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t find that organization');
  });
});
