import { AppHeader } from '@/components/layout/AppHeader';
import layout from '@/components/layout/layout.module.css';
import { cx } from '@/lib';
import { requireUser } from '@/lib/server/access';
import { getStoresByOwner } from '@/lib/server/stores';
import { homePath, newStorePath, storePath, storeSettingsPath } from '@/lib/urls';
import { Plus, Settings } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Mes boutiques' };

const HomePage: React.FC = async () => {
  const user = await requireUser(homePath());
  const stores = await getStoresByOwner(user.id);

  if (stores.length === 0) {
    redirect(newStorePath());
  }

  return (
    <>
      <AppHeader storeName="Mes boutiques" />
      <main className={layout.main}>
        <section className={layout.section}>
          <div className={layout.sectionHead}>
            <h1 className={layout.sectionTitle}>Mes boutiques</h1>
            <p className={layout.sectionDescription}>Choisissez une boutique, ou créez-en une</p>
          </div>
          <ul className={styles.grid}>
            {stores.map((store) => (
              <li key={store.id} className={styles.cardWrap}>
                <Link href={storePath(store.slug)} className={styles.card}>
                  <span className={styles.cardHead}>
                    <span className={styles.cardTitle}>{store.name}</span>
                  </span>
                  <span className={styles.cardFoot}>
                    {store.useDemoData ? 'Données de démonstration' : 'Google Sheet relié'}
                  </span>
                </Link>
                <Link
                  href={storeSettingsPath(store.slug)}
                  className={cx(layout.iconButton, styles.cardSettings)}
                  aria-label={`Paramètres de ${store.name}`}
                  title="Paramètres"
                >
                  <Settings size={16} />
                </Link>
              </li>
            ))}
            <li>
              <Link href={newStorePath()} className={styles.addCard}>
                <Plus size={18} aria-hidden />
                Nouvelle boutique
              </Link>
            </li>
          </ul>
        </section>
      </main>
    </>
  );
};

export default HomePage;
