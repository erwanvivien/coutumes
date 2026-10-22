import { cx } from '@/lib';
import { EMPTY } from '@/lib/report/format';
import styles from './report.module.css';

/** A signed figure whose colour says good/bad — always with an arrow, so it's never colour alone. */
export const Delta: React.FC<{
  value: number | undefined;
  format: (value: number) => string;
  className?: string;
}> = ({ value, format, className }) => {
  if (value === undefined || !Number.isFinite(value)) {
    return <span className={cx(styles.delta, className)}>{EMPTY}</span>;
  }

  const isUp = value >= 0;
  return (
    <span className={cx(styles.delta, isUp ? styles.deltaUp : styles.deltaDown, className)}>
      <span aria-hidden>{isUp ? '▲' : '▼'}</span>
      <span className="tabular">{format(value)}</span>
    </span>
  );
};
