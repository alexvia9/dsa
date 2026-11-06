# Dad Savings Account (DSA)

Family teaching app: kids, savings-style accounts, deposits, and simulated growth (piggy bank, a rate like an APY, month-end %, and a history that moves like the S&P 500).

## Local dev

```bash
npm install
cp .env.example .env   # optional: Supabase URL + publishable key
npm run dev
```

Open `http://localhost:5173/` (local dev uses `/`, not `/dsa/`).

## Deploy

Live site: **https://alexvia9.github.io/dsa/**

Pushes to `main` run GitHub Actions (`.github/workflows/deploy.yml`). Set repository secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. In Supabase Auth, add redirect URL `https://alexvia9.github.io/dsa/**`.

## Database

Run `supabase/migrations/001_dsa_family_schema.sql`, then `002_dsa_kids_avatar_color.sql`, then `003_parent_ack_and_delete.sql` in the Supabase SQL editor. Migration 003 stores the parent’s terms acceptance and lets a signed-in parent delete the login and family rows.

Market simulation reads the published SPY close-to-close change from Yahoo Finance and applies that percentage only to pretend balances. It is not a quote and not a data feed. `npm run update-sp500` refreshes the history file, and opening the app reads the latest published change.

**Scale — address before this is widely used.** Yahoo stays for now. Their terms restrict automated collection and redistribution, and the chart endpoint is unofficial, so it can be blocked. Before a larger audience, switch to a daily SPY (or equivalent) source whose terms allow that percentage change to be shown inside this app.
