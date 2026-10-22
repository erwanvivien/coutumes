# Suivi des ventes

A store's daily sales report, made presentable: each store keeps its figures in its own Google
Sheet, and this app turns each month into a dashboard and a PDF / shareable presentation for
management. Anyone can sign in and set up their store.

npm workspace monorepo:

- `apps/web` — Next.js app (auth, Google Sheets reader, dashboard, presentations; Postgres via
  Prisma). **Setup and sheet format: [apps/web/README.md](apps/web/README.md).**
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
