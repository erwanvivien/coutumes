import { summarizeMonth } from '@/lib/report/kpis';
import { monthLabel, monthName } from '@/lib/report/months';
import type { MonthReport } from '@/lib/report/types';
import styles from './presentation.module.css';

export const Cover: React.FC<{ storeName: string; report: MonthReport }> = ({
  storeName,
  report,
}) => {
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
