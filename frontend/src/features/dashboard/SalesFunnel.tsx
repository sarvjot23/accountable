import { useNavigate } from 'react-router';
import { money, percent, plural } from '../../lib/format';
import { stage } from '../../lib/stages';
import type { Dashboard } from './api';
import styles from './Dashboard.module.css';

export const MIN_SHARE = 0.3;
const SEGMENT = 50;
const GAP = 6;
const LABELS = 150;

/** Each segment's width: its value against the value at New, never below MIN_SHARE so labels stay readable. */
export function segmentWidths(values: number[], fullWidth: number, minShare = MIN_SHARE): number[] {
  const top = values[0] ?? 0;
  return values.map((v) => fullWidth * Math.max(minShare, top ? v / top : 0));
}

/**
 * DASH-8: a true funnel of five stacked segments, New down to Won, each as wide as the value
 * that reached it (RULE-14). To the right: the value, the deal count and the share of New.
 * Clicking a segment opens the board (DASH-9).
 */
export function SalesFunnel({ funnel, width = 520 }: { funnel: Dashboard['funnel']; width?: number }) {
  const navigate = useNavigate();
  const steps = funnel.stages;
  const funnelWidth = width - LABELS;
  const widths = segmentWidths(
    steps.map((s) => s.value),
    funnelWidth,
  );
  const height = steps.length * (SEGMENT + GAP);
  const cx = funnelWidth / 2;

  return (
    <div className={styles.funnel}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="group"
        aria-label="Sales funnel"
        data-testid="sales-funnel"
      >
        {steps.map((s, i) => {
          const top = widths[i]!;
          const bottom = i < steps.length - 1 ? widths[i + 1]! : top * 0.78;
          const y0 = i * (SEGMENT + GAP);
          const y1 = y0 + SEGMENT;
          const st = stage(s.stage);
          const label = `${s.label}: ${money(s.value)}, ${plural(s.count, 'deal')}${i ? `, ${percent(s.share)} of New` : ''}. Open the pipeline.`;
          return (
            <g key={s.stage}>
              <g
                className={styles.segment}
                role="link"
                tabIndex={0}
                aria-label={label}
                data-stage={s.stage}
                data-width={top.toFixed(1)}
                onClick={() => navigate('/pipeline')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate('/pipeline');
                  }
                }}
              >
                <path
                  d={`M${cx - top / 2},${y0} L${cx + top / 2},${y0} L${cx + bottom / 2},${y1} L${cx - bottom / 2},${y1} Z`}
                  fill={st.color}
                  stroke={st.color}
                  strokeWidth={6}
                  strokeLinejoin="round"
                />
                <text
                  x={cx}
                  y={y0 + SEGMENT / 2 + 5}
                  textAnchor="middle"
                  className={styles.segmentName}
                  fill={st.textColor}
                >
                  {s.label}
                </text>
              </g>
              {/* The figures beside the segment; the segment's link already says them. */}
              <g aria-hidden>
                <text x={width} y={y0 + SEGMENT / 2 - 1} textAnchor="end" className={styles.segmentValue}>
                  {money(s.value)}
                </text>
                <text x={width} y={y0 + SEGMENT / 2 + 16} textAnchor="end" className={styles.segmentMeta}>
                  {plural(s.count, 'deal')}
                  {i ? ` · ${percent(s.share)}` : ''}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
      <div className={styles.funnelFoot}>
        <span>New to Won, by value</span>
        <b data-testid="new-to-won">
          {percent(funnel.new_to_won_share)} · {funnel.won_count} of {plural(funnel.new_count, 'deal')}
        </b>
      </div>
    </div>
  );
}
