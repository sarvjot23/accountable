import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { errorMessage } from '../lib/api';
import styles from './PageState.module.css';

/** Shows loading and error states for a page's query, and its content once loaded. */
export function PageState({ query, children }: { query: Pick<UseQueryResult, 'isPending' | 'isError' | 'error'>; children: ReactNode }) {
  if (query.isPending) {
    return (
      <p className={styles.state} role="status">
        Loading…
      </p>
    );
  }
  if (query.isError) {
    return (
      <p className={styles.error} role="alert">
        {errorMessage(query.error)}
      </p>
    );
  }
  return <>{children}</>;
}
