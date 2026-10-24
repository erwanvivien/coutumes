import { WeekChart } from '@/components/charts/WeekChart';
import { AppHeader, type PeriodNav } from '@/components/layout/AppHeader';
import layout from '@/components/layout/layout.module.css';
import { Notice } from '@/components/layout/Notice';
import { RefreshButton } from '@/components/layout/RefreshButton';
import { Section } from '@/components/layout/Section';
import { SheetProblem } from '@/components/layout/SheetProblem';
import { WeekDayTable } from '@/components/report/DailyTable';
import { WeekRecap } from '@/components/report/WeekRecap';
import { formatDateTime } from '@/lib/report/format';
import { monthLabel, monthSlug } from '@/lib/report/months';
import { periodLabel } from '@/lib/report/periods';
import type { MonthReport } from '@/lib/report/types';
import {
  coveredWeeks,
  mondayOf,
  parseWeekSlug,
  storeDate,
  weekRange,
  weekRecap,
  weekSpan,
  type IsoDate,
} from '@/lib/report/weeks';
import { requireStore } from '@/lib/server/access';
import { loadReports } from '@/lib/server/loadReports';
import { monthPath, weekPath, weekPresentationPath } from '@/lib/urls';
import { CalendarDays, FileText } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

type Props = { params: Promise<{ slug: string; start: string }> };

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const date = parseWeekSlug((await params).start);
  return { title: date === undefined ? undefined : `Semaine ${weekRange(mondayOf(date))}` };
};

/** Neighbouring weeks among those the sheet's tabs cover. */
const weekNav = (reports: MonthReport[], slug: string, start: IsoDate): PeriodNav => {
  const weeks = coveredWeeks(reports);
  const previous = weeks.findLast((week) => week < start);
  const next = weeks.find((week) => week > start);
  const link = (week: IsoDate | undefined) =>
    week === undefined
      ? undefined
      : { href: weekPath(slug, week), label: `Semaine ${weekRange(week)}` };
  return {
    title: periodLabel({ kind: 'week', start }),
    label: 'Changer de semaine',
    previous: link(previous),
    next: link(next),
  };
};

const WeekPage: React.FC<Props> = async ({ params }) => {
  const { slug, start: startParam } = await params;
  const date = parseWeekSlug(startParam);
  if (date === undefined) {
    notFound();
  }
  const start = mondayOf(date);
  if (start !== date) {
    redirect(weekPath(slug, start));
  }
  const { store } = await requireStore(slug, weekPath(slug, start));

  const loaded = await loadReports(store);
  const reports = loaded.kind === 'ok' ? loaded.reports : [];
  const recap = weekRecap(reports, start, storeDate(new Date()));
  const isCovered = recap.days.some((day) => day.entry !== undefined);
  const month = recap.monthToDate?.month;

  return (
    <>
      <AppHeader
        storeName={store.name}
        slug={slug}
        nav={weekNav(reports, slug, start)}
        actions={
          <>
            <RefreshButton storeId={store.id} />
            {month !== undefined && (
              <Link href={monthPath(slug, monthSlug(month))} className={layout.button}>
                <CalendarDays size={16} aria-hidden />
                <span className={layout.buttonLabel}>{monthLabel(month)}</span>
              </Link>
            )}
            {isCovered && (
              <Link href={weekPresentationPath(slug, start)} className={layout.buttonPrimary}>
                <FileText size={16} aria-hidden />
                <span className={layout.buttonLabel}>Récap semaine</span>
              </Link>
            )}
          </>
        }
      />

      <main className={layout.main}>
        {loaded.kind !== 'ok' && <SheetProblem loaded={loaded} slug={slug} />}

        {loaded.kind === 'ok' && !isCovered && (
          <Notice title={`Aucun onglet pour la semaine ${weekRange(start)}`}>
            <p>
              Le Google Sheet n’a pas d’onglet pour le mois de cette semaine. Les onglets doivent
              être nommés comme « Octobre » ou « Janvier 27 ».
            </p>
          </Notice>
        )}

        {isCovered && (
          <>
            <p className={layout.meta}>
              {/* Covered, so at least one month was read */}
              Semaine {weekSpan(start)} · lu le {formatDateTime(reports[0].fetchedAt)}
              {!recap.hasData && ' · rien de saisi pour l’instant'}
            </p>

            <Section title="Indicateurs" description="Comparés à la semaine précédente (S-1)">
              <WeekRecap recap={recap} showHints />
            </Section>

            <Section
              title="Chiffre d’affaires par jour"
              description="Réalisé HT, même jour de S-1 et objectif du jour"
              card
            >
              <WeekChart recap={recap} />
            </Section>

            <Section title="Détail jour par jour">
              <WeekDayTable recap={recap} />
            </Section>
          </>
        )}
      </main>
    </>
  );
};

export default WeekPage;
