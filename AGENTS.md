# Agent instructions

npm workspace monorepo: `apps/web` (Next.js), `apps/mobile` (Expo/React Native), `packages/shared`
(code both apps need — shared types, URL helpers).

The mobile app authenticates against the web app: it opens `apps/web`'s
`/api/auth/mobile-token` endpoint in an in-app browser, which reuses the web app's existing
NextAuth session (or bounces through login) and redirects back to the mobile app's custom URL
scheme with a long-lived bearer token. The mobile app stores that token and sends it as
`Authorization: Bearer <token>` on subsequent API calls (see `apps/web/lib/server/session.ts`'s
`getSessionUserFromRequest` and `apps/mobile/src/lib/auth.ts`).

## Shared code

Before writing framework-agnostic logic (types, URL helpers, formatting) used by both apps,
check `packages/shared/src` first — it's imported by both as `@template/shared`. If the same
logic ends up duplicated in `apps/web` and `apps/mobile`, move it there instead.
