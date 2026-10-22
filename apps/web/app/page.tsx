import { AppHeader } from '@/components/layout/AppHeader';
import layout from '@/components/layout/layout.module.css';
import { RefreshButton } from '@/components/layout/RefreshButton';
import { SheetProblem } from '@/components/layout/SheetProblem';
import { TabWarningIcon } from '@/components/layout/TabIssues';
import { cx } from '@/lib';
import { formatEuro, formatPercent } from '@/lib/report/format';
import { summarizeMonth } from '@/lib/report/kpis';
import { monthId, monthLabel, monthSlug } from '@/lib/report/months';
import { requireStore } from '@/lib/server/access';
import { loadReports } from '@/lib/server/loadReports';
import { homePath, monthPath } from '@/lib/urls';
import Link from 'next/link';
import styles from './page.module.css';

const HomePage: React.FC = async () => {
  const { store } = await requireStore(homePath());
  const loaded = await loadReports(store);

  const now = new Date();
  const currentId = monthId({ year: now.getFullYear(), month: now.getMonth() + 1 });

  return (
    <>
      <AppHeader storeName={store.name} actions={<RefreshButton />} />
      <main className={layout.main}>
        {loaded.kind !== 'ok' ? (
          <SheetProblem loaded={loaded} />
        ) : (
          <section className={layout.section}>
            <div className={layout.sectionHead}>
              <h1 className={layout.sectionTitle}>Mois</h1>
              <p className={layout.sectionDescription}>Un onglet du Google Sheet par mois</p>
            </div>
            <ul className={styles.grid}>
              {loaded.tabs.map((tab) => {
                const report =
                  tab.status === 'invalid'
                    ? undefined
                    : loaded.reports.find(
                        (candidate) => monthId(candidate.month) === monthId(tab.month),
                      );

                if (report === undefined) {
                  return (
                    <li key={tab.tabName}>
                      <div className={cx(styles.card, styles.cardInvalid)}>
                        <span className={styles.cardHead}>
                          <span className={styles.cardTitle}>{tab.tabName}</span>
                          <TabWarningIcon issues={tab.issues} />
                        </span>
                        <span className={styles.cardFoot}>{tab.issues.join(' · ')}</span>
                      </div>
                    </li>
                  );
                }

                const summary = summarizeMonth(report);
                const isCurrent = monthId(report.month) === currentId;
                const progress = Math.min(1, summary.monthAttainment ?? 0);
                return (
                  <li key={tab.tabName}>
                    <Link
                      href={monthPath(monthSlug(report.month))}
                      className={cx(styles.card, isCurrent && styles.cardCurrent)}
                    >
                      <span className={styles.cardHead}>
                        <span className={styles.cardTitle}>{monthLabel(report.month)}</span>
                        {tab.status === 'warning' && <TabWarningIcon issues={tab.issues} />}
                        {isCurrent && <span className={styles.badge}>En cours</span>}
                      </span>
                      <span className={styles.cardValue}>
                        {summary.totals.daysFilled > 0 ? formatEuro(summary.totals.revenue) : '—'}
                      </span>
                      <span className={styles.progress} aria-hidden>
                        <span style={{ width: `${progress * 100}%` }} />
                      </span>
                      <span className={styles.cardFoot}>
                        {summary.totals.daysFilled > 0
                          ? `${formatPercent(summary.monthAttainment)} de ${formatEuro(summary.monthObjective)}`
                          : `Objectif ${formatEuro(summary.monthObjective)}`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </>
  );
};

export default HomePage;
