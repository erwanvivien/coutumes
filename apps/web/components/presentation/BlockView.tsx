import { CumulativeChart } from '@/components/charts/CumulativeChart';
import { DailyRevenueChart } from '@/components/charts/DailyRevenueChart';
import { WeekChart } from '@/components/charts/WeekChart';
import { DailyTable, WeekDayTable } from '@/components/report/DailyTable';
import { KpiTiles } from '@/components/report/KpiTiles';
import { WeekRecap } from '@/components/report/WeekRecap';
import { WeeklyTable } from '@/components/report/WeeklyTable';
import { assertNever } from '@/lib';
import type { Block } from '@/lib/report/blocks';
import { groupByWeek, summarizeMonth } from '@/lib/report/kpis';
import type { MonthReport } from '@/lib/report/types';
import type { WeekRecap as Recap } from '@/lib/report/weeks';
import { RichText } from './RichText';
import styles from './presentation.module.css';

/** The figures a presentation is about: a month tab, or a week's recap. */
export type BlockContext = { kind: 'month'; report: MonthReport } | { kind: 'week'; recap: Recap };

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className={styles.chartCard}>
    <h3 className={styles.chartTitle}>{title}</h3>
    {children}
  </div>
);

const MonthBlock: React.FC<{ block: Block; report: MonthReport }> = ({ block, report }) => {
  switch (block.type) {
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
    default:
      return null;
  }
};

const WeekBlock: React.FC<{ block: Block; recap: Recap }> = ({ block, recap }) => {
  switch (block.type) {
    case 'week-recap':
      return <WeekRecap recap={recap} />;
    case 'week-chart':
      return (
        <ChartCard title="Chiffre d’affaires HT par jour, comparé à S-1">
          <WeekChart recap={recap} />
        </ChartCard>
      );
    case 'week-table':
      return <WeekDayTable recap={recap} />;
    default:
      return null;
  }
};

/** Read-only rendering of one block against the period's figures. A data block of the other kind
 * of period (a month chart in a weekly recap) renders nothing. */
export const BlockView: React.FC<{ block: Block; context: BlockContext }> = ({
  block,
  context,
}) => {
  switch (block.type) {
    case 'heading':
      return block.text.trim() === '' ? null : <h2 className={styles.heading}>{block.text}</h2>;
    case 'text':
      return block.text.trim() === '' ? null : (
        <div className={styles.text}>
          <RichText text={block.text} />
        </div>
      );
    case 'page-break':
      return <div className={styles.pageBreak} aria-hidden />;
    case 'kpis':
    case 'daily-chart':
    case 'cumulative-chart':
    case 'weekly-table':
    case 'daily-table':
      return context.kind === 'month' ? <MonthBlock block={block} report={context.report} /> : null;
    case 'week-recap':
    case 'week-chart':
    case 'week-table':
      return context.kind === 'week' ? <WeekBlock block={block} recap={context.recap} /> : null;
    default:
      return assertNever(block);
  }
};
