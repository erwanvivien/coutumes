import styles from './charts.module.css';

/** Floating readout pinned to an x position (in px within the chart). Flips to the left of the
 * pointer on the right half so it never leaves the chart. */
export const Tooltip: React.FC<{
  x: number;
  width: number;
  title: string;
  children: React.ReactNode;
}> = ({ x, width, title, children }) => {
  const flip = x > width / 2;
  return (
    <div
      className={styles.tooltip}
      role="status"
      style={flip ? { right: width - x + 12 } : { left: x + 12 }}
    >
      <p className={styles.tooltipTitle}>{title}</p>
      {children}
    </div>
  );
};

export type Series = 'revenue' | 'objective' | 'previous';

export const TooltipRow: React.FC<{
  label: string;
  value: React.ReactNode;
  swatch?: Series;
}> = ({ label, value, swatch }) => (
  <p className={styles.tooltipRow}>
    {swatch !== undefined && <span className={styles.lineKey} data-series={swatch} aria-hidden />}
    <strong className={styles.tooltipValue}>{value}</strong>
    <span className={styles.tooltipLabel}>{label}</span>
  </p>
);

export const Legend: React.FC<{
  items: { label: string; series: Series; shape: 'rect' | 'line' }[];
}> = ({ items }) => (
  <ul className={styles.legend}>
    {items.map((item) => (
      <li key={item.label}>
        <span
          className={item.shape === 'rect' ? styles.rectKey : styles.lineKey}
          data-series={item.series}
          aria-hidden
        />
        {item.label}
      </li>
    ))}
  </ul>
);
