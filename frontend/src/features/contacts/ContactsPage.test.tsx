// The contacts list (TBL-3 to TBL-5, TBL-7, TBL-9, TBL-10).
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { contact } from '../../test/fixtures';
import { mockApi, renderWithApp } from '../../test/render';
import type { Contact } from './api';
import { ContactsPage } from './ContactsPage';

const people = [
  contact({ id: 1, name: 'Sam Patel', status: 'lead', email: 'sam@northwind.com', job_title: 'CTO' }),
  contact({ id: 2, name: 'Ava Grant', status: 'customer', organization_id: 2, organization_name: 'Harbor Finance' }),
  contact({ id: 3, name: 'Zoe Hart', status: 'qualified', organization_id: null, organization_name: null }),
  contact({ id: 4, name: 'Liam Chen', status: 'lead' }),
];

function setup(data: Contact[] = people, route = '/contacts') {
  mockApi({
    'GET /contacts': data,
    'GET /organizations': [],
    'GET /contacts/1/delete-impact': { activities: 0, deals: 0 },
  });
  renderWithApp(
    <Routes>
      <Route path="/contacts" element={<ContactsPage />} />
      <Route path="/contacts/:id" element={<p>Contact page</p>} />
    </Routes>,
    { route },
  );
}

const names = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((r) => within(r).getAllByRole('cell')[0]!.textContent);

describe('ContactsPage', () => {
  it('says “1 lead”, not “1 leads”, in the summary', async () => {
    setup(people.slice(0, 3));
    expect(await screen.findByText('3 contacts: 1 lead, 1 qualified, 1 customer')).toBeInTheDocument();
  });

  it('[TBL-9] lists contacts with their organization, details and a status chip, sorted by name', async () => {
    setup();
    expect(await screen.findByText('4 contacts: 2 leads, 1 qualified, 1 customer')).toBeInTheDocument();
    expect(names()).toEqual(['Ava Grant', 'Liam Chen', 'Sam Patel', 'Zoe Hart']);
    const headings = screen.getAllByRole('columnheader').map((h) => h.textContent);
    expect(headings.slice(0, 6)).toEqual(['Name', 'Organization', 'Job title', 'Email', 'Phone', 'Status']);
    const sam = screen.getByRole('row', { name: /Sam Patel/ });
    expect(within(sam).getByRole('link', { name: 'Northwind Labs' })).toHaveAttribute('href', '/organizations/1');
    expect(within(sam).getByText('sam@northwind.com')).toBeInTheDocument();
    expect(within(sam).getByText('Lead')).toBeInTheDocument();
    const zoe = screen.getByRole('row', { name: /Zoe Hart/ });
    expect(within(zoe).getAllByRole('link')).toHaveLength(1);
  });

  it('[TBL-10] filters by status, with counts', async () => {
    setup();
    const filter = await screen.findByRole('group', { name: 'Filter by status' });
    expect(within(filter).getByRole('button', { name: 'All 4' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(within(filter).getByRole('button', { name: 'Customer 1' }));
    expect(names()).toEqual(['Ava Grant']);
    await userEvent.click(within(filter).getByRole('button', { name: 'All 4' }));
    expect(names()).toHaveLength(4);
  });

  it('[TBL-10] says when no contacts have the chosen status', async () => {
    setup([people[0]!], '/contacts?status=qualified');
    expect(await screen.findByText('No qualified contacts right now.')).toBeInTheDocument();
  });

  it('[TBL-7] shows a short message and the Add button when there are no contacts', async () => {
    setup([]);
    expect(await screen.findByText('No contacts yet. Add a lead or a customer to get started.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Add contact' })).toHaveLength(2);
  });

  it('[TBL-3] opens the add form in a side sheet', async () => {
    setup();
    await screen.findByText('Sam Patel');
    await userEvent.click(screen.getByRole('button', { name: 'Add contact' }));
    expect(await screen.findByRole('dialog', { name: 'Add contact' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('[TBL-4] edits and deletes from the row menu', async () => {
    setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Actions for Sam Patel' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Edit/ }));
    expect(await screen.findByRole('dialog', { name: 'Edit contact' })).toBeInTheDocument();
    expect(screen.getByLabelText('First name')).toHaveValue('Sam');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await userEvent.click(screen.getByRole('button', { name: 'Actions for Sam Patel' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Delete/ }));
    expect(await screen.findByRole('alertdialog')).toHaveTextContent('Delete Sam Patel?');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('[TBL-5] opens the contact’s page from a row click', async () => {
    setup();
    await userEvent.click(await screen.findByText('CTO'));
    expect(await screen.findByText('Contact page')).toBeInTheDocument();
  });
});
