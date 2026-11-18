// The pill-shaped button (LOOK-2).
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FormEvent, ReactNode } from 'react';
import { vi } from 'vitest';
import { Button } from './Button';

function renderInForm(button: ReactNode) {
  const onSubmit = vi.fn((e: FormEvent) => e.preventDefault());
  render(
    <form aria-label="Form" onSubmit={onSubmit}>
      {button}
    </form>,
  );
  return onSubmit;
}

describe('Button', () => {
  it('does not submit a form unless asked to', async () => {
    const onClick = vi.fn();
    const onSubmit = renderInForm(<Button onClick={onClick}>Cancel</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits when it is a submit button', async () => {
    const onSubmit = renderInForm(
      <Button type="submit" variant="primary" size="small">
        Save
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
