import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { cx } from '../lib/cx';
import { Button } from '../ui/Button';
import { DealSheet } from '../features/deals/DealForm';
import { GlobalSearch } from './GlobalSearch';
import styles from './TopBar.module.css';

const TABS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/pipeline', label: 'Pipeline' },
  { to: '/deals', label: 'Deals' },
  { to: '/organizations', label: 'Organizations' },
  { to: '/contacts', label: 'Contacts' },
];

/** The white top bar: wordmark, pill tabs, search and Add deal (LAY-2). */
export function TopBar() {
  const [adding, setAdding] = useState(false);
  return (
    <header className={styles.bar}>
      <Link to="/" className={styles.brand} aria-label="Accountable, go to the dashboard">
        <span className={styles.logo} aria-hidden>
          <i />
        </span>
        Accountable
      </Link>
      <nav aria-label="Sections">
        <ul className={styles.tabs}>
          {TABS.map((tab) => (
            <li key={tab.to}>
              <NavLink to={tab.to} end={tab.end} className={({ isActive }) => cx(styles.tab, isActive && styles.on)}>
                {tab.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className={styles.right}>
        <GlobalSearch />
        <Button variant="primary" onClick={() => setAdding(true)}>
          <Plus aria-hidden /> Add deal
        </Button>
      </div>
      <DealSheet open={adding} onOpenChange={setAdding} />
    </header>
  );
}
