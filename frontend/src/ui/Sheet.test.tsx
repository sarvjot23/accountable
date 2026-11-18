// The side sheet that holds forms (TBL-3, FORM-1).
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Sheet } from './Sheet';

describe('Sheet', () => {
  it('[TBL-3] shows its title, description and content, and closes with the close button', async () => {
    const onOpenChange = vi.fn();
    render(
      <Sheet open onOpenChange={onOpenChange} title="Add deal" description="A sale you are working on.">
        <p>The form</p>
      </Sheet>,
    );
    expect(screen.getByRole('dialog', { name: 'Add deal' })).toHaveAccessibleDescription('A sale you are working on.');
    expect(screen.getByText('The form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes with Escape', async () => {
    const onOpenChange = vi.fn();
    render(
      <Sheet open onOpenChange={onOpenChange} title="Edit deal">
        <p>The form</p>
      </Sheet>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows nothing while closed', () => {
    render(
      <Sheet open={false} onOpenChange={vi.fn()} title="Add deal">
        <p>The form</p>
      </Sheet>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
