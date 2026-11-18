import { Plus } from 'lucide-react';
import { useState } from 'react';
import { money, plural } from '../../lib/format';
import { Button } from '../../ui/Button';
import { Panel } from '../../ui/Panel';
import { PageState } from '../../ui/PageState';
import { ActivitySheet } from '../activities/ActivityForm';
import { DealSheet } from '../deals/DealForm';
import { useDashboard } from './api';
import styles from './Dashboard.module.css';
import { DealsWonChart } from './DealsWonChart';
import { FiguresStrip } from './FiguresStrip';
import { FollowUps } from './FollowUps';
import { Greeting } from './Greeting';
import { RecentActivity } from './RecentActivity';
import { RevenueChart } from './RevenueChart';
import { SalesFunnel } from './SalesFunnel';

/** The dashboard, following mockup B (LAY-1, DASH-1 to DASH-15). */
export function DashboardPage() {
  const query = useDashboard();
  const [logging, setLogging] = useState(false);
  const [adding, setAdding] = useState(false);
  const data = query.data;

  return (
    <PageState query={query}>
      {data && (
        <>
          <header className={styles.top}>
            <Greeting data={data} />
            <div className={styles.topActions}>
              <Button variant="light" onClick={() => setLogging(true)}>
                Log activity
              </Button>
              <Button variant="dark" onClick={() => setAdding(true)}>
                <Plus aria-hidden /> Add deal
              </Button>
            </div>
          </header>
          <FiguresStrip data={data} />
          <div className={styles.rowTwo}>
            <Panel
              title="Revenue won"
              sub={`Each month, last 12 months · ${money(data.revenue_won_12_months)} in total`}
            >
              <RevenueChart months={data.monthly} />
            </Panel>
            <Panel
              title="Sales funnel"
              sub="Value reaching each stage, last 12 months, and the share of what entered at New"
            >
              <SalesFunnel funnel={data.funnel} />
            </Panel>
          </div>
          <div className={styles.rowThree}>
            <Panel
              title="Deals won"
              sub={`Count each month · ${plural(data.deals_won_12_months, 'deal')} in 12 months`}
            >
              <DealsWonChart months={data.monthly} />
            </Panel>
            <Panel
              title="Follow-ups"
              sub={`${data.follow_ups.overdue} overdue · ${data.follow_ups.due_today + data.follow_ups.upcoming} in the next 14 days`}
            >
              <FollowUps followUps={data.follow_ups} />
            </Panel>
            <Panel title="Recent activity" sub="Everything, newest first">
              <RecentActivity activities={data.recent_activity} />
            </Panel>
          </div>
          <ActivitySheet open={logging} onOpenChange={setLogging} />
          <DealSheet open={adding} onOpenChange={setAdding} />
        </>
      )}
    </PageState>
  );
}
