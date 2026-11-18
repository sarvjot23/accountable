// The round Done checkbox on a follow-up (DASH-12, REC-9).
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { activity } from '../../test/fixtures';
import { mockApi, renderWithApp } from '../../test/render';
import { DoneCheck } from './DoneCheck';

function setup(done: boolean, answer: (body: unknown) => unknown = () => activity()) {
  const sent: unknown[] = [];
  mockApi({
    'PATCH /activities/1/done': (body: unknown) => {
      sent.push(body);
      return answer(body);
    },
  });
  renderWithApp(
    <DoneCheck
      activity={activity({
        id: 1,
        description: 'Send the proposal',
        follow_up_date: '2026-11-20',
        follow_up_done: done,
      })}
    />,
  );
  return sent;
}

describe('DoneCheck', () => {
  it('[REC-9] ticks an open follow-up done', async () => {
    const sent = setup(false);
    const check = screen.getByRole('checkbox', { name: 'Done: Send the proposal' });
    expect(check).not.toBeChecked();
    await userEvent.click(check);
    expect(await screen.findByText('Follow-up done')).toBeInTheDocument();
    expect(sent).toEqual([{ done: true }]);
  });

  it('[REC-9] opens a done follow-up again', async () => {
    const sent = setup(true);
    const check = screen.getByRole('checkbox', { name: 'Done: Send the proposal' });
    expect(check).toBeChecked();
    await userEvent.click(check);
    expect(await screen.findByText('Follow-up opened again')).toBeInTheDocument();
    expect(sent).toEqual([{ done: false }]);
  });

  it('[DASH-12] explains when the change is not saved', async () => {
    setup(false, () => {
      throw new Error('That activity was deleted.');
    });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Done: Send the proposal' }));
    expect(await screen.findByText('That activity was deleted.')).toBeInTheDocument();
  });

  it('cannot be ticked twice while saving', async () => {
    setup(false, () => new Promise(() => {}));
    const check = screen.getByRole('checkbox', { name: 'Done: Send the proposal' });
    await userEvent.click(check);
    await waitFor(() => expect(check).toBeDisabled());
  });
});
