'use client';

import layout from '@/components/layout/layout.module.css';
import { cx } from '@/lib';
import {
  ADDABLE_BLOCKS,
  BLOCK_LABELS,
  newBlock,
  type Block,
  type BlockType,
} from '@/lib/report/blocks';
import { formatDateTime } from '@/lib/report/format';
import { monthSlug } from '@/lib/report/months';
import { periodId, periodLabel, type Period } from '@/lib/report/periods';
import { monthPath, sharePath, weekPath } from '@/lib/urls';
import { ArrowDown, ArrowLeft, ArrowUp, Check, Copy, Link2, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { publishPresentation, savePresentationBlocks, unpublishPresentation } from './actions';
import { BlockView, type BlockContext } from './BlockView';
import { Cover } from './Cover';
import styles from './editor.module.css';
import presentation from './presentation.module.css';
import { PrintButton } from './PrintButton';
import { TextBlockEditor } from './TextBlockEditor';

type SaveState = 'saved' | 'saving' | 'error';

const AUTOSAVE_DELAY_MS = 800;

export const PresentationEditor: React.FC<{
  period: Period;
  slug: string;
  storeId: string;
  storeName: string;
  context: BlockContext;
  initialBlocks: Block[];
  initialShareToken?: string;
  initialPublishedAt?: string;
}> = ({
  period,
  slug,
  storeId,
  storeName,
  context,
  initialBlocks,
  initialShareToken,
  initialPublishedAt,
}) => {
  const id = periodId(period);
  const [blocks, setBlocks] = useState(initialBlocks);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [share, setShare] = useState(
    initialShareToken !== undefined && initialPublishedAt !== undefined
      ? { token: initialShareToken, publishedAt: initialPublishedAt }
      : undefined,
  );
  const [changedSincePublish, setChangedSincePublish] = useState(false);
  const [isPublishing, startPublishing] = useTransition();
  const [copied, setCopied] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | undefined>(undefined);
  const lastSaved = useRef(JSON.stringify(initialBlocks));

  // Autosave, debounced so typing doesn't fire a request per keystroke
  useEffect(() => {
    const serialized = JSON.stringify(blocks);
    if (serialized === lastSaved.current) {
      return;
    }
    setSaveState('saving');
    const timeout = setTimeout(() => {
      savePresentationBlocks(storeId, id, blocks).then(
        () => {
          lastSaved.current = serialized;
          setSaveState('saved');
        },
        () => setSaveState('error'),
      );
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [id, storeId, blocks]);

  const updateBlocks = (update: (current: Block[]) => Block[]) => {
    setBlocks(update);
    setChangedSincePublish(true);
  };

  const setText = (id: string, text: string) =>
    updateBlocks((current) =>
      current.map((block) =>
        block.id === id && (block.type === 'heading' || block.type === 'text')
          ? { ...block, text }
          : block,
      ),
    );

  const move = (index: number, offset: -1 | 1) =>
    updateBlocks((current) => {
      const next = [...current];
      const [block] = next.splice(index, 1);
      next.splice(index + offset, 0, block);
      return next;
    });

  const remove = (id: string) =>
    updateBlocks((current) => current.filter((block) => block.id !== id));

  const add = (type: BlockType) => {
    const block = newBlock(type);
    setJustAddedId(block.id);
    updateBlocks((current) => [...current, block]);
  };

  const onPublish = () =>
    startPublishing(async () => {
      const result = await publishPresentation(storeId, id, blocks);
      setShare({ token: result.shareToken, publishedAt: result.publishedAt });
      setChangedSincePublish(false);
    });

  const onUnpublish = () =>
    startPublishing(async () => {
      await unpublishPresentation(storeId, id);
      setShare(undefined);
    });

  const shareUrl = share === undefined ? undefined : sharePath(share.token);

  const copyLink = async () => {
    if (shareUrl === undefined) {
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cx('theme-light', styles.root)}>
      <header className={cx(layout.header, styles.noPrint)}>
        <div className={styles.toolbar}>
          <Link
            href={
              period.kind === 'month'
                ? monthPath(slug, monthSlug(period.month))
                : weekPath(slug, period.start)
            }
            className={layout.button}
          >
            <ArrowLeft size={16} aria-hidden />
            <span className={layout.buttonLabel}>Tableau de bord</span>
          </Link>
          <div className={styles.toolbarTitle}>
            <strong>
              {period.kind === 'month' ? 'Présentation' : 'Récap semaine'} · {periodLabel(period)}
            </strong>
            <span className={styles.saveState} data-state={saveState}>
              {saveState === 'saving' && 'Enregistrement…'}
              {saveState === 'saved' && 'Enregistré'}
              {saveState === 'error' && 'Échec de l’enregistrement'}
            </span>
          </div>
          <div className={layout.actions}>
            <PrintButton className={layout.button} />
            <button
              type="button"
              className={layout.buttonPrimary}
              onClick={onPublish}
              disabled={isPublishing}
            >
              <Link2 size={16} aria-hidden />
              {share === undefined ? 'Publier un lien' : 'Republier'}
            </button>
          </div>
        </div>

        {share !== undefined && shareUrl !== undefined && (
          <div className={styles.sharePanel}>
            <input className={styles.shareInput} value={shareUrl} readOnly aria-label="Lien" />
            <button type="button" className={layout.button} onClick={() => void copyLink()}>
              {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
              {copied ? 'Copié' : 'Copier'}
            </button>
            <span className={styles.shareMeta}>
              {changedSincePublish
                ? 'Modifications non publiées : le lien montre la version du '
                : 'Figé le '}
              {formatDateTime(share.publishedAt)}
            </span>
            <button
              type="button"
              className={styles.linkButton}
              onClick={onUnpublish}
              disabled={isPublishing}
            >
              Désactiver le lien
            </button>
          </div>
        )}
      </header>

      <div className={presentation.desk}>
        <article className={presentation.sheet} data-period={period.kind}>
          <Cover storeName={storeName} context={context} />

          {blocks.map((block, index) => (
            <div key={block.id} className={styles.block}>
              <div className={cx(styles.blockControls, styles.noPrint)}>
                <span className={styles.blockLabel}>{BLOCK_LABELS[block.type]}</span>
                <button
                  type="button"
                  className={styles.miniButton}
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Monter"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  className={styles.miniButton}
                  onClick={() => move(index, 1)}
                  disabled={index === blocks.length - 1}
                  aria-label="Descendre"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  className={styles.miniButton}
                  onClick={() => remove(block.id)}
                  aria-label="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {block.type === 'heading' && (
                <input
                  className={cx(presentation.heading, styles.headingInput)}
                  value={block.text}
                  autoFocus={block.id === justAddedId}
                  placeholder="Titre de section"
                  onChange={(event) => setText(block.id, event.target.value)}
                />
              )}
              {block.type === 'text' && (
                <TextBlockEditor
                  text={block.text}
                  autoFocus={block.id === justAddedId}
                  onChange={(text) => setText(block.id, text)}
                />
              )}
              {block.type === 'page-break' && (
                <div className={cx(styles.pageBreakMarker, styles.noPrint)}>Saut de page</div>
              )}
              {block.type !== 'heading' && block.type !== 'text' && (
                <BlockView block={block} context={context} />
              )}
            </div>
          ))}

          <div className={cx(styles.addBar, styles.noPrint)}>
            <span className={styles.addLabel}>
              <Plus size={14} aria-hidden /> Ajouter
            </span>
            {ADDABLE_BLOCKS[period.kind].map((type) => (
              <button
                key={type}
                type="button"
                className={styles.addButton}
                onClick={() => add(type)}
              >
                {BLOCK_LABELS[type]}
              </button>
            ))}
          </div>

          <footer className={presentation.footer}>
            <span className={presentation.footerMark}>{storeName}</span>
          </footer>
        </article>
      </div>
    </div>
  );
};
