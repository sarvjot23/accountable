// The contact sheet and delete dialog (FORM-1, FORM-2, FORM-5, DATA-3, DEL-1, RULE-9).
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { contact, organization } from '../../test/fixtures';
import { mockApi, renderWithApp } from '../../test/render';
import { ContactSheet, DeleteContact } from './ContactForm';

const orgs = [
  organization({ id: 1, name: 'Northwind Labs', industry: 'Logistics' }),
  organization({ id: 2, name: 'Harbor Finance', industry: 'Banking' }),
];

function setup(props: Partial<Parameters<typeof ContactSheet>[0]> = {}, save?: (body: unknown) => unknown) {
  const saved: unknown[] = [];
  const handler = (body: unknown) => {
    saved.push(body);
    return save ? save(body) : contact({ id: 1 });
  };
  mockApi({ 'GET /organizations': orgs, 'POST /contacts': handler, 'PUT /contacts/1': handler });
  const onOpenChange = vi.fn();
  renderWithApp(<ContactSheet open onOpenChange={onOpenChange} {...props} />);
  return { saved, onOpenChange };
}

describe('ContactSheet', () => {
  it('[FORM-1] says what is missing or wrong in plain words', async () => {
    const { saved } = setup();
    expect(screen.getByRole('dialog', { name: 'Add contact' })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Email'), 'sam@northwind');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Enter a first name')).toBeInTheDocument();
    expect(screen.getByText('Enter an email address, such as sam@northwind.com')).toBeInTheDocument();
    expect(saved).toHaveLength(0);
  });

  it('[DATA-3] starts a new contact as a lead, and [FORM-2] picks the organization by searching', async () => {
    const { saved, onOpenChange } = setup();
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveTextContent('Lead');
    await userEvent.type(screen.getByLabelText('First name'), 'Ava');
    await userEvent.click(screen.getByRole('combobox', { name: 'Organization' }));
    await userEvent.type(await screen.findByPlaceholderText('Type to search'), 'harbor');
    await userEvent.click(await screen.findByRole('option', { name: /Harbor Finance/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(saved[0]).toEqual({
      first_name: 'Ava',
      last_name: null,
      email: null,
      phone: null,
      job_title: null,
      organization_id: 2,
      status: 'lead',
    });
    expect(await screen.findByText('Contact saved')).toBeInTheDocument();
  });

  it('[FORM-5] edits a contact, starting from what is saved', async () => {
    const sam = contact({ id: 1, first_name: 'Sam', last_name: 'Patel', email: 'sam@northwind.com', job_title: 'CTO' });
    const { saved, onOpenChange } = setup({ contact: sam });
    expect(screen.getByRole('dialog', { name: 'Edit contact' })).toBeInTheDocument();
    expect(screen.getByLabelText('First name')).toHaveValue('Sam');
    expect(screen.getByLabelText('Email')).toHaveValue('sam@northwind.com');
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Organization' })).toHaveTextContent('Northwind Labs'),
    );

    await userEvent.click(screen.getByRole('combobox', { name: 'Status' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Customer' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(saved[0]).toMatchObject({ first_name: 'Sam', last_name: 'Patel', job_title: 'CTO', status: 'customer' });
  });

  it('presets the organization when added from an organization’s page', async () => {
    setup({ preset: { organization_id: 2 } });
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Organization' })).toHaveTextContent('Harbor Finance'),
    );
  });

  it('[FORM-1] keeps the sheet open and explains when the save fails', async () => {
    const { onOpenChange } = setup({}, () => {
      throw new Error('That email is already used by another contact');
    });
    await userEvent.type(screen.getByLabelText('First name'), 'Ava');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('That email is already used by another contact')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('[FORM-1] closes on Cancel without saving', async () => {
    const { saved, onOpenChange } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(saved).toHaveLength(0);
  });
});

describe('DeleteContact', () => {
  function setupDelete(impact: { activities: number; deals: number }) {
    const fetchMock = mockApi({ 'GET /contacts/1/delete-impact': impact, 'DELETE /contacts/1': null });
    const onDeleted = vi.fn();
    renderWithApp(
      <DeleteContact contact={{ id: 1, name: 'Sam Patel' }} onOpenChange={vi.fn()} onDeleted={onDeleted} />,
    );
    return { fetchMock, onDeleted };
  }

  it('[RULE-9] says their activities and deals stay', async () => {
    setupDelete({ activities: 2, deals: 1 });
    expect(screen.getByText('Delete Sam Patel?')).toBeInTheDocument();
    expect(
      await screen.findByText(
        'Only the contact is deleted: their 2 activities stay as history and 1 deal stays with no main contact.',
      ),
    ).toBeInTheDocument();
  });

  it('[RULE-9] says when nothing else is linked', async () => {
    setupDelete({ activities: 0, deals: 0 });
    expect(await screen.findByText('Nothing else is linked to them.')).toBeInTheDocument();
  });

  it('[DEL-1] deletes on Delete and says so', async () => {
    const { fetchMock, onDeleted } = setupDelete({ activities: 0, deals: 3 });
    expect(
      await screen.findByText('Only the contact is deleted: 3 deals stay with no main contact.'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith('/api/contacts/1', expect.objectContaining({ method: 'DELETE' }));
    expect(await screen.findByText('Contact deleted')).toBeInTheDocument();
  });
});
