import { parseInline, parseParagraphs } from '@/lib/report/blocks';
import { Fragment } from 'react';

const Inline: React.FC<{ text: string }> = ({ text }) =>
  parseInline(text).map((segment, index) =>
    segment.bold ? (
      <strong key={index}>{segment.text}</strong>
    ) : (
      <Fragment key={index}>{segment.text}</Fragment>
    ),
  );

/** Renders a text block: **gras** becomes bold, "- " lines become a bulleted list, other line
 * breaks are kept. */
export const RichText: React.FC<{ text: string }> = ({ text }) =>
  parseParagraphs(text).map((paragraph, index, paragraphs) =>
    paragraph.kind === 'list' ? (
      <ul key={index}>
        {paragraph.items.map((item, itemIndex) => (
          <li key={itemIndex}>
            <Inline text={item} />
          </li>
        ))}
      </ul>
    ) : (
      <Fragment key={index}>
        {index > 0 && paragraphs[index - 1].kind === 'line' && <br />}
        <Inline text={paragraph.text} />
      </Fragment>
    ),
  );
