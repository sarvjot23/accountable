// The shared table: search, sort, empty state, all in the browser (TBL-1, TBL-2, TBL-6, TBL-7).
import { createColumnHelper } from '@tanstack/react-table';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { DataTable } from './DataTable';
import { EmptyState } from './EmptyState';

interface Row {
  id: number;
  name: string;
  city: string;
  value: number;
}
const column = createColumnHelper<Row>();
const columns = [
  column.accessor('name', { header: 'Name' }),
  column.accessor('city', { header: 'City' }),
  column.accessor('value', { header: 'Value', meta: { numeric: true } }),
];
const rows: Row[] = [
  { id: 1, name: 'Bluepeak Retail', city: 'Denver', value: 300 },
  { id: 2, name: 'Atlas Freight', city: 'Austin', value: 100 },
  { id: 3, name: 'Harbor Finance', city: 'Boston', value: 200 },
];

function setup(data = rows) {
  const handlers = { onOpen: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
  render(
    <DataTable
      data={data}
      columns={columns}
      searchLabel="Search companies"
      rowLabel={(r) => r.name}
      empty={<EmptyState message="No companies yet." action={<button>Add company</button>} />}
      {...handlers}
    />,
  );
  return handlers;
}

const names = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((r) => within(r).getAllByRole('cell')[0]!.textContent);

describe('DataTable', () => {
  it('[TBL-1] filters as you type across the text columns', async () => {
    setup();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search companies' }), 'bos');
    expect(names()).toEqual(['Harbor Finance']);
    await userEvent.clear(screen.getByRole('searchbox'));
    await userEvent.type(screen.getByRole('searchbox'), 'zzz');
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
  });

  it('[TBL-2] sorts on a heading click, reverses on the next, and shows the direction', async () => {
    setup();
    const heading = screen.getByRole('button', { name: 'Name' });
    await userEvent.click(heading);
    expect(names()).toEqual(['Atlas Freight', 'Bluepeak Retail', 'Harbor Finance']);
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'ascending');
    await userEvent.click(heading);
    expect(names()).toEqual(['Harbor Finance', 'Bluepeak Retail', 'Atlas Freight']);
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'descending');
    await userEvent.click(screen.getByRole('button', { name: 'Value' }));
    await userEvent.click(screen.getByRole('button', { name: /Value/ }));
    const first = names()[0];
    await userEvent.click(screen.getByRole('button', { name: /Value/ }));
    expect(names()[0]).not.toBe(first);
  });

  it('[TBL-6] sorts and searches without asking the server again', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'City' }));
    await userEvent.type(screen.getByRole('searchbox'), 'a');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('[TBL-7] an empty table shows a short message and the Add button', () => {
    setup([]);
    expect(screen.getByText('No companies yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add company' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('opens a row on click, and Edit and Delete from the row menu', async () => {
    const { onOpen, onEdit, onDelete } = setup();
    await userEvent.click(screen.getByText('Denver'));
    expect(onOpen).toHaveBeenCalledWith(rows[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Actions for Atlas Freight' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Edit/ }));
    expect(onEdit).toHaveBeenCalledWith(rows[1]);
    await userEvent.click(screen.getByRole('button', { name: 'Actions for Harbor Finance' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Delete/ }));
    expect(onDelete).toHaveBeenCalledWith(rows[2]);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
