# @template/mobile

Expo Router app that authenticates against `apps/web`'s existing NextAuth session.

## Get started

From the repo root:

```bash
npm install
npm run mobile
```

Or from this directory: `npx expo start`.

Make sure `apps/web` is running (`npm run web` from the repo root) and that
`EXPO_PUBLIC_WEBSITE_URL` in `.env` points at it (defaults to `http://localhost:3000`).

## How sign-in works

1. `src/lib/auth.ts`'s `signIn()` opens `${EXPO_PUBLIC_WEBSITE_URL}/api/auth/mobile-token` in an
   in-app browser.
2. That endpoint (in `apps/web`) reuses the web app's cookie session, or bounces through the
   normal login page first, then mints a long-lived bearer token and redirects to
   `template://auth?token=…`.
3. `src/app/auth.tsx` stores the token (via `expo-secure-store`) and returns to the home screen.
4. Subsequent API calls (`src/lib/auth.ts`'s `fetchCurrentUser()`) send
   `Authorization: Bearer <token>` — see `apps/web/lib/server/session.ts`'s
   `getSessionUserFromRequest` for the server side of that.

## Release tooling

`fastlane/` has genericized Android/iOS release lanes (see `fastlane/README.md`) — you'll need
to fill in `fastlane/.env` (copy from `fastlane/.env.example`) with your own Play Console /
App Store Connect credentials before they'll do anything. `android/` and `ios/` aren't
committed; the lanes generate them on demand via `expo prebuild`.

## Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow Expo's guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- Learn more about the TypeScript setup in this template in Expo's guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)
