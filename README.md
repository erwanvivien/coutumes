# template

npm workspace monorepo:

- `apps/web` — Next.js app (auth, API, database via Prisma). See [apps/web/README.md](apps/web/README.md).
- `apps/mobile` — Expo/React Native app that signs in against `apps/web`'s auth. See [apps/mobile/README.md](apps/mobile/README.md).
- `packages/shared` — code shared by both apps (`@template/shared`).

## Getting started

```bash
npm install

npm run web       # start the Next.js app (apps/web)
npm run mobile    # start the Expo dev server (apps/mobile)
```

Other useful scripts (see each app's `package.json` for the full list):

```bash
npm run lint         # lint both apps
npm run format:fix   # format both apps
```
