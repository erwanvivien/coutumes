import { cx } from '@/lib';
import {
  formatDecimal,
  formatEuro,
  formatEuroCents,
  formatInteger,
  formatPercentPrecise,
  formatSignedEuro,
} from '@/lib/report/format';
import { computeTotals, type Totals } from '@/lib/report/kpis';
import { weekdayIndex, weekdayName } from '@/lib/report/months';
import type { MonthReport } from '@/lib/report/types';
import { Delta } from './Delta';
import styles from './report.module.css';

const RatioCells: React.FC<{ totals: Totals }> = ({ totals }) => (
  <>
    <td>{formatEuroCents(totals.pm)}</td>
    <td>{formatDecimal(totals.iv)}</td>
  </>
);

export const DailyTable: React.FC<{ report: MonthReport }> = ({ report }) => {
  const total = computeTotals(report.days);

  return (
    <div className={styles.tableScroll}>
      <table className={cx(styles.table, styles.tableDense)}>
        <thead>
          <tr>
            <th scope="col">Jour</th>
            <th scope="col">Réalisé</th>
            <th scope="col">Objectif</th>
            <th scope="col">Écart</th>
            <th scope="col">Tickets</th>
            <th scope="col">Articles</th>
            <th scope="col">PM</th>
            <th scope="col">IV</th>
            <th scope="col">Passages</th>
            <th scope="col">TT</th>
            {report.extraColumns.map((column) => (
              <th scope="col" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.days.map((day) => {
            const totals = computeTotals([day]);
            const isEmpty = day.revenue === undefined;
            return (
              <tr
                key={day.day}
                className={cx(
                  isEmpty && styles.rowEmpty,
                  weekdayIndex(report.month, day.day) === 0 && styles.rowWeekStart,
                )}
              >
                <th scope="row">
                  <span className={styles.weekday}>
                    {weekdayName(report.month, day.day).slice(0, 3)}.
                  </span>{' '}
                  {day.day}
                </th>
                <td>{formatEuro(day.revenue)}</td>
                <td>{formatEuro(day.objective)}</td>
                <td>
                  <Delta value={isEmpty ? undefined : totals.diff} format={formatSignedEuro} />
                </td>
                <td>{formatInteger(day.tickets)}</td>
                <td>{formatInteger(day.items)}</td>
                <RatioCells totals={totals} />
                <td>{formatInteger(day.visitors)}</td>
                <td>{formatPercentPrecise(totals.tt)}</td>
                {report.extraColumns.map((column) => (
                  <td key={column}>{formatDecimal(day.extras[column])}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td>{formatEuro(total.revenue)}</td>
            <td>{formatEuro(total.objective)}</td>
            <td>
              <Delta
                value={total.daysFilled > 0 ? total.diff : undefined}
                format={formatSignedEuro}
              />
            </td>
            <td>{formatInteger(total.tickets)}</td>
            <td>{formatInteger(total.items)}</td>
            <RatioCells totals={total} />
            <td>{formatInteger(total.visitors)}</td>
            <td>{formatPercentPrecise(total.tt)}</td>
            {report.extraColumns.map((column) => (
              <td key={column}>
                {formatDecimal(
                  report.days.reduce((sum, day) => sum + (day.extras[column] ?? 0), 0),
                )}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
