import { cx } from '@/lib';
import {
  formatDecimal,
  formatEuro,
  formatEuroCents,
  formatInteger,
  formatNumber,
  formatPercentPrecise,
  formatSignedEuro,
} from '@/lib/report/format';
import { computeTotals, type Totals } from '@/lib/report/kpis';
import { weekdayIndex, weekdayName } from '@/lib/report/months';
import type { DayEntry, MonthReport } from '@/lib/report/types';
import type { WeekRecap } from '@/lib/report/weeks';
import { Delta } from './Delta';
import styles from './report.module.css';

type DayRow = {
  key: string;
  /** "lun." */
  weekday: string;
  /** "12", or "1er nov." when the table spans two months */
  label: string;
  entry?: DayEntry;
  startsWeek: boolean;
};

const RatioCells: React.FC<{ totals: Totals }> = ({ totals }) => (
  <>
    <td>{formatEuroCents(totals.pm)}</td>
    <td>{formatDecimal(totals.iv)}</td>
  </>
);

const DayTable: React.FC<{ rows: DayRow[]; extraColumns: string[]; totalLabel: string }> = ({
  rows,
  extraColumns,
  totalLabel,
}) => {
  const entries = rows.flatMap((row) => (row.entry === undefined ? [] : [row.entry]));
  const total = computeTotals(entries);
  const hasCash = entries.some((entry) => entry.cash !== undefined);
  const cashTotal = entries.reduce((sum, entry) => sum + (entry.cash ?? 0), 0);

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
            {hasCash && <th scope="col">Cash</th>}
            {extraColumns.map((column) => (
              <th scope="col" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, weekday, label, entry, startsWeek }) => {
            const totals = computeTotals(entry === undefined ? [] : [entry]);
            const isEmpty = entry?.revenue === undefined;
            return (
              <tr
                key={key}
                className={cx(isEmpty && styles.rowEmpty, startsWeek && styles.rowWeekStart)}
              >
                <th scope="row">
                  <span className={styles.weekday}>{weekday}</span> {label}
                </th>
                <td>{formatEuro(entry?.revenue)}</td>
                <td>{formatEuro(entry?.objective)}</td>
                <td>
                  <Delta value={isEmpty ? undefined : totals.diff} format={formatSignedEuro} />
                </td>
                <td>{formatInteger(entry?.tickets)}</td>
                <td>{formatInteger(entry?.items)}</td>
                <RatioCells totals={totals} />
                <td>{formatInteger(entry?.visitors)}</td>
                <td>{formatPercentPrecise(totals.tt)}</td>
                {hasCash && <td>{formatEuro(entry?.cash)}</td>}
                {extraColumns.map((column) => (
                  <td key={column}>{formatNumber(entry?.extras[column])}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">{totalLabel}</th>
            <td>{formatEuro(total.daysFilled > 0 ? total.revenue : undefined)}</td>
            <td>{formatEuro(total.objective || undefined)}</td>
            <td>
              <Delta
                value={total.daysFilled > 0 ? total.diff : undefined}
                format={formatSignedEuro}
              />
            </td>
            <td>{formatInteger(total.tickets || undefined)}</td>
            <td>{formatInteger(total.items || undefined)}</td>
            <RatioCells totals={total} />
            <td>{formatInteger(total.visitors || undefined)}</td>
            <td>{formatPercentPrecise(total.tt)}</td>
            {hasCash && <td>{formatEuro(cashTotal)}</td>}
            {extraColumns.map((column) => (
              <td key={column}>
                {formatNumber(entries.reduce((sum, entry) => sum + (entry.extras[column] ?? 0), 0))}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

const shortWeekday = (name: string) => `${name.slice(0, 3)}.`;

// "26 oct." — only when a week straddles two months
const dayAndMonth = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

export const DailyTable: React.FC<{ report: MonthReport }> = ({ report }) => (
  <DayTable
    totalLabel="Total"
    extraColumns={report.extraColumns}
    rows={report.days.map((day) => ({
      key: String(day.day),
      weekday: shortWeekday(weekdayName(report.month, day.day)),
      label: String(day.day),
      entry: day,
      startsWeek: weekdayIndex(report.month, day.day) === 0,
    }))}
  />
);

/** The seven days of a week, including those without a tab (shown empty). */
export const WeekDayTable: React.FC<{ recap: WeekRecap }> = ({ recap }) => {
  const spansMonths = recap.days[0].month.month !== recap.days[6].month.month;
  return (
    <DayTable
      totalLabel="Semaine"
      extraColumns={recap.extraColumns}
      rows={recap.days.map((day) => ({
        key: day.date,
        weekday: shortWeekday(weekdayName(day.month, day.day)),
        label: spansMonths
          ? dayAndMonth.format(new Date(`${day.date}T00:00:00Z`))
          : String(day.day),
        entry: day.entry,
        startsWeek: false,
      }))}
    />
  );
};
