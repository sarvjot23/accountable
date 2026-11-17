import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { money, moneyShort, monthName } from '../../lib/format';
import type { Month } from './api';
import styles from './Dashboard.module.css';

function MonthTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Month }> }) {
  if (!active || !payload?.length) return null;
  const month = payload[0]!.payload as Month;
  return (
    <div className={styles.tooltip} role="status">
      <span>{monthName(month.month)}</span>
      <b>{money(month.revenue_won)}</b>
    </div>
  );
}

/** DASH-7: revenue won per month, a smooth Sea Green line with a light area under it. */
export function RevenueChart({ months }: { months: Month[] }) {
  return (
    <div className={styles.chart} data-testid="revenue-chart">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={months} margin={{ top: 14, right: 16, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="revenue-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#06D6A0" stopOpacity={0.22} />
              <stop offset="1" stopColor="#06D6A0" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#E6EDEF" strokeDasharray="3 4" />
          <XAxis
            dataKey="month"
            tickFormatter={(m: string) => monthName(m, 'short')}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#4F6E79', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            interval={0}
          />
          <YAxis
            tickFormatter={moneyShort}
            tickLine={false}
            axisLine={false}
            width={66}
            tick={{ fill: '#4F6E79', fontSize: 11, fontFamily: 'JetBrains Mono' }}
          />
          <Tooltip content={<MonthTooltip />} cursor={{ stroke: '#073B4C', strokeDasharray: '2 3' }} />
          <Area
            type="monotone"
            dataKey="revenue_won"
            stroke="#05B184"
            strokeWidth={3}
            fill="url(#revenue-area)"
            activeDot={{ r: 6, fill: '#fff', stroke: '#05B184', strokeWidth: 3 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
