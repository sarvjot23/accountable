// The delete dialog (DEL-1).
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ConfirmDelete } from './ConfirmDelete';

function setup(
  onConfirm = vi.fn(async () => {}),
  consequences: string | undefined = 'This also deletes 3 contacts, 2 deals and 11 activities.',
) {
  const onOpenChange = vi.fn();
  render(
    <ConfirmDelete
      open
      onOpenChange={onOpenChange}
      name="Northwind Labs"
      consequences={consequences}
      onConfirm={onConfirm}
    />,
  );
  return { onConfirm, onOpenChange };
}

describe('ConfirmDelete (DEL-1)', () => {
  it('names the record and shows the impact counts', () => {
    setup();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Delete Northwind Labs?')).toBeInTheDocument();
    expect(screen.getByText('This also deletes 3 contacts, 2 deals and 11 activities.')).toBeInTheDocument();
  });

  it('focuses Cancel first', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('deletes only when Delete is pressed', async () => {
    const { onConfirm, onOpenChange } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onConfirm).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('waits for the impact before Delete can be pressed', () => {
    render(
      <ConfirmDelete open onOpenChange={vi.fn()} name="Northwind Labs" consequences={undefined} onConfirm={vi.fn()} />,
    );
    expect(screen.getByText('Checking what else this affects…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  it('shows a plain message if the delete fails', async () => {
    setup(vi.fn(async () => Promise.reject(new Error("We couldn't find that organization"))));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't find that organization");
  });
});
