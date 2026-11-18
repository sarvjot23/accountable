// Filter chips and the single on/off chip (TBL-10, TBL-12, PIPE-2).
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Chips, ToggleChip } from './Chips';

describe('Chips', () => {
  it('[TBL-10] marks the chosen chip, shows counts and reports a new choice', async () => {
    const onChange = vi.fn();
    render(
      <Chips
        label="Filter by status"
        value="all"
        onChange={onChange}
        options={[
          { value: 'all', label: 'All', count: 5 },
          { value: 'lead', label: 'Lead', count: 2 },
          { value: 'customer', label: 'Customer' },
        ]}
      />,
    );
    const group = screen.getByRole('group', { name: 'Filter by status' });
    expect(within(group).getByRole('button', { name: 'All 5' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(group).getByRole('button', { name: 'Lead 2' })).toHaveAttribute('aria-pressed', 'false');
    expect(within(group).getByRole('button', { name: 'Customer' })).toBeInTheDocument();
    await userEvent.click(within(group).getByRole('button', { name: 'Lead 2' }));
    expect(onChange).toHaveBeenCalledWith('lead');
  });
});

describe('ToggleChip', () => {
  it('[TBL-12] turns on and off', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <ToggleChip pressed={false} onChange={onChange}>
        Late only
      </ToggleChip>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Late only' }));
    expect(onChange).toHaveBeenLastCalledWith(true);
    rerender(
      <ToggleChip pressed onChange={onChange}>
        Late only
      </ToggleChip>,
    );
    expect(screen.getByRole('button', { name: 'Late only' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Late only' }));
    expect(onChange).toHaveBeenLastCalledWith(false);
  });
});
