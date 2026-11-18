// Short toasts after a save, and messages when something fails (FORM-5).
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from './Toast';

function Trigger() {
  const toast = useToast();
  return (
    <>
      <button type="button" onClick={() => toast('Deal saved')}>
        Save
      </button>
      <button type="button" onClick={() => toast('That deal was deleted.', 'error')}>
        Fail
      </button>
    </>
  );
}

describe('Toast', () => {
  it('[FORM-5] shows a short message, and failures too', async () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Deal saved')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Fail' }));
    expect(await screen.findByText('That deal was deleted.')).toBeInTheDocument();
  });

  it('goes away when dismissed with Escape', async () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    const message = await screen.findByText('Deal saved');
    message.closest('li')?.focus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByText('Deal saved')).not.toBeInTheDocument());
  });

  it('does nothing outside the provider', async () => {
    render(<Trigger />);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.queryByText('Deal saved')).not.toBeInTheDocument();
  });
});
