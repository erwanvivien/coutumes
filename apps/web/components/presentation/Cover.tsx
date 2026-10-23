import { summarizeMonth } from '@/lib/report/kpis';
import { monthLabel, monthName } from '@/lib/report/months';
import { isoWeekNumber, weekRange, weekSpan } from '@/lib/report/weeks';
import type { BlockContext } from './BlockView';
import styles from './presentation.module.css';

/** Title band of a presentation: « Bilan des ventes » for a month, « Récap semaine » for a week,
 * as the store titled its Word recaps. */
export const Cover: React.FC<{ storeName: string; context: BlockContext }> = ({
  storeName,
  context,
}) => {
  if (context.kind === 'week') {
    const { start } = context.recap;
    return (
      <header className={styles.cover}>
        <p className={styles.coverEyebrow}>{storeName}</p>
        <h1 className={styles.coverTitle}>Récap semaine {weekRange(start)}</h1>
        <p className={styles.coverMeta}>
          Semaine {isoWeekNumber(start)} · {weekSpan(start)}
        </p>
      </header>
    );
  }

  const { report } = context;
  const { lastFilledDay } = summarizeMonth(report);
  return (
    <header className={styles.cover}>
      <p className={styles.coverEyebrow}>{storeName}</p>
      <h1 className={styles.coverTitle}>Bilan des ventes · {monthLabel(report.month)}</h1>
      {lastFilledDay !== undefined && (
        <p className={styles.coverMeta}>
          Données arrêtées au {lastFilledDay} {monthName(report.month).toLowerCase()}{' '}
          {report.month.year}
        </p>
      )}
    </header>
  );
};
