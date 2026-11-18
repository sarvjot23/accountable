// A record page's header and linked-record tables (REC-1, REC-2).
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MiniTable, RecordColumns, RecordHeader } from './Record';

describe('RecordHeader', () => {
  it('[REC-1] shows the record’s kind, name, chips and main fields, with Edit and Delete', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <RecordHeader
        kind="Organization"
        title="Northwind Labs"
        chips={<span>Logistics</span>}
        facts={[
          { label: 'Website', value: 'northwind.example' },
          { label: 'Open value', value: 'US$12,000' },
        ]}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    const header = screen.getByRole('region', { name: 'Organization details' });
    expect(within(header).getByRole('heading', { level: 1, name: 'Northwind Labs' })).toBeInTheDocument();
    expect(within(header).getByText('Logistics')).toBeInTheDocument();
    expect(
      within(header)
        .getAllByRole('term')
        .map((t) => t.textContent),
    ).toEqual(['Website', 'Open value']);
    expect(
      within(header)
        .getAllByRole('definition')
        .map((d) => d.textContent),
    ).toEqual(['northwind.example', 'US$12,000']);

    await userEvent.click(within(header).getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledOnce();
    await userEvent.click(within(header).getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('leaves out the facts list when there are none', () => {
    render(<RecordHeader kind="Deal" title="Cloud migration" facts={[]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByRole('term')).not.toBeInTheDocument();
  });
});

describe('RecordColumns and MiniTable', () => {
  it('[REC-2] lays out two columns and a small table of linked records', () => {
    render(
      <RecordColumns
        left={<p>Details</p>}
        right={
          <MiniTable head={['Deal', 'Stage', 'Value']}>
            <tr>
              <td>Cloud migration</td>
              <td>Proposal</td>
              <td>US$10,000</td>
            </tr>
          </MiniTable>
        }
      />,
    );
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Deal', 'Stage', 'Value']);
    expect(screen.getByRole('row', { name: /Cloud migration/ })).toHaveTextContent('Proposal');
  });
});
