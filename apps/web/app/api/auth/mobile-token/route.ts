import { getSessionUser } from '@/lib/session';
import { mintMobileToken } from '@/lib/server/auth/mobileToken';
import { accountLoginUrl } from '@/lib/urls';
import { NextResponse, type NextRequest } from 'next/server';

// Matches apps/mobile's app.config.js "scheme" — expo-web-browser's openAuthSessionAsync
// watches for a redirect to this scheme to close the in-app browser.
const MOBILE_AUTH_SCHEME = 'template';

// Opened by the mobile app inside an in-app browser (see apps/mobile/src/lib/auth.ts). If there's
// no session yet, it bounces through the normal login page — which redirects back here once
// sign-in completes — then mints a long-lived bearer token and hands it to the app via the
// custom URL scheme.
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const requestUrl = new URL(request.url);

  const sessionUser = await getSessionUser();
  if (sessionUser === undefined) {
    const loginUrl = new URL(accountLoginUrl());
    loginUrl.searchParams.set('redirectTo', requestUrl.pathname + requestUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  const token = await mintMobileToken(sessionUser.id);
  const redirectUrl = new URL(`${MOBILE_AUTH_SCHEME}://auth`);
  redirectUrl.searchParams.set('token', token);
  return NextResponse.redirect(redirectUrl);
};
