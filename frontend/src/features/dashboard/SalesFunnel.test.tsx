// The sales funnel's shape and labels (DASH-8).
import { screen } from '@testing-library/react';
import { renderWithApp } from '../../test/render';
import type { Dashboard } from './api';
import { MIN_SHARE, SalesFunnel, segmentWidths } from './SalesFunnel';

const funnel: Dashboard['funnel'] = {
  stages: [
    { stage: 'new', label: 'New', value: 1345000, count: 20, share: 100 },
    { stage: 'qualified', label: 'Qualified', value: 1303000, count: 18, share: 97 },
    { stage: 'proposal', label: 'Proposal', value: 1188000, count: 15, share: 88 },
    { stage: 'negotiation', label: 'Negotiation', value: 837000, count: 12, share: 62 },
    { stage: 'won', label: 'Won', value: 100000, count: 2, share: 7 },
  ],
  new_to_won_share: 7,
  new_count: 20,
  won_count: 2,
};

describe('SalesFunnel (DASH-8)', () => {
  it('makes each segment as wide as its value, with a minimum', () => {
    const widths = segmentWidths([1000, 500, 100, 0], 400);
    expect(widths).toEqual([400, 200, 400 * MIN_SHARE, 400 * MIN_SHARE]);
    expect(segmentWidths([0, 0], 400)).toEqual([120, 120]);
  });

  it('narrows from top to bottom in stage order and colors', () => {
    renderWithApp(<SalesFunnel funnel={funnel} width={520} />);
    const segments = screen.getAllByRole('link');
    expect(segments.map((s) => s.getAttribute('data-stage'))).toEqual(['new', 'qualified', 'proposal', 'negotiation', 'won']);
    const widths = segments.map((s) => Number(s.getAttribute('data-width')));
    for (let i = 1; i < widths.length; i++) expect(widths[i]).toBeLessThanOrEqual(widths[i - 1]!);
    expect(widths[4]).toBeCloseTo(370 * MIN_SHARE, 0); // Won is small, so it gets the minimum
    expect(segments[0]!.querySelector('path')).toHaveAttribute('fill', '#06D6A0');
  });

  it('labels each segment with its value, count and share of New', () => {
    renderWithApp(<SalesFunnel funnel={funnel} />);
    expect(screen.getByText('Qualified')).toBeInTheDocument();
    expect(screen.getByText('US$1,345,000')).toBeInTheDocument();
    expect(screen.getByText('20 deals')).toBeInTheDocument();
    expect(screen.getByText('18 deals · 97%')).toBeInTheDocument();
    expect(screen.getByText('New to Won, by value')).toBeInTheDocument();
    expect(screen.getByTestId('new-to-won')).toHaveTextContent('7% · 2 of 20 deals');
  });
});
