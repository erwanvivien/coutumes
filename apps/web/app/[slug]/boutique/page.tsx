import { AppHeader } from '@/components/layout/AppHeader';
import layout from '@/components/layout/layout.module.css';
import {
  AddMemberForm,
  DeleteStoreForm,
  MemberList,
  TransferOwnershipForm,
} from '@/components/store/StoreAccess';
import { StoreForm } from '@/components/store/StoreForm';
import styles from '@/components/store/store.module.css';
import { sheetUrl } from '@/lib/report/sheetUrl';
import { requireStore } from '@/lib/server/access';
import { listMembers } from '@/lib/server/members';
import { serviceAccountEmail } from '@/lib/server/sheets/client';
import type { SessionUser } from '@/lib/session';
import { canDeleteStore, memberPermissions } from '@/lib/storeRoles';
import { storeSettingsPath } from '@/lib/urls';
import type { Metadata } from 'next';
import {
  addStoreMember,
  changeStoreMemberRole,
  deleteStoreAction,
  removeStoreMember,
  transferStoreOwnership,
  updateStoreSettings,
} from './actions';

export const metadata: Metadata = { title: 'Ma boutique' };

type Props = { params: Promise<{ slug: string }> };

const StoreSettingsPage: React.FC<Props> = async ({ params }) => {
  const { slug } = await params;
  const { user, store, role } = await requireStore(slug, storeSettingsPath(slug));
  const members = await listMembers(store.id);
  const isAdmin = role === 'admin';
  const isSuperAdmin = store.superAdminId === user.id;
  const viewer = { userId: user.id, role, isSuperAdmin };

  return (
    <>
      <AppHeader storeName={store.name} slug={slug} />
      <main className={layout.main}>
        <div className={styles.card}>
          <header className={styles.header}>
            <h1 className={styles.title}>Ma boutique</h1>
            <p className={styles.subtitle}>
              {isAdmin
                ? 'Le nom et le classeur dont les chiffres sont lus.'
                : 'Seuls les administrateurs de la boutique peuvent modifier ses réglages.'}
            </p>
          </header>
          {isAdmin && (
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
          )}
        </div>
        <div className={styles.card}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Qui a accès</h2>
            <MemberList
              members={members.map((member) => {
                const { canChangeRole, canRemove } = memberPermissions(viewer, member);
                return {
                  userId: member.userId,
                  name: member.name,
                  email: member.email,
                  role: member.role,
                  isSuperAdmin: member.isSuperAdmin,
                  isCurrentUser: member.userId === user.id,
                  changeRole: canChangeRole
                    ? changeStoreMemberRole.bind(null, slug, member.userId)
                    : undefined,
                  remove: canRemove ? removeStoreMember.bind(null, slug, member.userId) : undefined,
                };
              })}
            />
            {isAdmin && <AddMemberForm action={addStoreMember.bind(null, slug)} />}
          </section>

          {isSuperAdmin && <Transfer user={user} members={members} slug={slug} />}

          {canDeleteStore(viewer) && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Supprimer la boutique</h2>
              <DeleteStoreForm action={deleteStoreAction.bind(null, slug)} storeName={store.name} />
            </section>
          )}
        </div>
      </main>
    </>
  );
};

type TransferProps = {
  user: SessionUser;
  members: Array<{
    userId: string;
    name: string;
    email: string;
  }>;
  slug: string;
};

const Transfer: React.FC<TransferProps> = ({ user, members, slug }) => {
  const others = members.filter((member) => member.userId !== user.id);
  if (others.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Transférer la propriété</h2>
      <p className={styles.help}>
        Vous êtes le propriétaire de cette boutique : personne ne peut vous retirer. Vous pouvez
        confier ce rôle à une autre personne qui y a déjà accès.
      </p>
      <TransferOwnershipForm
        action={transferStoreOwnership.bind(null, slug)}
        candidates={others.map(({ userId, name, email }) => ({ userId, name, email }))}
      />
    </section>
  );
};

export default StoreSettingsPage;
