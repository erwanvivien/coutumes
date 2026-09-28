'use server';

import { auth } from '@/lib/server/auth';
import type { Session, User } from 'next-auth';

export type SessionUser = Omit<User, 'id' | 'email'> & {
  id: string;
  email: string;
};

const getSessionUserFromSession = (session: Session | null): SessionUser | undefined => {
  if (session === null) {
    return undefined;
  }

  if (session.user === undefined) {
    return undefined;
  }

  const { id, email } = session.user;
  if (id === undefined || email === undefined || email === null) {
    return undefined;
  }

  return { id, email, name: session.user.name, image: session.user.image };
};

export const getSessionUser = async (): Promise<SessionUser | undefined> => {
  const session = await auth();
  return getSessionUserFromSession(session);
};
