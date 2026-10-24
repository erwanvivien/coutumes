import { AppHeader } from '@/components/layout/AppHeader';
import layout from '@/components/layout/layout.module.css';
import { StoreForm } from '@/components/store/StoreForm';
import styles from '@/components/store/store.module.css';
import { sheetUrl } from '@/lib/report/sheetUrl';
import { requireStore } from '@/lib/server/access';
import { serviceAccountEmail } from '@/lib/server/sheets/client';
import { storeSettingsPath } from '@/lib/urls';
import type { Metadata } from 'next';
import { updateStoreSettings } from './actions';

export const metadata: Metadata = { title: 'Ma boutique' };

type Props = { params: Promise<{ slug: string }> };

const StoreSettingsPage: React.FC<Props> = async ({ params }) => {
  const { slug } = await params;
  const { store } = await requireStore(slug, storeSettingsPath(slug));

  return (
    <>
      <AppHeader storeName={store.name} slug={slug} />
      <main className={layout.main}>
        <div className={styles.card}>
          <header className={styles.header}>
            <h1 className={styles.title}>Ma boutique</h1>
            <p className={styles.subtitle}>Le nom et le classeur dont les chiffres sont lus.</p>
          </header>
          <StoreForm
            action={updateStoreSettings.bind(null, slug)}
            isNew={false}
            serviceAccountEmail={serviceAccountEmail()}
            initial={{
              name: store.name,
              sheet: store.sheetId === undefined ? '' : sheetUrl(store.sheetId),
              useDemoData: store.useDemoData,
              vatRatePercent: store.vatRate * 100,
              revenueBasis: store.revenueBasis,
            }}
          />
        </div>
      </main>
    </>
  );
};

export default StoreSettingsPage;
