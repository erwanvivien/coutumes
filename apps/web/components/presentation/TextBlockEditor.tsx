'use client';

import { cx } from '@/lib';
import { Bold } from 'lucide-react';
import { useRef, useState } from 'react';
import styles from './editor.module.css';
import presentation from './presentation.module.css';
import { RichText } from './RichText';

/** Shows the formatted text; click to edit it as plain text with **gras** markers. */
export const TextBlockEditor: React.FC<{
  text: string;
  autoFocus?: boolean;
  onChange: (text: string) => void;
}> = ({ text, autoFocus = false, onChange }) => {
  const [isEditing, setIsEditing] = useState(text === '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toggleBold = () => {
    const textarea = textareaRef.current;
    if (textarea === null) {
      return;
    }
    const { selectionStart: start, selectionEnd: end } = textarea;
    const selected = text.slice(start, end) || 'texte en gras';
    const next = `${text.slice(0, start)}**${selected}**${text.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2 + selected.length);
    });
  };

  if (!isEditing) {
    return (
      <div
        className={`${presentation.text} ${styles.clickToEdit}`}
        role="button"
        tabIndex={0}
        title="Cliquer pour modifier"
        onClick={() => setIsEditing(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            setIsEditing(true);
          }
        }}
      >
        <RichText text={text} />
      </div>
    );
  }

  return (
    // An empty comment is a prompt, not content: keep it out of the PDF
    <div className={cx(styles.textEditor, text.trim() === '' && styles.noPrint)}>
      <div className={cx(styles.textToolbar, styles.noPrint)}>
        <button
          type="button"
          className={styles.miniButton}
          // Keep the textarea's selection: don't let the button steal focus
          onMouseDown={(event) => event.preventDefault()}
          onClick={toggleBold}
          title="Gras (Ctrl/⌘ + B)"
          aria-label="Gras"
        >
          <Bold size={14} />
        </button>
        <span className={styles.hint}>
          **deux étoiles** autour pour le gras · « - » en début de ligne pour une liste
        </span>
      </div>
      <textarea
        ref={textareaRef}
        className={`${presentation.text} ${styles.textarea}`}
        value={text}
        autoFocus={autoFocus}
        placeholder="Votre commentaire : faits marquants, explications des écarts, actions prévues…"
        rows={Math.max(3, text.split('\n').length + 1)}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
            event.preventDefault();
            toggleBold();
          }
        }}
        onBlur={() => {
          if (text.trim() !== '') {
            setIsEditing(false);
          }
        }}
      />
    </div>
  );
};
