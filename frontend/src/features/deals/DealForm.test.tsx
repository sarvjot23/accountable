// The deal form (FORM-1, FORM-3, FORM-4, RULE-5).
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { contact, deal, organization } from '../../test/fixtures';
import { mockApi, renderWithApp } from '../../test/render';
import { contactOptions, DealForm } from './DealForm';

const orgs = [organization({ id: 1, name: 'Northwind Labs' }), organization({ id: 2, name: 'Harbor Finance' })];
const people = [
  contact({ id: 10, name: 'Ava Grant', organization_id: 2, organization_name: 'Harbor Finance' }),
  contact({ id: 11, name: 'Sam Patel', organization_id: 1, organization_name: 'Northwind Labs' }),
  contact({ id: 12, name: 'Zoe Hart', organization_id: 1, organization_name: 'Northwind Labs' }),
];

function setup(props: Parameters<typeof DealForm>[0] = { onDone: vi.fn() }, save?: (body: any) => unknown) {
  const saved: any[] = [];
  const handler = (body: any) => {
    saved.push(body);
    return save ? save(body) : deal({ ...body, id: 1 });
  };
  mockApi({ 'GET /organizations': orgs, 'GET /contacts': people, 'POST /deals': handler, 'PUT /deals/1': handler });
  renderWithApp(<DealForm {...props} />);
  return saved;
}

describe('DealForm', () => {
  it('[FORM-1] says what is missing in plain words', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Enter a name')).toBeInTheDocument();
    const messages = screen.getAllByRole('alert').map((a) => a.textContent);
    expect(messages).toEqual(expect.arrayContaining(['Enter a name', 'Choose an organization', 'Enter a value']));
  });

  it('[FORM-4] takes the value in whole dollars with a US$ prefix', async () => {
    setup({ onDone: vi.fn(), preset: { organization_id: 1 } });
    expect(screen.getByText('US$')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Name'), 'Cloud migration');
    await userEvent.type(screen.getByLabelText('Value'), '12.50');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Enter the value in whole dollars')).toBeInTheDocument();
  });

  it('[FORM-1] disables Save while saving, then sends whole dollars', async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => (finish = resolve));
    const onDone = vi.fn();
    const saved = setup({ onDone, preset: { organization_id: 1 } }, async (body) => {
      await pending;
      return deal(body);
    });
    await userEvent.type(screen.getByLabelText('Name'), 'Cloud migration');
    await userEvent.type(screen.getByLabelText('Value'), '24,000');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('button', { name: 'Saving…' })).toBeDisabled();
    finish();
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(saved[0]).toMatchObject({ name: 'Cloud migration', organization_id: 1, value: 24000, stage: 'new' });
  });

  it('[RULE-5] sends a probability only when it was typed in by hand, so only then is it manual', async () => {
    const saved = setup({ onDone: vi.fn(), deal: deal({ id: 1, probability: 50 }) });
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saved).toHaveLength(1));
    expect(saved[0]).not.toHaveProperty('probability');

    const probability = screen.queryByLabelText('Probability (%)');
    // The sheet closed after saving; render again and edit the probability.
    expect(probability).not.toBeNull();
    await userEvent.clear(probability!);
    await userEvent.type(probability!, '65');
    expect(screen.getByText('Set by hand')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saved).toHaveLength(2));
    expect(saved[1]).toMatchObject({ probability: 65 });
  });

  it('[RULE-5] shows the new stage’s usual probability when the stage changes', async () => {
    setup({ onDone: vi.fn(), deal: deal({ id: 1, stage: 'proposal', probability: 50 }) });
    await userEvent.click(screen.getByRole('combobox', { name: 'Stage' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Negotiation' }));
    expect(screen.getByLabelText('Probability (%)')).toHaveValue('75');
  });

  it('[FORM-3] lists the chosen organization’s contacts first', async () => {
    const options = contactOptions(people, 1, 'Northwind Labs');
    expect(options.map((o) => [o.label, o.group])).toEqual([
      ['Sam Patel', 'Northwind Labs'],
      ['Zoe Hart', 'Northwind Labs'],
      ['Ava Grant', 'Other contacts'],
    ]);
    setup({ onDone: vi.fn(), preset: { organization_id: 1 } });
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Organization' })).toHaveTextContent('Northwind Labs'));
    await userEvent.click(screen.getByRole('combobox', { name: 'Main contact' }));
    const list = await screen.findByRole('listbox');
    const labels = within(list)
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(labels.slice(1)).toEqual([
      expect.stringContaining('Sam Patel'),
      expect.stringContaining('Zoe Hart'),
      expect.stringContaining('Ava Grant'),
    ]);
  });
});
