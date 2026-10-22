import type { MonthSummary } from '@/lib/report/kpis';
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

export const KpiTiles: React.FC<{ summary: MonthSummary }> = ({ summary }) => {
  const { totals, monthObjective, monthAttainment, landing } = summary;
  const progress = Math.min(1, monthAttainment ?? 0);

  return (
    <section className={styles.tiles} aria-label="Indicateurs clés du mois">
      <article className={`${styles.tile} ${styles.tileHero}`}>
        <h3 className={styles.tileLabel}>Chiffre d’affaires HT</h3>
        <p className={styles.heroValue}>{formatEuro(totals.revenue)}</p>
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
          <strong>{formatPercent(monthAttainment)}</strong> de l’objectif mensuel de{' '}
          {formatEuro(monthObjective)}
        </p>
      </article>

      <article className={styles.tile}>
        <h3 className={styles.tileLabel}>Écart à l’objectif</h3>
        <p className={styles.tileValue}>
          <Delta
            value={totals.daysFilled > 0 ? totals.diff : undefined}
            format={formatSignedEuro}
          />
        </p>
        <p className={styles.tileFoot}>
          {formatPercent(totals.attainment)} de l’objectif à date ({totals.daysFilled} j saisis)
        </p>
      </article>

      <article className={styles.tile}>
        <h3 className={styles.tileLabel}>Atterrissage estimé</h3>
        <p className={styles.tileValue}>{formatEuro(landing)}</p>
        <p className={styles.tileFoot}>Si le rythme actuel se maintient</p>
      </article>

      <article className={styles.tile}>
        <h3 className={styles.tileLabel}>Panier moyen · PM</h3>
        <p className={styles.tileValue}>{formatEuroCents(totals.pm)}</p>
        <p className={styles.tileFoot}>{formatInteger(totals.tickets)} tickets</p>
      </article>

      <article className={styles.tile}>
        <h3 className={styles.tileLabel}>Indice de vente · IV</h3>
        <p className={styles.tileValue}>{formatDecimal(totals.iv)}</p>
        <p className={styles.tileFoot}>
          articles par ticket · {formatInteger(totals.items)} articles
        </p>
      </article>

      <article className={styles.tile}>
        <h3 className={styles.tileLabel}>Taux de transformation · TT</h3>
        <p className={styles.tileValue}>{formatPercentPrecise(totals.tt)}</p>
        <p className={styles.tileFoot}>{formatInteger(totals.visitors)} passages</p>
      </article>
    </section>
  );
};
