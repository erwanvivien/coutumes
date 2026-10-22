import { CumulativeChart } from '@/components/charts/CumulativeChart';
import { DailyRevenueChart } from '@/components/charts/DailyRevenueChart';
import { DailyTable } from '@/components/report/DailyTable';
import { KpiTiles } from '@/components/report/KpiTiles';
import { WeeklyTable } from '@/components/report/WeeklyTable';
import { assertNever } from '@/lib';
import type { Block } from '@/lib/report/blocks';
import { groupByWeek, summarizeMonth } from '@/lib/report/kpis';
import type { MonthReport } from '@/lib/report/types';
import { RichText } from './RichText';
import styles from './presentation.module.css';

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className={styles.chartCard}>
    <h3 className={styles.chartTitle}>{title}</h3>
    {children}
  </div>
);

/** Read-only rendering of one block against a month's figures. */
export const BlockView: React.FC<{ block: Block; report: MonthReport }> = ({ block, report }) => {
  switch (block.type) {
    case 'heading':
      return block.text.trim() === '' ? null : <h2 className={styles.heading}>{block.text}</h2>;
    case 'text':
      return block.text.trim() === '' ? null : (
        <p className={styles.text}>
          <RichText text={block.text} />
        </p>
      );
    case 'kpis':
      return <KpiTiles summary={summarizeMonth(report)} />;
    case 'daily-chart':
      return (
        <ChartCard title="Chiffre d’affaires HT par jour">
          <DailyRevenueChart report={report} />
        </ChartCard>
      );
    case 'cumulative-chart':
      return (
        <ChartCard title="Progression vers l’objectif du mois">
          <CumulativeChart report={report} />
        </ChartCard>
      );
    case 'weekly-table': {
      const summary = summarizeMonth(report);
      return <WeeklyTable weeks={groupByWeek(report.month, report.days)} total={summary.totals} />;
    }
    case 'daily-table':
      return <DailyTable report={report} />;
    case 'page-break':
      return <div className={styles.pageBreak} aria-hidden />;
    default:
      return assertNever(block);
  }
};
