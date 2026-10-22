# template

npm workspace monorepo:

- `apps/web` — Next.js app (auth, API, database via Prisma). See [apps/web/README.md](apps/web/README.md).
- `packages/shared` — framework-agnostic code (`@template/shared`).

## Getting started

```bash
npm install

npm run web       # start the Next.js app (apps/web)
```

Other useful scripts (see `apps/web/package.json` for the full list):

```bash
npm run lint         # lint the web app
npm run format:fix   # format the web app
```
