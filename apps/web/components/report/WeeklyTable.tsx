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
import { Delta } from './Delta';
import styles from './report.module.css';

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

export const WeeklyTable: React.FC<{ weeks: WeekGroup[]; total: Totals }> = ({ weeks, total }) => (
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
              {week.from === week.to ? `Le ${week.from}` : `Du ${week.from} au ${week.to}`}
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
