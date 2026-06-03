import { accountLoginUrl, accountLogoutUrl } from '@/lib/urls';
import type { User } from 'next-auth';
import NextAuth from 'next-auth';
import type { AdapterUser } from 'next-auth/adapters';
import Apple from 'next-auth/providers/apple';
import Google from 'next-auth/providers/google';
import { prismaAdapter } from './auth/adapter';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: prismaAdapter,
  // JWT sessions avoid needing a sessions table
  session: { strategy: 'jwt' },
  pages: {
    signIn: accountLoginUrl().toPathname(),
    signOut: accountLogoutUrl().toPathname(),
    // error: authErrorUrl().replace(absoluteUrl('/'), '/'),
    // verifyRequest: authVerifyRequestUrl(),
  },
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
    Apple({
      // Apple requires a JWT signed with your private key as the client secret.
      // Generate it with: https://github.com/auth0/node-apple-signin-auth
      // AUTH_APPLE_ID, AUTH_APPLE_SECRET are picked up automatically by Auth.js
      // when named following the AUTH_<PROVIDER>_ID / AUTH_<PROVIDER>_SECRET convention.
      allowDangerousEmailAccountLinking: true,
    }),
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
