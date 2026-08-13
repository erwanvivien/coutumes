import { accountLoginUrl, accountLogoutUrl } from '@/lib/urls';
import type { User } from 'next-auth';
import NextAuth from 'next-auth';
import type { AdapterUser } from 'next-auth/adapters';
import Apple from 'next-auth/providers/apple';
import Google from 'next-auth/providers/google';
import { assertDefined, toPathname } from '..';
import { prismaAdapter } from './auth/adapter';

const AUTH_APPLE_ID = process.env.AUTH_APPLE_ID || undefined;
const AUTH_GOOGLE_ID = process.env.AUTH_GOOGLE_ID || undefined;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: prismaAdapter,
  // JWT sessions avoid needing a sessions table
  session: { strategy: 'jwt' },
  pages: {
    signIn: toPathname(accountLoginUrl()),
    signOut: toPathname(accountLogoutUrl()),
    // error: authErrorUrl().replace(absoluteUrl('/'), '/'),
    // verifyRequest: authVerifyRequestUrl(),
  },
  cookies: localhostCookieOption(),
  providers: [
    ...(AUTH_GOOGLE_ID !== undefined
      ? [
          Google({
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(AUTH_APPLE_ID !== undefined
      ? [
          Apple({
            // Apple requires a JWT signed with your private key as the client secret.
            // Generate it with: https://github.com/auth0/node-apple-signin-auth
            // AUTH_APPLE_ID, AUTH_APPLE_SECRET are picked up automatically by Auth.js
            // when named following the AUTH_<PROVIDER>_ID / AUTH_<PROVIDER>_SECRET convention.
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    // Persist the user id into the JWT so we can read it server-side via auth()
    jwt({ token, user }) {
      const optionalUser = user as User | AdapterUser | undefined;
      if (optionalUser?.id !== undefined) {
        token['userId'] = optionalUser.id;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token['userId'] === 'string') {
        session.user.id = token['userId'];
      }
      return session;
    },
  },
});

function localhostCookieOption() {
  assertDefined(undefined, 'cookie prefix is missing');
  const cookiePrefix = 'SOMETHING.';

  return process.env.NODE_ENV !== 'production'
    ? {
        sessionToken: {
          name: `${cookiePrefix}__Secure-next-auth.session-token`,
        },
        callbackUrl: { name: `${cookiePrefix}__Secure-next-auth.callback-url` },
        csrfToken: { name: `${cookiePrefix}__Host-next-auth.csrf-token` },
        pkceCodeVerifier: {
          name: `${cookiePrefix}next-auth.pkce.code_verifier`,
        },
        state: { name: `${cookiePrefix}next-auth.state` },
        nonce: { name: `${cookiePrefix}next-auth.nonce` },
      }
    : undefined;
}
