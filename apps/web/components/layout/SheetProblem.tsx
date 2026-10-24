import type { LoadedReports } from '@/lib/server/loadReports';
import { serviceAccountEmail } from '@/lib/server/sheets/client';
import { storeSettingsPath } from '@/lib/urls';
import Link from 'next/link';
import styles from './layout.module.css';
import { Notice } from './Notice';

/** Explains why there's nothing to show yet: no sheet linked, no access, or an unreadable sheet. */
export const SheetProblem: React.FC<{
  loaded: Exclude<LoadedReports, { kind: 'ok' }>;
  slug: string;
}> = ({ loaded, slug }) => {
  switch (loaded.kind) {
    case 'not-configured':
      return (
        <Notice title="Aucun Google Sheet relié">
          <p>Reliez le classeur où sont saisis les chiffres de la boutique.</p>
          <p>
            <Link href={storeSettingsPath(slug)} className={styles.buttonPrimary}>
              Relier un Google Sheet
            </Link>
          </p>
        </Notice>
      );
    case 'no-access':
      return (
        <Notice title="Le Google Sheet n’est pas accessible">
          <p>
            Partagez le classeur (accès <strong>Lecteur</strong>) avec{' '}
            <code>{serviceAccountEmail() ?? 'le compte de service de l’application'}</code>, puis
            cliquez sur « Rafraîchir ».
          </p>
          <p>
            <Link href={storeSettingsPath(slug)}>Vérifier le lien du classeur</Link>
          </p>
        </Notice>
      );
    case 'error':
      return (
        <Notice title="Impossible de lire le Google Sheet">
          <p>Réessayez dans un instant avec « Rafraîchir ».</p>
          <p>
            <code>{loaded.message}</code>
          </p>
        </Notice>
      );
  }
};
