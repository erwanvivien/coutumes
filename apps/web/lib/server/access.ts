import { getSessionUser, type SessionUser } from '@/lib/session';
import { accountLoginUrl } from '@/lib/urls';
import { redirect } from 'next/navigation';
import { isAllowedEmail } from './auth/allowlist';

/** For pages behind login: sends anonymous visitors to the login page (and back here afterwards). */
export const requireEditor = async (returnTo: `/${string}`): Promise<SessionUser> => {
  const sessionUser = await getSessionUser();
  if (sessionUser === undefined || !isAllowedEmail(sessionUser.email)) {
    redirect(`${accountLoginUrl()}?redirectTo=${encodeURIComponent(returnTo)}`);
  }
  return sessionUser;
};
