import { CumulativeChart } from '@/components/charts/CumulativeChart';
import { DailyRevenueChart } from '@/components/charts/DailyRevenueChart';
import { AppHeader } from '@/components/layout/AppHeader';
import layout from '@/components/layout/layout.module.css';
import { Notice } from '@/components/layout/Notice';
import { RefreshButton } from '@/components/layout/RefreshButton';
import { Section } from '@/components/layout/Section';
import { SheetProblem } from '@/components/layout/SheetProblem';
import { TabIssuesBanner } from '@/components/layout/TabIssues';
import { DailyTable } from '@/components/report/DailyTable';
import { KpiTiles } from '@/components/report/KpiTiles';
import { WeeklyTable } from '@/components/report/WeeklyTable';
import { formatDateTime } from '@/lib/report/format';
import { groupByWeek, summarizeMonth } from '@/lib/report/kpis';
import { monthId, monthLabel, monthSlug, parseMonthSlug } from '@/lib/report/months';
import type { MonthReport } from '@/lib/report/types';
import { requireStore } from '@/lib/server/access';
import { loadReports } from '@/lib/server/loadReports';
import { monthPath, presentationPath } from '@/lib/urls';
import { Presentation } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ slug: string; month: string }> };

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const month = parseMonthSlug((await params).month);
  return { title: month === undefined ? undefined : monthLabel(month) };
};

const MonthPage: React.FC<Props> = async ({ params }) => {
  const { slug, month: monthSlugParam } = await params;
  const month = parseMonthSlug(monthSlugParam);
  if (month === undefined) {
    notFound();
  }
  const { store } = await requireStore(slug, monthPath(slug, monthSlugParam));

  const loaded = await loadReports(store);
  const reports = loaded.kind === 'ok' ? loaded.reports : [];
  const index = reports.findIndex((report) => monthId(report.month) === monthId(month));
  const report = index === -1 ? undefined : reports[index];
  // The tab for this month, even if it couldn't be read (so we can say why)
  const tab =
    loaded.kind === 'ok'
      ? loaded.tabs.find(
          (candidate) =>
            candidate.month !== undefined && monthId(candidate.month) === monthId(month),
        )
      : undefined;

  // Neighbours by sheet order, so the arrows skip months that have no tab
  const previous = index > 0 ? reports[index - 1].month : undefined;
  const next = index !== -1 && index < reports.length - 1 ? reports[index + 1].month : undefined;

  return (
    <>
      <AppHeader
        storeName={store.name}
        slug={slug}
        nav={{
          title: monthLabel(month),
          label: 'Changer de mois',
          previous: previous && {
            href: monthPath(slug, monthSlug(previous)),
            label: monthLabel(previous),
          },
          next: next && { href: monthPath(slug, monthSlug(next)), label: monthLabel(next) },
        }}
        actions={
          <>
            <RefreshButton storeId={store.id} />
            {report !== undefined && (
              <Link href={presentationPath(slug, monthSlugParam)} className={layout.buttonPrimary}>
                <Presentation size={16} aria-hidden />
                <span className={layout.buttonLabel}>Présentation</span>
              </Link>
            )}
          </>
        }
      />

      <main className={layout.main}>
        {loaded.kind !== 'ok' && <SheetProblem loaded={loaded} slug={slug} />}

        {loaded.kind === 'ok' && report === undefined && tab === undefined && (
          <Notice title={`Aucun onglet pour ${monthLabel(month)}`}>
            <p>
              Le Google Sheet n’a pas d’onglet correspondant à ce mois. Les onglets doivent être
              nommés comme « Novembre » ou « Janvier 27 ».
            </p>
          </Notice>
        )}

        {tab !== undefined && tab.status !== 'ok' && (
          <TabIssuesBanner
            tabName={tab.tabName}
            issues={tab.issues}
            invalid={tab.status === 'invalid'}
          />
        )}
        {report !== undefined && <MonthDashboard report={report} slug={slug} />}
      </main>
    </>
  );
};

const MonthDashboard: React.FC<{ report: MonthReport; slug: string }> = ({ report, slug }) => {
  const summary = summarizeMonth(report);
  const weeks = groupByWeek(report.month, report.days);

  return (
    <>
      <p className={layout.meta}>
        Onglet « {report.tabName} » · lu le {formatDateTime(report.fetchedAt)}
        {summary.lastFilledDay !== undefined && ` · saisi jusqu’au ${summary.lastFilledDay}`}
      </p>

      <KpiTiles summary={summary} />

      <Section
        title="Chiffre d’affaires par jour"
        description="Réalisé HT et objectif du jour"
        card
      >
        <DailyRevenueChart report={report} />
      </Section>

      <Section title="Progression vers l’objectif" description="Cumul depuis le début du mois" card>
        <CumulativeChart report={report} />
      </Section>

      <Section
        title="Par semaine"
        description="Ouvrez une semaine pour son récap et sa comparaison à S-1"
      >
        <WeeklyTable weeks={weeks} total={summary.totals} month={report.month} slug={slug} />
      </Section>

      <Section title="Détail jour par jour">
        <DailyTable report={report} />
      </Section>
    </>
  );
};

export default MonthPage;
