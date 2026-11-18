// The top bar's search (LAY-3).
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router';
import { contact, deal, organization } from '../test/fixtures';
import { mockApi, renderWithApp } from '../test/render';
import { GlobalSearch } from './GlobalSearch';

function CurrentPath() {
  return <output aria-label="Current page">{useLocation().pathname}</output>;
}

async function setup(deals = [deal({ id: 4, name: 'Northwind rollout', organization_name: 'Northwind Labs' })]) {
  mockApi({
    'GET /deals': deals,
    'GET /contacts': [contact({ id: 7, name: 'Nora North', organization_name: null })],
    'GET /organizations': [
      organization({ id: 2, name: 'Northwind Labs', industry: 'Logistics' }),
      organization({ id: 3, name: 'Harbor Finance' }),
    ],
  });
  const { queryClient } = renderWithApp(
    <>
      <GlobalSearch />
      <CurrentPath />
    </>,
  );
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  return screen.getByRole('combobox', { name: 'Search deals, people and companies' });
}

const results = () => screen.getByRole('listbox');
const currentPath = () => screen.getByRole('status', { name: 'Current page' });

describe('GlobalSearch', () => {
  it('[LAY-3] finds deals, contacts and organizations by name as you type', async () => {
    const input = await setup();
    await userEvent.type(input, 'north');

    const groups = within(results()).getAllByRole('group');
    expect(groups).toHaveLength(3);
    expect(within(results()).getByRole('option', { name: /Northwind rollout/ })).toHaveTextContent('Northwind Labs');
    expect(within(results()).getByRole('option', { name: 'Nora North' })).toBeInTheDocument();
    expect(within(results()).getByRole('option', { name: /^Northwind Labs/ })).toHaveTextContent('Logistics');
    expect(within(results()).queryByText('Harbor Finance')).not.toBeInTheDocument();
  });

  it('[LAY-3] ignores case and surrounding spaces', async () => {
    const input = await setup();
    await userEvent.type(input, '  HARBOR ');
    expect(within(results()).getByRole('option', { name: /Harbor Finance/ })).toBeInTheDocument();
  });

  it('[LAY-3] shows nothing until something is typed', async () => {
    const input = await setup();
    await userEvent.click(input);
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(screen.queryByText(/Nothing found/)).not.toBeInTheDocument();
  });

  it('[LAY-3] says when nothing matches', async () => {
    const input = await setup();
    await userEvent.type(input, 'zebra');
    expect(await screen.findByText('Nothing found for “zebra”')).toBeInTheDocument();
  });

  it('[LAY-3] shows at most six of each kind', async () => {
    const many = Array.from({ length: 9 }, (_, i) => deal({ id: i + 1, name: `Upgrade ${i + 1}` }));
    const input = await setup(many);
    await userEvent.type(input, 'upgrade');
    expect(within(results()).getAllByRole('option')).toHaveLength(6);
  });

  it('[LAY-3] opens the chosen record and clears the search', async () => {
    const input = await setup();
    await userEvent.type(input, 'nora');
    await userEvent.click(within(results()).getByRole('option', { name: 'Nora North' }));

    expect(currentPath()).toHaveTextContent('/contacts/7');
    expect(input).toHaveValue('');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('[LAY-3] opens a record from the keyboard', async () => {
    const input = await setup();
    await userEvent.type(input, 'rollout{Enter}');
    expect(currentPath()).toHaveTextContent('/deals/4');
  });

  it('[LAY-3] closes the results on Escape, and opens them again on typing', async () => {
    const input = await setup();
    await userEvent.type(input, 'nora');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(input).toHaveValue('nora');

    await userEvent.type(input, 'h');
    expect(await screen.findByText('Nothing found for “norah”')).toBeInTheDocument();
  });

  it('[LAY-3] closes the results when focus leaves the search, and opens them again on return', async () => {
    const input = await setup();
    await userEvent.type(input, 'nora');
    await userEvent.tab();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();

    await userEvent.click(input);
    expect(within(results()).getByRole('option', { name: 'Nora North' })).toBeInTheDocument();
  });
});
