import { AppHeader } from '@/components/layout/AppHeader';
import layout from '@/components/layout/layout.module.css';
import { sheetUrl } from '@/lib/report/sheetUrl';
import { requireUser } from '@/lib/server/access';
import { serviceAccountEmail } from '@/lib/server/sheets/client';
import { getStoreByOwner } from '@/lib/server/stores';
import { storeSettingsPath } from '@/lib/urls';
import type { Metadata } from 'next';
import styles from './page.module.css';
import { StoreForm } from './StoreForm';

export const metadata: Metadata = { title: 'Ma boutique' };

const StoreSettingsPage: React.FC = async () => {
  const user = await requireUser(storeSettingsPath());
  const store = await getStoreByOwner(user.id);

  return (
    <>
      <AppHeader storeName={store?.name ?? 'Suivi des ventes'} />
      <main className={layout.main}>
        <div className={styles.card}>
          <header className={styles.header}>
            <h1 className={styles.title}>{store === undefined ? 'Bienvenue' : 'Ma boutique'}</h1>
            <p className={styles.subtitle}>
              {store === undefined
                ? 'Reliez le Google Sheet où vous saisissez vos chiffres : le tableau de bord et les présentations se construisent à partir de lui.'
                : 'Le nom et le classeur dont les chiffres sont lus.'}
            </p>
          </header>
          <StoreForm
            isNew={store === undefined}
            serviceAccountEmail={serviceAccountEmail()}
            initial={{
              name: store?.name ?? '',
              sheet: store?.sheetId === undefined ? '' : sheetUrl(store.sheetId),
              useDemoData: store?.useDemoData ?? false,
            }}
          />
        </div>
      </main>
    </>
  );
};

export default StoreSettingsPage;
