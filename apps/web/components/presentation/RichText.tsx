import { parseInline } from '@/lib/report/blocks';
import { Fragment } from 'react';

/** Renders a text block: **gras** becomes bold, line breaks are kept. */
export const RichText: React.FC<{ text: string }> = ({ text }) =>
  text.split('\n').map((line, lineIndex) => (
    <Fragment key={lineIndex}>
      {lineIndex > 0 && <br />}
      {parseInline(line).map((segment, index) =>
        segment.bold ? (
          <strong key={index}>{segment.text}</strong>
        ) : (
          <Fragment key={index}>{segment.text}</Fragment>
        ),
      )}
    </Fragment>
  ));
