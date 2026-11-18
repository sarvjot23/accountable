// A contact's page (REC-1, REC-3).
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { contact, deal, organization } from '../../test/fixtures';
import { mockApi, renderWithApp } from '../../test/render';
import type { ContactDetail } from './api';
import { ContactPage } from './ContactPage';

function detail(fields: Partial<ContactDetail> = {}): ContactDetail {
  return {
    ...contact({
      id: 1,
      name: 'Sam Patel',
      status: 'qualified',
      email: 'sam@northwind.com',
      phone: '555-0100',
      job_title: 'CTO',
    }),
    deals: [deal({ id: 7, name: 'Cloud migration', stage: 'proposal', value: 24000 })],
    ...fields,
  };
}

function setup(record: ContactDetail | (() => never) = detail()) {
  const fetchMock = mockApi({
    'GET /contacts/1': record,
    'GET /contacts/1/timeline': [],
    'GET /contacts/1/delete-impact': { activities: 0, deals: 1 },
    'DELETE /contacts/1': null,
    'GET /organizations': [organization({ id: 1, name: 'Northwind Labs' })],
    'GET /contacts': [],
  });
  renderWithApp(
    <Routes>
      <Route path="/contacts/:id" element={<ContactPage />} />
      <Route path="/contacts" element={<p>All contacts</p>} />
    </Routes>,
    { route: '/contacts/1' },
  );
  return fetchMock;
}

describe('ContactPage', () => {
  it('[REC-3] shows the details with a status chip, a link to the organization, and their deals', async () => {
    setup();
    const header = await screen.findByRole('region', { name: 'Contact details' });
    expect(within(header).getByRole('heading', { name: 'Sam Patel' })).toBeInTheDocument();
    expect(within(header).getByText('Qualified')).toBeInTheDocument();
    expect(within(header).getByRole('link', { name: 'Northwind Labs' })).toHaveAttribute('href', '/organizations/1');
    expect(screen.getByRole('link', { name: 'sam@northwind.com' })).toHaveAttribute('href', 'mailto:sam@northwind.com');
    expect(screen.getByText('555-0100')).toBeInTheDocument();
    expect(screen.getByText('1 deal as main contact')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cloud migration' })).toHaveAttribute('href', '/deals/7');
    expect(screen.getByText('US$24,000')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Log activity/ })).toBeInTheDocument();
  });

  it('[REC-3] shows dashes and no Add deal when the contact has no details or organization', async () => {
    setup(
      detail({ email: null, phone: null, job_title: null, organization_id: null, organization_name: null, deals: [] }),
    );
    expect(await screen.findByText('No deals with this contact yet.')).toBeInTheDocument();
    expect(screen.getAllByText('–')).toHaveLength(3);
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add deal' })).not.toBeInTheDocument();
  });

  it('[REC-1] opens the edit form from the header', async () => {
    setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    expect(await screen.findByRole('dialog', { name: 'Edit contact' })).toBeInTheDocument();
    expect(screen.getByLabelText('First name')).toHaveValue('Sam');
  });

  it('[REC-1] deletes the contact and goes back to the list', async () => {
    const fetchMock = setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(await within(dialog).findByText(/1 deal stays with no main contact/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('All contacts')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/contacts/1', expect.objectContaining({ method: 'DELETE' }));
  });

  it('opens a deal form preset with the contact', async () => {
    setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Add deal' }));
    expect(await screen.findByRole('dialog', { name: 'Add deal' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Organization' })).toHaveTextContent('Northwind Labs'),
    );
  });

  it('says so when the contact cannot be loaded', async () => {
    setup(() => {
      throw new Error('We couldn’t find that contact');
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t find that contact');
  });
});
