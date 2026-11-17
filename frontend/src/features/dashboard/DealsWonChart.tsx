import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { money, monthName, plural } from '../../lib/format';
import type { Month } from './api';
import styles from './Dashboard.module.css';

function MonthTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Month }> }) {
  if (!active || !payload?.length) return null;
  const month = payload[0]!.payload as Month;
  return (
    <div className={styles.tooltip} role="status">
      <span>{monthName(month.month)}</span>
      <b>{plural(month.deals_won, 'deal')} won</b>
      <span>{money(month.revenue_won)}</span>
    </div>
  );
}

/** DASH-10: deals won per month as rounded Marigold bars on light grey tracks, this month darker. */
export function DealsWonChart({ months }: { months: Month[] }) {
  const top = Math.max(2, ...months.map((m) => m.deals_won));
  return (
    <div className={styles.chart} data-testid="deals-won-chart">
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={months} margin={{ top: 12, right: 0, bottom: 0, left: 0 }} barCategoryGap="22%">
          <XAxis
            dataKey="month"
            tickFormatter={(m: string) => monthName(m, 'short').charAt(0)}
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fill: '#4F6E79', fontSize: 11, fontFamily: 'JetBrains Mono' }}
          />
          <YAxis hide domain={[0, top]} allowDecimals={false} />
          <Tooltip content={<MonthTooltip />} cursor={false} />
          <Bar dataKey="deals_won" radius={999} background={{ fill: '#F3F6F7', radius: 999 }} isAnimationActive={false}>
            {months.map((m, i) => (
              <Cell key={m.month} fill={i === months.length - 1 ? '#F0A800' : '#FFC145'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
