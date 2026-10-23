import {
  formatDecimal,
  formatEuro,
  formatOneDecimal,
  formatPercent,
  formatSignedPercent,
  formatSignedPoints,
} from '@/lib/report/format';
import { monthName, weekdayName } from '@/lib/report/months';
import { relativeChange, type WeekFigures, type WeekRecap as Recap } from '@/lib/report/weeks';
import { Delta } from './Delta';
import styles from './report.module.css';

type Row = {
  label: string;
  detail?: string;
  value: (figures: WeekFigures) => number | undefined;
  format: (value: number | undefined) => string;
  /** Rates change in points (59 % → 62 % is "+3 pts"), everything else in % */
  change?: 'points';
};

// The indicators of the store's « Récap semaine », in its order
const ROWS: Row[] = [
  {
    label: 'CA HT',
    value: (figures) => (figures.totals.daysFilled > 0 ? figures.totals.revenue : undefined),
    format: formatEuro,
  },
  { label: 'Moyenne CA / jour', value: (figures) => figures.revenuePerDay, format: formatEuro },
  { label: 'Tickets / jour', value: (figures) => figures.ticketsPerDay, format: formatOneDecimal },
  { label: 'Articles / jour', value: (figures) => figures.itemsPerDay, format: formatOneDecimal },
  {
    label: 'PM',
    detail: 'panier moyen',
    value: (figures) => figures.totals.pm,
    format: formatEuro,
  },
  {
    label: 'IV',
    detail: 'articles par ticket',
    value: (figures) => figures.totals.iv,
    format: formatDecimal,
  },
  {
    label: 'TT',
    detail: 'transformation',
    value: (figures) => figures.totals.tt,
    format: formatPercent,
    change: 'points',
  },
];

const Change: React.FC<{ row: Row; recap: Recap }> = ({ row, recap }) => {
  const current = row.value(recap.current);
  const previous = row.value(recap.previous);
  if (row.change === 'points') {
    const points = current === undefined || previous === undefined ? undefined : current - previous;
    return <Delta value={points} format={formatSignedPoints} />;
  }
  return <Delta value={relativeChange(current, previous)} format={formatSignedPercent} />;
};

/** The week's indicators against the week before (S-1), the cash taken and the month to date —
 * the first page of the store's weekly recap. */
export const WeekRecap: React.FC<{
  recap: Recap;
  /** On the dashboard, explain how to get the figures that are missing */
  showHints?: boolean;
}> = ({ recap, showHints = false }) => {
  const { current, previous, monthToDate } = recap;
  const progress = Math.min(1, monthToDate?.attainment ?? 0);

  return (
    <div className={styles.recap}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Indicateurs</th>
              <th scope="col">Semaine</th>
              <th scope="col" className={styles.recapPreviousColumn}>
                S-1
              </th>
              <th scope="col">
                <span className={styles.recapLongLabel}>Évolution </span>vs S-1
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label}>
                <th scope="row">
                  {row.label}
                  {row.detail !== undefined && (
                    <span className={styles.rowDetail}> · {row.detail}</span>
                  )}
                </th>
                <td className={styles.recapValue}>{row.format(row.value(current))}</td>
                <td className={`${styles.recapPrevious} ${styles.recapPreviousColumn}`}>
                  {row.format(row.value(previous))}
                </td>
                <td>
                  <Change row={row} recap={recap} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.recapAside}>
        <article className={styles.tile}>
          <h3 className={styles.tileLabel}>Montant cash caisse</h3>
          <p className={styles.tileValue}>{formatEuro(current.cash)}</p>
          {current.cash === undefined && showHints && (
            <p className={styles.tileFoot}>
              Ajoutez une colonne « Cash » au Google Sheet pour le suivre ici.
            </p>
          )}
          {current.cash !== undefined && previous.cash !== undefined && (
            <p className={styles.tileFoot}>S-1 : {formatEuro(previous.cash)}</p>
          )}
        </article>

        {monthToDate !== undefined && (
          <article className={styles.tile}>
            <h3 className={styles.tileLabel}>
              Objectif {monthName(monthToDate.month).toLowerCase()} ·{' '}
              {formatEuro(monthToDate.objective || undefined)} HT
            </h3>
            <p className={styles.tileValue}>
              {formatEuro(monthToDate.revenue)}{' '}
              <span className={styles.tileValueUnit}>
                ({formatPercent(monthToDate.attainment)})
              </span>
            </p>
            <div
              className={styles.progress}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              aria-label="Avancement vers l’objectif du mois"
            >
              <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
            </div>
            <p className={styles.tileFoot}>
              Réalisé au {monthToDate.throughDay} {monthName(monthToDate.month).toLowerCase()}
            </p>
          </article>
        )}

        <p className={styles.recapNote}>
          {current.openDays} jour{current.openDays > 1 ? 's' : ''} d’ouverture
          {previous.openDays > 0 && ` (S-1 : ${previous.openDays})`}. Les moyennes par jour ne
          comptent que les jours ouverts.
          {recap.comparedDays > 0 && recap.comparedDays < 7 && (
            <>
              {' '}
              <strong>Semaine en cours</strong> : comparée à S-1 du lundi au{' '}
              {weekdayName(
                recap.days[recap.comparedDays - 1].month,
                recap.days[recap.comparedDays - 1].day,
              ).toLowerCase()}
              .
            </>
          )}
        </p>
      </div>
    </div>
  );
};
