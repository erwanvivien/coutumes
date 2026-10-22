import type { LoadedReports } from '@/lib/server/loadReports';
import { Notice } from './Notice';

/** Explains why there's nothing to show yet: missing configuration or an unreadable sheet. */
export const SheetProblem: React.FC<{ loaded: Exclude<LoadedReports, { kind: 'ok' }> }> = ({
  loaded,
}) =>
  loaded.kind === 'not-configured' ? (
    <Notice title="Google Sheet non configuré">
      <p>Pour afficher les chiffres, renseignez dans l’environnement du serveur :</p>
      <ol>
        <li>
          <code>GOOGLE_SHEET_ID</code> — l’identifiant dans l’URL du classeur
        </li>
        <li>
          <code>GOOGLE_SERVICE_ACCOUNT_EMAIL</code> et{' '}
          <code>GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</code> — un compte de service Google ayant accès
          en lecture au classeur
        </li>
      </ol>
      <p>
        Pour essayer sans Google, mettez <code>GOOGLE_SHEET_ID=&quot;demo&quot;</code>.
      </p>
    </Notice>
  ) : (
    <Notice title="Impossible de lire le Google Sheet">
      <p>
        Vérifiez que le classeur est bien partagé (lecteur) avec l’email du compte de service, puis
        cliquez sur « Rafraîchir ».
      </p>
      <p>
        <code>{loaded.message}</code>
      </p>
    </Notice>
  );
