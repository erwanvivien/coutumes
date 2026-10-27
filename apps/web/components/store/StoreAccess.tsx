'use client';

import layout from '@/components/layout/layout.module.css';
import type { StoreRole } from '@/lib/schemas/database/storeOwner';
import { useActionState, useState } from 'react';
import type { StoreFormState } from './StoreForm';
import styles from './store.module.css';

type Action = (previous: StoreFormState, formData: FormData) => Promise<StoreFormState>;

const noAction: Action = () => Promise.resolve({});

export const roleLabels: Record<StoreRole, string> = {
  admin: 'Administrateur',
  staff: 'Collaborateur',
};

const ErrorMessage: React.FC<{ state: StoreFormState }> = ({ state }) =>
  state.error === undefined ? null : (
    <p className={styles.error} role="alert">
      {state.error}
    </p>
  );

export type MemberRowProps = {
  userId: string;
  name: string;
  email: string;
  role: StoreRole;
  isSuperAdmin: boolean;
  isCurrentUser: boolean;
  /** Set when the viewer may change this member's role. */
  changeRole?: Action;
  /** Set when the viewer may remove this member. */
  remove?: Action;
};

const MemberRow: React.FC<MemberRowProps> = ({
  name,
  email,
  role,
  isSuperAdmin,
  isCurrentUser,
  changeRole,
  remove,
}) => {
  const [roleState, roleAction, isRolePending] = useActionState<StoreFormState, FormData>(
    changeRole ?? noAction,
    {},
  );
  const [removeState, removeAction, isRemovePending] = useActionState<StoreFormState, FormData>(
    remove ?? noAction,
    {},
  );

  return (
    <li className={styles.member}>
      <div className={styles.memberRow}>
        <div className={styles.memberIdentity}>
          <span className={styles.memberName}>
            {name}
            {isCurrentUser && <span className={styles.help}> (vous)</span>}
          </span>
          <span className={styles.memberEmail}>{email}</span>
        </div>
        <div className={styles.memberActions}>
          {changeRole === undefined ? (
            <span className={styles.badge}>{isSuperAdmin ? 'Propriétaire' : roleLabels[role]}</span>
          ) : (
            <form action={roleAction}>
              <select
                name="role"
                defaultValue={role}
                aria-label={`Rôle de ${name}`}
                disabled={isRolePending}
                onChange={(event) => event.currentTarget.form?.requestSubmit()}
                className={styles.inputSmall}
              >
                <option value="staff">{roleLabels.staff}</option>
                <option value="admin">{roleLabels.admin}</option>
              </select>
            </form>
          )}
          {remove !== undefined && (
            <form
              action={removeAction}
              onSubmit={(event) => {
                if (!window.confirm(`Retirer l’accès de ${name} à la boutique ?`)) {
                  event.preventDefault();
                }
              }}
            >
              <button type="submit" className={layout.button} disabled={isRemovePending}>
                Retirer
              </button>
            </form>
          )}
        </div>
      </div>
      <ErrorMessage state={roleState.error !== undefined ? roleState : removeState} />
    </li>
  );
};

export const MemberList: React.FC<{ members: MemberRowProps[] }> = ({ members }) => (
  <ul className={styles.members}>
    {members.map((member) => (
      // Keyed on the role too, so the select shows the saved role again after a refresh
      <MemberRow key={`${member.userId}-${member.role}`} {...member} />
    ))}
  </ul>
);

export const AddMemberForm: React.FC<{ action: Action }> = ({ action }) => {
  // Controlled, so a refused address stays in the field to be corrected
  const [email, setEmail] = useState('');
  const [state, formAction, isPending] = useActionState<StoreFormState, FormData>(
    async (previous, formData) => {
      const next = await action(previous, formData);
      if (next.error === undefined) {
        setEmail('');
      }
      return next;
    },
    {},
  );

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Adresse Google</span>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="prenom.nom@gmail.com"
            required
            className={styles.input}
          />
        </label>
        <label className={styles.fieldNarrow}>
          <span className={styles.label}>Rôle</span>
          <select name="role" defaultValue="staff" className={styles.input}>
            <option value="staff">{roleLabels.staff}</option>
            <option value="admin">{roleLabels.admin}</option>
          </select>
        </label>
      </div>
      <p className={styles.help}>
        La personne se connecte avec son compte Google à cette adresse. Les collaborateurs voient
        les tableaux de bord et préparent les présentations ; les administrateurs gèrent aussi la
        boutique et y ajoutent des collaborateurs.
      </p>
      <ErrorMessage state={state} />
      <div>
        <button type="submit" className={layout.buttonPrimary} disabled={isPending}>
          {isPending ? 'Ajout…' : 'Donner accès'}
        </button>
      </div>
    </form>
  );
};

export const TransferOwnershipForm: React.FC<{
  action: Action;
  candidates: { userId: string; name: string; email: string }[];
}> = ({ action, candidates }) => {
  const [state, formAction, isPending] = useActionState<StoreFormState, FormData>(action, {});
  const [userId, setUserId] = useState('');

  if (candidates.length === 0) {
    return (
      <p className={styles.help}>
        Ajoutez d’abord la personne à qui vous voulez confier la boutique.
      </p>
    );
  }

  const target = candidates.find((candidate) => candidate.userId === userId);

  return (
    <form
      action={formAction}
      className={styles.form}
      onSubmit={(event) => {
        if (
          target === undefined ||
          !window.confirm(
            `Transférer la boutique à ${target.name} ? Vous resterez administrateur, mais ne pourrez plus revenir en arrière vous-même.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <label className={styles.field}>
        <span className={styles.label}>Nouveau propriétaire</span>
        <select
          name="userId"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          required
          className={styles.input}
        >
          <option value="" disabled>
            Choisir une personne
          </option>
          {candidates.map((candidate) => (
            <option key={candidate.userId} value={candidate.userId}>
              {candidate.name} — {candidate.email}
            </option>
          ))}
        </select>
      </label>
      <ErrorMessage state={state} />
      <div>
        <button type="submit" className={layout.button} disabled={isPending || userId === ''}>
          Transférer la propriété
        </button>
      </div>
    </form>
  );
};

export const DeleteStoreForm: React.FC<{ action: Action; storeName: string }> = ({
  action,
  storeName,
}) => {
  const [state, formAction, isPending] = useActionState<StoreFormState, FormData>(action, {});
  const [confirmation, setConfirmation] = useState('');

  return (
    <form action={formAction} className={styles.form}>
      <label className={styles.field}>
        <span className={styles.label}>Tapez « {storeName} » pour confirmer</span>
        <input
          name="confirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="off"
          className={styles.input}
        />
        <span className={styles.help}>
          Les présentations et les liens de partage de la boutique sont supprimés, pour tous ceux
          qui y ont accès. Le Google Sheet, lui, n’est pas touché.
        </span>
      </label>
      <ErrorMessage state={state} />
      <div>
        <button
          type="submit"
          className={layout.button}
          disabled={isPending || confirmation.trim() !== storeName}
        >
          Supprimer la boutique
        </button>
      </div>
    </form>
  );
};
