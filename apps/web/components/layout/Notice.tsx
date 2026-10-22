import styles from './layout.module.css';

export const Notice: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className={styles.notice}>
    <h2>{title}</h2>
    {children}
  </div>
);
