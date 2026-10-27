# Agent instructions

npm workspace monorepo: `apps/web` (Next.js) and `packages/shared` (framework-agnostic code —
shared types, URL helpers).

## What the app does

Anyone signs in with Google and sets up their store (`/boutique`): a name and the Google Sheet
where its monthly figures are typed (one tab per month), or demo data. `apps/web` reads the sheet
read-only with an app-wide service account, recomputes the KPIs, and renders a month dashboard
(`/{year}-{mois}`), a week recap vs S-1 (`/semaine/{lundi}`), a presentation editor for each
(`…/presentation`) and frozen public share links (`/p/{token}`). Postgres holds users, stores and presentations (per store). A store's members are
`staff` or `admin` (`store_owner.role`); only admins edit its settings, manage who has access and
can delete it, and its creator is the `superAdminId` (always an admin, can't be removed, and
can transfer the role).
Everything a page or action reads must be scoped to the caller's store (`requireStore` /
`currentStore` in `lib/server/access.ts`). UI copy is in French.

- `apps/web/lib/report/` — pure domain logic (month slugs, sheet parsing, KPIs, blocks); unit-test
  changes here with vitest.
- `apps/web/lib/server/sheets/` — Google Sheets client and the `demo` data source.
- `apps/web/components/report`, `components/charts` — shared by dashboard, editor and share page.

Keep the report flattering-but-honest: shortfalls use `--shortfall` (warm amber) with an arrow,
never red; red (`--critical`) is for app errors only. Comparisons must be like-for-like (a week in
progress is compared with the same days of S-1).

The look follows coutumes.com (see `apps/web/README.md`, « Look »): use the tokens in
`app/globals.css` (`--brand`, `--font-serif`, `--font-label`, `--font-display`) rather than new
colours or fonts, and keep corners square.

## Shared code

Before writing framework-agnostic logic (types, URL helpers, formatting), check
`packages/shared/src` first — it's imported as `@template/shared`.
