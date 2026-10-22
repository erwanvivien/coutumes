# Suivi des ventes — web

Turns a store's monthly Google Sheet into a dashboard and a presentation for management.
Numbers are still typed **in the Google Sheet**; this app only reads it.

Anyone can sign in with Google. On first sign-in they set up **their store** at `/boutique`: a
name, and the link of their Google Sheet (or the built-in demo data). Each user has one store,
and sees only its figures and presentations.

| Route                         | Who            | What                                                                       |
| ----------------------------- | -------------- | -------------------------------------------------------------------------- |
| `/`                           | signed in      | One card per month tab of their store's sheet                              |
| `/boutique`                   | signed in      | Store setup / settings: name, Google Sheet link, demo data                 |
| `/2026-novembre`              | signed in      | KPIs (CA, écart, atterrissage, PM, IV, TT), charts, weekly and daily table |
| `/2026-novembre/presentation` | signed in      | Report editor: titles, comments (**gras**), charts, tables → PDF / link    |
| `/p/{token}`                  | anyone w/ link | The published presentation, frozen at publish time                         |

## Getting started

```bash
cp .env.example .env      # then fill it in, see below
docker compose up -d      # Postgres on :533 (users, stores, presentations)
npx prisma migrate deploy
npm run dev
```

To try it without a service account, tick **Utiliser des données de démonstration** on `/boutique`:
the app generates a few months of plausible figures laid out exactly like a real sheet.

## Configuration

### Sign-in

Google OAuth (`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`) — see `.env.example`. Anyone with a Google
account can sign in and create their store.

### Reading the Google Sheets

The app reads every store's sheet with one **service account** (a robot Google account),
read-only. Store owners share their sheet with its email; `/boutique` shows it to them and checks
access when they save.

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project (or reuse the
   OAuth one) and enable the **Google Sheets API**.
2. _IAM & Admin → Service Accounts_ → create one → _Keys → Add key → JSON_. Download it.
3. Fill in:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` — `client_email` from the JSON
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` — `private_key` from the JSON, on one line with `\n`

A sheet can be linked to **one store only**: someone who learns another store's sheet id can't
attach it to read its figures. Sheets are cached for 5 minutes per store; **Rafraîchir** re-reads
immediately.

## What the sheet must look like

One tab per month, named after the month: `Novembre`, `Décembre`, `Janvier 27`, `Mars 2027`,
`Sept`… Tabs without a year take it from their neighbours (tabs are read in order, and the year
rolls over when the month goes back down); if no tab names a year, `GOOGLE_SHEET_DEFAULT_YEAR`
(or the current year) is used. Other tabs (`Récap`…) are ignored.

In each month tab:

- **`Objectif HT`** followed by the month's objective, anywhere above the table (optional — the
  daily objectives are summed otherwise).
- A header row starting with **`Date`**, then the columns, until the first empty header:
  - `Réalisé` (CA HT), `Objectif`, `Tickets`, `Quantités`, `Passages` are understood by name;
  - `IV`, `PM`, `TT`, `Diff +/-` are **recomputed** by the app (so unfilled days show — rather
    than `#DIV/0!`), whatever the sheet's formulas say;
  - any other column (e.g. `Retours`) is shown as-is in the daily table.
- One row per day (`lundi 2 novembre`, `02/11`, or `2`), until a `Total` row or an empty date.

The weekly summary block to the right of the table is ignored: weeks are recomputed (Monday →
Sunday).

## Presentations

Each month has one presentation, created with a default layout (one theme per printed page,
with a comment slot under each chart). Blocks can be added, reordered and deleted; edits autosave.

- **Exporter en PDF** opens the browser's print dialog, laid out for A4 landscape —
  choose _Enregistrer au format PDF_. Empty comments are left out.
- **Publier un lien** re-reads the sheet and freezes the figures and blocks behind an
  unguessable link. Later sheet edits don't change it until you **Republier**;
  **Désactiver le lien** turns it off.

## Development

```bash
npm run validate   # prettier, tsc, eslint, vitest
npm test           # vitest only
```

The parsing and KPI logic (`lib/report/`) is pure and unit-tested; `lib/server/sheets/` talks to
Google; `components/report` and `components/charts` are shared by the dashboard, the editor and
the share page.
