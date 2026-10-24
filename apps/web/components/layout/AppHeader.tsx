import { accountLogoutUrl, homePath, storePath } from '@/lib/urls';
import { ChevronLeft, ChevronRight, LogOut, Store } from 'lucide-react';
import Link from 'next/link';
import styles from './layout.module.css';

type NavLink = { href: string; label: string };

/** The period a page shows, with links to the one before and after (when the sheet has them). */
export type PeriodNav = {
  title: string;
  /** "Changer de mois", "Changer de semaine" */
  label: string;
  previous?: NavLink;
  next?: NavLink;
};

const Arrow: React.FC<{ link?: NavLink; children: React.ReactNode }> = ({ link, children }) =>
  link === undefined ? (
    <span className={styles.iconButton} aria-hidden data-disabled>
      {children}
    </span>
  ) : (
    <Link href={link.href} className={styles.iconButton} aria-label={link.label} title={link.label}>
      {children}
    </Link>
  );

/** Top bar of the signed-in pages: store name, period switcher and page actions. Pass `slug`
 * when a store is open, so the brand links to it and an icon offers switching shops. */
export const AppHeader: React.FC<{
  storeName: string;
  slug?: string;
  nav?: PeriodNav;
  actions?: React.ReactNode;
}> = ({ storeName, slug, nav, actions }) => (
  <header className={styles.header}>
    <div className={styles.headerInner}>
      <Link href={slug === undefined ? homePath() : storePath(slug)} className={styles.brand}>
        {storeName}
      </Link>

      {nav === undefined ? (
        <span />
      ) : (
        <nav className={styles.monthNav} aria-label={nav.label}>
          <Arrow link={nav.previous}>
            <ChevronLeft size={18} />
          </Arrow>
          <h1 className={styles.monthTitle}>{nav.title}</h1>
          <Arrow link={nav.next}>
            <ChevronRight size={18} />
          </Arrow>
        </nav>
      )}

      <div className={styles.actions}>
        {actions}
        {slug !== undefined && (
          <Link
            href={homePath()}
            className={styles.iconButton}
            aria-label="Mes boutiques"
            title="Mes boutiques"
          >
            <Store size={18} />
          </Link>
        )}
        <Link
          href={accountLogoutUrl()}
          className={styles.iconButton}
          aria-label="Se déconnecter"
          title="Se déconnecter"
        >
          <LogOut size={18} />
        </Link>
      </div>
    </div>
  </header>
);
