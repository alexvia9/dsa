# Dad Savings Account (DSA)

Family teaching app: kids, savings accounts, deposits, and simulated growth (piggy bank, APR, month-end %, S&P 500 proxy).

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

Run `supabase/migrations/001_dsa_family_schema.sql` in the Supabase SQL editor.
