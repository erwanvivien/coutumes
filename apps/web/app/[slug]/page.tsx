import { AppHeader } from '@/components/layout/AppHeader';
import layout from '@/components/layout/layout.module.css';
import { RefreshButton } from '@/components/layout/RefreshButton';
import { SheetProblem } from '@/components/layout/SheetProblem';
import { TabWarningIcon } from '@/components/layout/TabIssues';
import { Delta } from '@/components/report/Delta';
import { cx } from '@/lib';
import { formatEuro, formatPercent, formatSignedPercent } from '@/lib/report/format';
import { summarizeMonth } from '@/lib/report/kpis';
import { monthId, monthLabel, monthSlug } from '@/lib/report/months';
import type { MonthReport } from '@/lib/report/types';
import {
  isoWeekNumber,
  latestFilledWeek,
  relativeChange,
  storeDate,
  weekRecap,
  weekSpan,
} from '@/lib/report/weeks';
import { requireStore } from '@/lib/server/access';
import { loadReports } from '@/lib/server/loadReports';
import { monthPath, storePath, weekPath, weekPresentationPath } from '@/lib/urls';
import Link from 'next/link';
import styles from './page.module.css';

/** The latest week with figures, as the store's weekly recap opens: CA and its change vs S-1. */
const LatestWeek: React.FC<{ reports: MonthReport[]; slug: string }> = ({ reports, slug }) => {
  const start = latestFilledWeek(reports);
  if (start === undefined) {
    return null;
  }
  const { current, previous, comparedDays } = weekRecap(reports, start, storeDate(new Date()));

  return (
    <section className={layout.section}>
      <div className={layout.sectionHead}>
        <h2 className={layout.sectionTitle}>Dernière semaine</h2>
        <p className={layout.sectionDescription}>Le récap à envoyer, comparé à S-1</p>
      </div>
      <div className={styles.weekCard}>
        <Link href={weekPath(slug, start)} className={styles.weekMain}>
          <span className={styles.weekEyebrow}>Semaine {isoWeekNumber(start)}</span>
          <span className={styles.weekTitle}>{weekSpan(start)}</span>
          <span className={styles.weekFigures}>
            <span className={styles.cardValue}>{formatEuro(current.totals.revenue)}</span>
            <Delta
              value={relativeChange(current.totals.revenue, previous.totals.revenue)}
              format={formatSignedPercent}
            />
            <span className={styles.cardFoot}>
              {comparedDays < 7 ? 'vs les mêmes jours de S-1 (semaine en cours)' : 'vs S-1'}
            </span>
          </span>
        </Link>
        <Link href={weekPresentationPath(slug, start)} className={layout.buttonPrimary}>
          Rédiger le récap
        </Link>
      </div>
    </section>
  );
};

type Props = { params: Promise<{ slug: string }> };

const StoreHomePage: React.FC<Props> = async ({ params }) => {
  const { slug } = await params;
  const { store } = await requireStore(slug, storePath(slug));
  const loaded = await loadReports(store);

  const now = new Date();
  const currentId = monthId({ year: now.getFullYear(), month: now.getMonth() + 1 });

  return (
    <>
      <AppHeader
        storeName={store.name}
        slug={slug}
        actions={<RefreshButton storeId={store.id} />}
      />
      <main className={layout.main}>
        {loaded.kind !== 'ok' ? (
          <SheetProblem loaded={loaded} slug={slug} />
        ) : (
          <>
            <LatestWeek reports={loaded.reports} slug={slug} />
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
                        href={monthPath(slug, monthSlug(report.month))}
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
          </>
        )}
      </main>
    </>
  );
};

export default StoreHomePage;
