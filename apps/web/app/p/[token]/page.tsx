import layout from '@/components/layout/layout.module.css';
import { BlockView } from '@/components/presentation/BlockView';
import { Cover } from '@/components/presentation/Cover';
import presentation from '@/components/presentation/presentation.module.css';
import { PrintButton } from '@/components/presentation/PrintButton';
import { cx } from '@/lib';
import { formatDateTime } from '@/lib/report/format';
import { monthLabel } from '@/lib/report/months';
import { getPublishedSnapshot } from '@/lib/server/presentations';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ token: string }> };

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const snapshot = await getPublishedSnapshot((await params).token);
  return {
    title:
      snapshot === undefined
        ? undefined
        : `Bilan ${monthLabel(snapshot.report.month)} · ${snapshot.storeName}`,
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

  return (
    <div className={cx('theme-light', presentation.desk)}>
      <article className={presentation.sheet}>
        <Cover storeName={snapshot.storeName} report={snapshot.report} />
        {snapshot.blocks.map((block) => (
          <BlockView key={block.id} block={block} report={snapshot.report} />
        ))}
        <footer className={presentation.footer}>
          Chiffres figés le {formatDateTime(snapshot.report.fetchedAt)}
        </footer>
      </article>

      <div className={presentation.floatingActions}>
        <PrintButton className={layout.buttonPrimary} label="Télécharger en PDF" />
      </div>
    </div>
  );
};

export default SharedPresentationPage;
