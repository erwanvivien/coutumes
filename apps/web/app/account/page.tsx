import { getSessionUser } from '@/lib/session';
import { accountLoginUrl, accountLogoutUrl } from '@/lib/urls';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const AccountPage: React.FC = async () => {
  const sessionUser = await getSessionUser();
  if (sessionUser === undefined) {
    redirect(accountLoginUrl());
  }

  return (
    <div>
      <pre>{JSON.stringify(sessionUser, null, 2)}</pre>
      <Link href={accountLogoutUrl()}></Link>
    </div>
  );
};

export default AccountPage;
