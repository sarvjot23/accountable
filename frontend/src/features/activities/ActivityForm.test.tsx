// The Log activity form (REC-10).
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { activity, contact, deal } from '../../test/fixtures';
import { mockApi, renderWithApp } from '../../test/render';
import type { Activity } from './api';
import { ActivityForm } from './ActivityForm';

function setup(props: Partial<Parameters<typeof ActivityForm>[0]> = {}) {
  const saved: Partial<Activity>[] = [];
  const save = (body: Partial<Activity>) => {
    saved.push(body);
    return activity(body);
  };
  mockApi({
    'GET /contacts': [contact({ id: 1, name: 'Sam Patel' })],
    'GET /deals': [deal({ id: 7, name: 'Cloud migration' })],
    'POST /activities': save,
    'PUT /activities/3': save,
  });
  const onDone = vi.fn();
  renderWithApp(<ActivityForm onDone={onDone} {...props} />);
  return { saved, onDone };
}

describe('ActivityForm (REC-10)', () => {
  it('needs a contact or a deal', async () => {
    const { saved } = setup();
    await userEvent.type(screen.getByLabelText('Description'), 'Called about budget');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Choose a contact, a deal or both')).toBeInTheDocument();
    expect(saved).toHaveLength(0);
  });

  it('is prefilled from the page, and the follow-up is optional', async () => {
    const { saved, onDone } = setup({ preset: { contact_id: 1, deal_id: 7 } });
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Deal' })).toHaveTextContent('Cloud migration'));
    expect(screen.getByRole('combobox', { name: 'Contact' })).toHaveTextContent('Sam Patel');
    expect(screen.getByLabelText('When')).not.toHaveValue(''); // defaults to now
    await userEvent.type(screen.getByLabelText('Description'), 'Called about budget');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(saved[0]).toMatchObject({ type: 'note', contact_id: 1, deal_id: 7, follow_up_date: null });
  });

  it('takes a type and a follow-up date', async () => {
    const { saved } = setup({ preset: { deal_id: 7 } });
    await userEvent.click(screen.getByRole('combobox', { name: 'Type' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Call' }));
    await userEvent.type(screen.getByLabelText('Description'), 'Called');
    await userEvent.type(screen.getByLabelText('Follow-up date'), '2026-11-20');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saved).toHaveLength(1));
    expect(saved[0]).toMatchObject({ type: 'call', deal_id: 7, contact_id: null, follow_up_date: '2026-11-20' });
  });

  it('either link can be cleared, but not both', async () => {
    setup({ preset: { contact_id: 1 } });
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Contact' })).toHaveTextContent('Sam Patel'));
    await userEvent.click(screen.getByRole('combobox', { name: 'Contact' }));
    await userEvent.click(await screen.findByRole('option', { name: 'No contact' }));
    await userEvent.type(screen.getByLabelText('Description'), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Choose a contact, a deal or both')).toBeInTheDocument();
  });

  it('says what is missing', async () => {
    setup({ preset: { contact_id: 1 } });
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Enter a description')).toBeInTheDocument();
  });
});
