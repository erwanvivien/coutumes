import layout from '@/components/layout/layout.module.css';
import { BlockView, type BlockContext } from '@/components/presentation/BlockView';
import { Cover } from '@/components/presentation/Cover';
import presentation from '@/components/presentation/presentation.module.css';
import { PrintButton } from '@/components/presentation/PrintButton';
import { cx } from '@/lib';
import { formatDateTime } from '@/lib/report/format';
import { monthLabel } from '@/lib/report/months';
import { storeDate, weekRange, weekRecap } from '@/lib/report/weeks';
import type { Snapshot } from '@/lib/schemas/report';
import { getPublishedSnapshot } from '@/lib/server/presentations';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ token: string }> };

const contextOf = (snapshot: Snapshot): BlockContext =>
  snapshot.kind === 'week'
    ? {
        kind: 'week',
        // As the week stood when it was published
        recap: weekRecap(
          snapshot.reports,
          snapshot.weekStart,
          storeDate(new Date(snapshot.fetchedAt)),
        ),
      }
    : { kind: 'month', report: snapshot.report };

const titleOf = (snapshot: Snapshot): string =>
  snapshot.kind === 'week'
    ? `Récap semaine ${weekRange(snapshot.weekStart)}`
    : `Bilan ${monthLabel(snapshot.report.month)}`;

const fetchedAtOf = (snapshot: Snapshot): string =>
  snapshot.kind === 'week' ? snapshot.fetchedAt : snapshot.report.fetchedAt;

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const snapshot = await getPublishedSnapshot((await params).token);
  return {
    title: snapshot === undefined ? undefined : `${titleOf(snapshot)} · ${snapshot.storeName}`,
    // Anyone with the link can read it, but it must never show up in search results
    robots: { index: false, follow: false },
  };
};

/** Public, read-only view of a published presentation — no account needed. */
const SharedPresentationPage: React.FC<Props> = async ({ params }) => {
  const snapshot = await getPublishedSnapshot((await params).token);
  if (snapshot === undefined) {
    notFound();
  }

  const context = contextOf(snapshot);

  return (
    <div className={cx('theme-light', presentation.desk)}>
      <article className={presentation.sheet} data-period={context.kind}>
        <Cover storeName={snapshot.storeName} context={context} />
        {snapshot.blocks.map((block) => (
          <BlockView key={block.id} block={block} context={context} />
        ))}
        <footer className={presentation.footer}>
          <span className={presentation.footerMark}>{snapshot.storeName}</span>
          <span>Chiffres figés le {formatDateTime(fetchedAtOf(snapshot))}</span>
        </footer>
      </article>

      <div className={presentation.floatingActions}>
        <PrintButton className={layout.buttonPrimary} label="Télécharger en PDF" />
      </div>
    </div>
  );
};

export default SharedPresentationPage;
