import { AppHeader } from '@/components/layout/AppHeader';
import layout from '@/components/layout/layout.module.css';
import { StoreForm } from '@/components/store/StoreForm';
import styles from '@/components/store/store.module.css';
import { requireUser } from '@/lib/server/access';
import { serviceAccountEmail } from '@/lib/server/sheets/client';
import { newStorePath } from '@/lib/urls';
import type { Metadata } from 'next';
import { createStoreSettings } from './actions';

export const metadata: Metadata = { title: 'Nouvelle boutique' };

const NewStorePage: React.FC = async () => {
  await requireUser(newStorePath());

  return (
    <>
      <AppHeader storeName="Nouvelle boutique" />
      <main className={layout.main}>
        <div className={styles.card}>
          <header className={styles.header}>
            <h1 className={styles.title}>Nouvelle boutique</h1>
            <p className={styles.subtitle}>
              Reliez le Google Sheet où vous saisissez vos chiffres : le tableau de bord et les
              présentations se construisent à partir de lui.
            </p>
          </header>
          <StoreForm
            action={createStoreSettings}
            isNew
            serviceAccountEmail={serviceAccountEmail()}
            initial={{
              name: '',
              sheet: '',
              useDemoData: false,
              vatRatePercent: 20,
              revenueBasis: 'ht',
            }}
          />
        </div>
      </main>
    </>
  );
};

export default NewStorePage;
