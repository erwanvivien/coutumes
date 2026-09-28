import { getSessionUser, type SessionUser } from '@/lib/session';
import type { NextRequest } from 'next/server';
import { verifyMobileToken } from './auth/mobileToken';
import { prismaClient } from './db';

/** Same as getSessionUser, but also accepts the mobile app's `Authorization: Bearer <token>`
 * header as a fallback when there's no browser session cookie. */
export const getSessionUserFromRequest = async (
  request: NextRequest,
): Promise<SessionUser | undefined> => {
  const cookieUser = await getSessionUser();
  if (cookieUser !== undefined) {
    return cookieUser;
  }

  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return undefined;
  }

  const userId = await verifyMobileToken(authorization.slice('Bearer '.length));
  if (userId === undefined) {
    return undefined;
  }

  const user = await prismaClient.user.findUnique({ where: { id: userId } });
  if (user === null) {
    return undefined;
  }

  return { id: user.id, email: user.email, name: user.name, image: user.imageUrl };
};
