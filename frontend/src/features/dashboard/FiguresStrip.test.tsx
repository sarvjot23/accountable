// The four big figures (DASH-3 to DASH-6, DASH-14).
import { screen, within } from '@testing-library/react';
import { dashboard } from '../../test/fixtures';
import { renderWithApp } from '../../test/render';
import { FiguresStrip } from './FiguresStrip';

function figure(name: string) {
  const label = within(screen.getByRole('region', { name: 'Key figures' })).getByText(name);
  return within(label.parentElement!);
}

describe('FiguresStrip', () => {
  it('[DASH-3] shows the open pipeline value and its count', () => {
    renderWithApp(<FiguresStrip data={dashboard()} />);
    expect(figure('Open pipeline').getByText('US$248,500')).toBeInTheDocument();
    expect(figure('Open pipeline').getByText('7 open deals')).toBeInTheDocument();
  });

  it('[DASH-4] shows expected revenue and its share of the open pipeline', () => {
    renderWithApp(<FiguresStrip data={dashboard()} />);
    expect(figure('Expected revenue').getByText('US$132,000')).toBeInTheDocument();
    expect(figure('Expected revenue').getByText('53% of the open pipeline')).toBeInTheDocument();
  });

  it('[DASH-5] shows revenue won this month with the change against last month', () => {
    renderWithApp(<FiguresStrip data={dashboard()} />);
    expect(figure('Won this month').getByText('US$120,000')).toBeInTheDocument();
    expect(figure('Won this month').getByText('+US$40,000')).toBeInTheDocument();
    expect(figure('Won this month').getByText(/on October/)).toBeInTheDocument();
  });

  it('[DASH-5] shows a fall against last month as a negative change', () => {
    const data = dashboard({
      won_this_month: { value: 20000, count: 1, last_month_value: 60000, change: -40000, share_of_best_month: 20 },
      monthly: [],
    });
    renderWithApp(<FiguresStrip data={data} />);
    expect(figure('Won this month').getByText('-US$40,000')).toBeInTheDocument();
    expect(figure('Won this month').getByText(/on last month/)).toBeInTheDocument();
  });

  it('[DASH-6] shows the late deals and links to the Deals table filtered to them', () => {
    renderWithApp(<FiguresStrip data={dashboard()} />);
    const link = screen.getByRole('link', { name: /Late deals/ });
    expect(link).toHaveAttribute('href', '/deals?late=1');
    expect(within(link).getByText('2')).toBeInTheDocument();
    expect(within(link).getByText('US$330,000')).toBeInTheDocument();
    expect(link).toHaveTextContent('past their close date');
  });

  it('[DASH-6] speaks of a single late deal in the singular', () => {
    renderWithApp(<FiguresStrip data={dashboard({ late_deals: { count: 1, value: 5000, share_of_open: 2 } })} />);
    expect(screen.getByRole('link', { name: /Late deals/ })).toHaveTextContent('past its close date');
  });

  it('[DASH-3] shows an empty pipeline as US$0', () => {
    renderWithApp(<FiguresStrip data={dashboard({ open_pipeline: { value: 0, count: 0 } })} />);
    expect(figure('Open pipeline').getByText('US$0')).toBeInTheDocument();
    expect(figure('Open pipeline').getByText('0 open deals')).toBeInTheDocument();
  });
});
