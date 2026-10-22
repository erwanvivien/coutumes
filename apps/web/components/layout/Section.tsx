import styles from './layout.module.css';

export const Section: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
  card?: boolean;
}> = ({ title, description, children, card = false }) => (
  <section className={styles.section}>
    <div className={styles.sectionHead}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {description !== undefined && <p className={styles.sectionDescription}>{description}</p>}
    </div>
    {card ? <div className={styles.card}>{children}</div> : children}
  </section>
);
