import type { Totals, WeekGroup } from '@/lib/report/kpis';
import {
  formatDecimal,
  formatEuro,
  formatEuroCents,
  formatInteger,
  formatPercent,
  formatPercentPrecise,
  formatSignedEuro,
} from '@/lib/report/format';
import type { MonthKey } from '@/lib/report/months';
import { dateOf, mondayOf } from '@/lib/report/weeks';
import { weekPath } from '@/lib/urls';
import Link from 'next/link';
import { Delta } from './Delta';
import styles from './report.module.css';

const weekLabel = (week: WeekGroup) =>
  week.from === week.to ? `Le ${week.from}` : `Du ${week.from} au ${week.to}`;

const TotalsCells: React.FC<{ totals: Totals }> = ({ totals }) => (
  <>
    <td>{formatEuro(totals.daysFilled > 0 ? totals.revenue : undefined)}</td>
    <td>{formatEuro(totals.objective || undefined)}</td>
    <td>
      <Delta value={totals.daysFilled > 0 ? totals.diff : undefined} format={formatSignedEuro} />
    </td>
    <td>{formatPercent(totals.attainment)}</td>
    <td>{formatInteger(totals.tickets || undefined)}</td>
    <td>{formatEuroCents(totals.pm)}</td>
    <td>{formatDecimal(totals.iv)}</td>
    <td>{formatInteger(totals.visitors || undefined)}</td>
    <td>{formatPercentPrecise(totals.tt)}</td>
  </>
);

/** One row per week of the month. With `month`, each week links to its recap (the dashboard;
 * presentations leave it out). */
export const WeeklyTable: React.FC<{
  weeks: WeekGroup[];
  total: Totals;
  month?: MonthKey;
  slug?: string;
}> = ({ weeks, total, month, slug }) => (
  <div className={styles.tableScroll}>
    <table className={styles.table}>
      <thead>
        <tr>
          <th scope="col">Semaine</th>
          <th scope="col">Réalisé</th>
          <th scope="col">Objectif</th>
          <th scope="col">Écart</th>
          <th scope="col">Atteint</th>
          <th scope="col">Tickets</th>
          <th scope="col">PM</th>
          <th scope="col">IV</th>
          <th scope="col">Passages</th>
          <th scope="col">TT</th>
        </tr>
      </thead>
      <tbody>
        {weeks.map((week) => (
          <tr key={week.from}>
            <th scope="row">
              {month === undefined || slug === undefined ? (
                weekLabel(week)
              ) : (
                <Link
                  href={weekPath(slug, mondayOf(dateOf(month, week.from)))}
                  className={styles.rowLink}
                >
                  {weekLabel(week)}
                </Link>
              )}
            </th>
            <TotalsCells totals={week.totals} />
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">Mois</th>
          <TotalsCells totals={total} />
        </tr>
      </tfoot>
    </table>
  </div>
);
