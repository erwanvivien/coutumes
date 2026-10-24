'use client';

import layout from '@/components/layout/layout.module.css';
import { Check, Copy } from 'lucide-react';
import { useActionState, useState } from 'react';
import styles from './store.module.css';

export type StoreFormState = { error?: string };

export const StoreForm: React.FC<{
  action: (previous: StoreFormState, formData: FormData) => Promise<StoreFormState>;
  initial: {
    name: string;
    sheet: string;
    useDemoData: boolean;
    vatRatePercent: number;
    revenueBasis: 'ht' | 'ttc';
  };
  serviceAccountEmail?: string;
  isNew: boolean;
}> = ({ action, initial, serviceAccountEmail, isNew }) => {
  const [state, formAction, isPending] = useActionState<StoreFormState, FormData>(action, {});
  // Controlled: React resets uncontrolled fields after a form action, which would wipe what
  // the user typed whenever we answer with an error
  const [name, setName] = useState(initial.name);
  const [sheet, setSheet] = useState(initial.sheet);
  const [useDemoData, setUseDemoData] = useState(initial.useDemoData);
  const [revenueBasis, setRevenueBasis] = useState(initial.revenueBasis);
  const [vatRatePercent, setVatRatePercent] = useState(initial.vatRatePercent);
  const [copied, setCopied] = useState(false);

  const submitLabel = isNew ? 'Créer ma boutique' : 'Enregistrer';

  const copyEmail = async () => {
    if (serviceAccountEmail === undefined) {
      return;
    }
    await navigator.clipboard.writeText(serviceAccountEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <form action={formAction} className={styles.form}>
      <label className={styles.field}>
        <span className={styles.label}>Nom de la boutique</span>
        <input
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Boutique Lyon Part-Dieu"
          required
          maxLength={80}
          className={styles.input}
        />
        <span className={styles.help}>
          Affiché en haut du tableau de bord et des présentations.
        </span>
      </label>

      <fieldset className={styles.field} disabled={useDemoData}>
        <span className={styles.label}>Google Sheet</span>
        <input
          name="sheet"
          value={sheet}
          onChange={(event) => setSheet(event.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/…/edit"
          className={styles.input}
        />
        {serviceAccountEmail !== undefined ? (
          <div className={styles.share}>
            <p>
              Dans le classeur, cliquez sur <strong>Partager</strong> et ajoutez cette adresse en{' '}
              <strong>Lecteur</strong> :
            </p>
            <div className={styles.shareRow}>
              <code className={styles.email}>{serviceAccountEmail}</code>
              <button type="button" className={layout.button} onClick={() => void copyEmail()}>
                {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
            <p className={styles.help}>
              Un onglet par mois (« Novembre », « Janvier 27 »…), avec une ligne « Date », « Réalisé
              », « Objectif », « Tickets », « Quantités », « Passages ».
            </p>
          </div>
        ) : (
          <p className={styles.help}>
            La lecture des Google Sheets n’est pas encore configurée sur ce serveur.
          </p>
        )}
      </fieldset>

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          name="useDemoData"
          checked={useDemoData}
          onChange={(event) => setUseDemoData(event.target.checked)}
        />
        <span>
          Utiliser des données de démonstration
          <span className={styles.help}> — pour découvrir l’outil avant de relier le classeur</span>
        </span>
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Chiffres saisis dans le classeur</span>
          <select
            name="revenueBasis"
            value={revenueBasis}
            onChange={(event) => setRevenueBasis(event.target.value as 'ht' | 'ttc')}
            className={styles.input}
          >
            <option value="ht">HT (hors taxe)</option>
            <option value="ttc">TTC (toutes taxes comprises)</option>
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Taux de TVA</span>
          <input
            type="number"
            name="vatRate"
            value={vatRatePercent}
            onChange={(event) => setVatRatePercent(Number(event.target.value))}
            min={0}
            max={100}
            step={0.1}
            disabled={revenueBasis === 'ht'}
            className={styles.input}
          />
          <span className={styles.help}>
            {revenueBasis === 'ttc'
              ? 'Utilisé pour ramener les chiffres en HT partout dans le tableau de bord.'
              : 'Utile seulement si vous passez un jour en TTC.'}
          </span>
        </label>
      </div>

      {state.error !== undefined && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}

      <div>
        <button type="submit" className={layout.buttonPrimary} disabled={isPending}>
          {isPending ? 'Vérification du classeur…' : submitLabel}
        </button>
      </div>
    </form>
  );
};
