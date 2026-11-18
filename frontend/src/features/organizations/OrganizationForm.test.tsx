// The organization sheet and delete dialog (FORM-1, FORM-5, DEL-1, RULE-8).
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { organization } from '../../test/fixtures';
import { mockApi, renderWithApp } from '../../test/render';
import { DeleteOrganization, OrganizationSheet } from './OrganizationForm';

const orgs = [
  organization({ id: 1, name: 'Northwind Labs', industry: 'Logistics' }),
  organization({ id: 2, name: 'Harbor Finance', industry: 'Banking' }),
  organization({ id: 3, name: 'Atlas Freight', industry: 'Logistics' }),
  organization({ id: 4, name: 'Bluepeak Retail', industry: null }),
];

function setup(props: Partial<Parameters<typeof OrganizationSheet>[0]> = {}, save?: (body: unknown) => unknown) {
  const saved: unknown[] = [];
  const handler = (body: unknown) => {
    saved.push(body);
    return save ? save(body) : organization({ id: 1 });
  };
  mockApi({ 'GET /organizations': orgs, 'POST /organizations': handler, 'PUT /organizations/1': handler });
  const onOpenChange = vi.fn();
  renderWithApp(<OrganizationSheet open onOpenChange={onOpenChange} {...props} />);
  return { saved, onOpenChange };
}

describe('OrganizationSheet', () => {
  it('[FORM-1] says what is missing or wrong in plain words', async () => {
    const { saved } = setup();
    expect(screen.getByRole('dialog', { name: 'Add organization' })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Website'), 'not a website');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Enter a name')).toBeInTheDocument();
    expect(screen.getByText('Enter a web address, such as northwind.com')).toBeInTheDocument();
    expect(saved).toHaveLength(0);
  });

  it('[FORM-5] adds an organization, sending blanks as empty, then closes and says so', async () => {
    const { saved, onOpenChange } = setup();
    await userEvent.type(screen.getByLabelText('Name'), 'Copperline Energy');
    await userEvent.type(screen.getByLabelText('Website'), 'copperline.io');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(saved[0]).toEqual({ name: 'Copperline Energy', website: 'copperline.io', industry: null, notes: null });
    expect(await screen.findByText('Organization saved')).toBeInTheDocument();
  });

  it('suggests the industries already in use, once each', async () => {
    setup();
    await waitFor(() => expect(document.querySelectorAll('datalist option')).toHaveLength(2));
    const suggestions = [...document.querySelectorAll('datalist option')].map((o) => o.getAttribute('value'));
    expect(suggestions).toEqual(['Banking', 'Logistics']);
  });

  it('[FORM-5] edits an organization, starting from what is saved', async () => {
    const northwind = organization({ id: 1, name: 'Northwind Labs', website: 'northwind.com', notes: 'Met at a fair' });
    const { saved, onOpenChange } = setup({ organization: northwind });
    expect(screen.getByRole('dialog', { name: 'Edit organization' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Northwind Labs');
    expect(screen.getByLabelText('Notes')).toHaveValue('Met at a fair');
    await userEvent.clear(screen.getByLabelText('Industry'));
    await userEvent.type(screen.getByLabelText('Industry'), 'Shipping');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(saved[0]).toEqual({
      name: 'Northwind Labs',
      website: 'northwind.com',
      industry: 'Shipping',
      notes: 'Met at a fair',
    });
  });

  it('[FORM-1] keeps the sheet open and explains when the save fails', async () => {
    const { onOpenChange } = setup({}, () => {
      throw new Error('An organization with that name already exists');
    });
    await userEvent.type(screen.getByLabelText('Name'), 'Northwind Labs');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('An organization with that name already exists')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('[FORM-1] closes on Cancel without saving', async () => {
    const { saved, onOpenChange } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(saved).toHaveLength(0);
  });
});

describe('DeleteOrganization', () => {
  function setupDelete(impact: { contacts: number; deals: number; activities: number }) {
    const fetchMock = mockApi({ 'GET /organizations/1/delete-impact': impact, 'DELETE /organizations/1': null });
    const onDeleted = vi.fn();
    renderWithApp(
      <DeleteOrganization
        organization={{ id: 1, name: 'Northwind Labs' }}
        onOpenChange={vi.fn()}
        onDeleted={onDeleted}
      />,
    );
    return { fetchMock, onDeleted };
  }

  it('[RULE-8] names the counts of what goes with it', async () => {
    setupDelete({ contacts: 3, deals: 2, activities: 11 });
    expect(screen.getByText('Delete Northwind Labs?')).toBeInTheDocument();
    expect(await screen.findByText('This also deletes 3 contacts, 2 deals and 11 activities.')).toBeInTheDocument();
  });

  it('[RULE-8] says when nothing else is linked', async () => {
    setupDelete({ contacts: 0, deals: 0, activities: 0 });
    expect(await screen.findByText('Nothing else is linked to it.')).toBeInTheDocument();
  });

  it('[DEL-1] deletes on Delete and says so', async () => {
    const { fetchMock, onDeleted } = setupDelete({ contacts: 1, deals: 0, activities: 0 });
    expect(await screen.findByText('This also deletes 1 contact, 0 deals and 0 activities.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith('/api/organizations/1', expect.objectContaining({ method: 'DELETE' }));
    expect(await screen.findByText('Organization deleted')).toBeInTheDocument();
  });
});
