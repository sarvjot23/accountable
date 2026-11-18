// A sheet opens with the focus on its form's first field.
import { render, screen } from '@testing-library/react';
import { Sheet } from './Sheet';

describe('Sheet focus', () => {
  it('puts the focus on the field marked data-autofocus', async () => {
    render(
      <Sheet open onOpenChange={() => {}} title="Add a note">
        <label htmlFor="other">Other</label>
        <input id="other" />
        <label htmlFor="note">Note</label>
        <input id="note" data-autofocus />
      </Sheet>,
    );
    expect(await screen.findByLabelText('Note')).toHaveFocus();
  });
});
