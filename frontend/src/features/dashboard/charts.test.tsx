// The two monthly charts (DASH-7, DASH-10, DASH-14).
import { fireEvent, render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';
import { months } from '../../test/fixtures';
import { DealsWonChart } from './DealsWonChart';
import { RevenueChart } from './RevenueChart';

// jsdom lays nothing out, so give every element a size for the charts to draw into.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 600, 300));
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(600);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(300);
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(600);
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(300);
});

/** Points at the right-hand end of the chart, where the current month is. */
function hoverCurrentMonth(chart: HTMLElement) {
  const surface = chart.querySelector('.recharts-wrapper') as HTMLElement;
  fireEvent.mouseMove(surface, { clientX: 580, clientY: 100 });
}

describe('RevenueChart', () => {
  it('[DASH-7] labels the months along the bottom', () => {
    render(<RevenueChart months={months()} />);
    const chart = within(screen.getByTestId('revenue-chart'));
    expect(chart.getByText('Dec')).toBeInTheDocument();
    expect(chart.getByText('Nov')).toBeInTheDocument();
  });

  it('[DASH-14] shows the month and the amount, with its currency, on hover', async () => {
    render(<RevenueChart months={months()} />);
    hoverCurrentMonth(screen.getByTestId('revenue-chart'));
    const tooltip = await screen.findByRole('status');
    expect(tooltip).toHaveTextContent('November');
    expect(tooltip).toHaveTextContent('US$120,000');
  });
});

describe('DealsWonChart', () => {
  it('[DASH-10] labels each month with its initial', () => {
    render(<DealsWonChart months={months()} />);
    const chart = within(screen.getByTestId('deals-won-chart'));
    expect(chart.getAllByText('J')).toHaveLength(3);
    expect(chart.getByText('D')).toBeInTheDocument();
  });

  it('[DASH-10] shows the month, deals won and revenue on hover', async () => {
    render(<DealsWonChart months={months()} />);
    hoverCurrentMonth(screen.getByTestId('deals-won-chart'));
    const tooltip = await screen.findByRole('status');
    expect(tooltip).toHaveTextContent('November');
    expect(tooltip).toHaveTextContent('3 deals won');
    expect(tooltip).toHaveTextContent('US$120,000');
  });
});
