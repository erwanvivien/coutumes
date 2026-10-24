import { AppHeader } from '@/components/layout/AppHeader';
import layout from '@/components/layout/layout.module.css';
import { Notice } from '@/components/layout/Notice';
import { SheetProblem } from '@/components/layout/SheetProblem';
import { PresentationEditor } from '@/components/presentation/PresentationEditor';
import { mondayOf, parseWeekSlug, storeDate, weekRange, weekRecap } from '@/lib/report/weeks';
import { requireStore } from '@/lib/server/access';
import { loadReports } from '@/lib/server/loadReports';
import { getOrCreatePresentation } from '@/lib/server/presentations';
import { weekPresentationPath } from '@/lib/urls';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

type Props = { params: Promise<{ slug: string; start: string }> };

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const date = parseWeekSlug((await params).start);
  return { title: date === undefined ? undefined : `Récap semaine ${weekRange(mondayOf(date))}` };
};

/** The store's « Récap semaine », written here instead of in Word. */
const WeekPresentationPage: React.FC<Props> = async ({ params }) => {
  const { slug, start: startParam } = await params;
  const date = parseWeekSlug(startParam);
  if (date === undefined) {
    notFound();
  }
  const start = mondayOf(date);
  if (start !== date) {
    redirect(weekPresentationPath(slug, start));
  }
  const { store } = await requireStore(slug, weekPresentationPath(slug, start));

  const loaded = await loadReports(store);
  const recap =
    loaded.kind === 'ok' ? weekRecap(loaded.reports, start, storeDate(new Date())) : undefined;

  if (recap === undefined || recap.days.every((day) => day.entry === undefined)) {
    return (
      <>
        <AppHeader storeName={store.name} slug={slug} />
        <main className={layout.main}>
          {loaded.kind === 'ok' ? (
            <Notice title={`Aucun onglet pour la semaine ${weekRange(start)}`}>
              <p>Ajoutez l’onglet du mois dans le Google Sheet pour préparer son récap.</p>
            </Notice>
          ) : (
            <SheetProblem loaded={loaded} slug={slug} />
          )}
        </main>
      </>
    );
  }

  const period = { kind: 'week', start } as const;
  const presentation = await getOrCreatePresentation(store.id, period);

  return (
    <PresentationEditor
      period={period}
      slug={slug}
      storeId={store.id}
      storeName={store.name}
      context={{ kind: 'week', recap }}
      initialBlocks={presentation.blocks}
      initialShareToken={presentation.shareToken}
      initialPublishedAt={presentation.publishedAt?.toISOString()}
    />
  );
};

export default WeekPresentationPage;
