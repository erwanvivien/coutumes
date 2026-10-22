import { monthLabel, monthSlug, type MonthKey } from '@/lib/report/months';
import { homePath, monthPath } from '@/lib/urls';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import styles from './layout.module.css';

/** Top bar of the signed-in pages: store name, month switcher and page actions. */
export const AppHeader: React.FC<{
  storeName: string;
  month?: MonthKey;
  previous?: MonthKey;
  next?: MonthKey;
  actions?: React.ReactNode;
}> = ({ storeName, month, previous, next, actions }) => (
  <header className={styles.header}>
    <div className={styles.headerInner}>
      <Link href={homePath()} className={styles.brand}>
        {storeName}
      </Link>

      {month === undefined ? (
        <span />
      ) : (
        <nav className={styles.monthNav} aria-label="Changer de mois">
          {previous !== undefined ? (
            <Link
              href={monthPath(monthSlug(previous))}
              className={styles.iconButton}
              aria-label={monthLabel(previous)}
              title={monthLabel(previous)}
            >
              <ChevronLeft size={18} />
            </Link>
          ) : (
            <span className={styles.iconButton} aria-hidden data-disabled>
              <ChevronLeft size={18} />
            </span>
          )}
          <h1 className={styles.monthTitle}>{monthLabel(month)}</h1>
          {next !== undefined ? (
            <Link
              href={monthPath(monthSlug(next))}
              className={styles.iconButton}
              aria-label={monthLabel(next)}
              title={monthLabel(next)}
            >
              <ChevronRight size={18} />
            </Link>
          ) : (
            <span className={styles.iconButton} aria-hidden data-disabled>
              <ChevronRight size={18} />
            </span>
          )}
        </nav>
      )}

      <div className={styles.actions}>{actions}</div>
    </div>
  </header>
);
