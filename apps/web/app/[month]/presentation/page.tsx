import { AppHeader } from '@/components/layout/AppHeader';
import layout from '@/components/layout/layout.module.css';
import { Notice } from '@/components/layout/Notice';
import { SheetProblem } from '@/components/layout/SheetProblem';
import { PresentationEditor } from '@/components/presentation/PresentationEditor';
import { monthId, monthLabel, parseMonthSlug } from '@/lib/report/months';
import { requireEditor } from '@/lib/server/access';
import { loadReports } from '@/lib/server/loadReports';
import { getOrCreatePresentation } from '@/lib/server/presentations';
import { storeName } from '@/lib/server/store';
import { presentationPath } from '@/lib/urls';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ month: string }> };

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const month = parseMonthSlug((await params).month);
  return { title: month === undefined ? undefined : `Présentation ${monthLabel(month)}` };
};

const PresentationPage: React.FC<Props> = async ({ params }) => {
  const { month: slug } = await params;
  const month = parseMonthSlug(slug);
  if (month === undefined) {
    notFound();
  }
  await requireEditor(presentationPath(slug));

  const loaded = await loadReports();
  const report =
    loaded.kind === 'ok'
      ? loaded.reports.find((candidate) => monthId(candidate.month) === monthId(month))
      : undefined;

  if (report === undefined) {
    return (
      <>
        <AppHeader storeName={storeName()} month={month} />
        <main className={layout.main}>
          {loaded.kind === 'ok' ? (
            <Notice title={`Aucun onglet pour ${monthLabel(month)}`}>
              <p>Ajoutez l’onglet du mois dans le Google Sheet pour préparer sa présentation.</p>
            </Notice>
          ) : (
            <SheetProblem loaded={loaded} />
          )}
        </main>
      </>
    );
  }

  const presentation = await getOrCreatePresentation(monthId(month));

  return (
    <PresentationEditor
      slug={slug}
      storeName={storeName()}
      report={report}
      initialBlocks={presentation.blocks}
      initialShareToken={presentation.shareToken}
      initialPublishedAt={presentation.publishedAt?.toISOString()}
    />
  );
};

export default PresentationPage;
