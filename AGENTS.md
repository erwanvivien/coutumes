# Agent instructions

npm workspace monorepo: `apps/web` (Next.js) and `packages/shared` (framework-agnostic code —
shared types, URL helpers).

## What the app does

Anyone signs in with Google and sets up their store (`/boutique`): a name and the Google Sheet
where its monthly figures are typed (one tab per month), or demo data. `apps/web` reads the sheet
read-only with an app-wide service account, recomputes the KPIs, and renders a dashboard
(`/{year}-{mois}`), a presentation editor (`/{year}-{mois}/presentation`) and frozen public share
links (`/p/{token}`). Postgres holds users, stores (one per user) and presentations (per store).
Everything a page or action reads must be scoped to the caller's store (`requireStore` /
`currentStore` in `lib/server/access.ts`). UI copy is in French.

- `apps/web/lib/report/` — pure domain logic (month slugs, sheet parsing, KPIs, blocks); unit-test
  changes here with vitest.
- `apps/web/lib/server/sheets/` — Google Sheets client and the `demo` data source.
- `apps/web/components/report`, `components/charts` — shared by dashboard, editor and share page.

Keep the report flattering-but-honest: shortfalls use `--shortfall` (warm amber) with an arrow,
never red; red (`--critical`) is for app errors only.

## Shared code

Before writing framework-agnostic logic (types, URL helpers, formatting), check
`packages/shared/src` first — it's imported as `@template/shared`.
