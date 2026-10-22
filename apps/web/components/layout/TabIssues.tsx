import { TriangleAlert } from 'lucide-react';
import styles from './layout.module.css';

/** Warning icon for a sheet tab that couldn't be (fully) read; hovering lists why. */
export const TabWarningIcon: React.FC<{ issues: string[]; size?: number }> = ({
  issues,
  size = 16,
}) => (
  <span className={styles.warningIcon} title={issues.join('\n')} role="img" aria-label="Attention">
    <TriangleAlert size={size} aria-hidden />
  </span>
);

/** The issues of the month being viewed, above its dashboard. */
export const TabIssuesBanner: React.FC<{
  tabName: string;
  issues: string[];
  /** Unusable, rather than read with gaps */
  invalid: boolean;
}> = ({ tabName, issues, invalid }) => (
  <div className={styles.issuesBanner} role="note">
    <TriangleAlert size={18} aria-hidden className={styles.issuesIcon} />
    <div>
      <p className={styles.issuesTitle}>
        L’onglet « {tabName} » {invalid ? 'n’a pas pu être lu' : 'n’a pas pu être lu entièrement'}
      </p>
      <ul className={styles.issuesList}>
        {issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
    </div>
  </div>
);
