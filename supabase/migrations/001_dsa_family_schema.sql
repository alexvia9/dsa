-- DSA family data: one Supabase Auth user owns kids, accounts, and ledger rows.
-- Run in Supabase SQL Editor or via `supabase db push` after linking a project.

create table public.dsa_kids (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.dsa_accounts (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kid_id uuid not null references public.dsa_kids (id) on delete cascade,
  name text not null,
  balance_cents integer not null default 0,
  strategy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.dsa_ledger_entries (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.dsa_accounts (id) on delete cascade,
  kind text not null check (kind in ('deposit', 'withdrawal')),
  amount_cents integer not null check (amount_cents > 0),
  note text,
  recorded_at date not null,
  created_at timestamptz not null default now()
);

create index dsa_kids_user_id_idx on public.dsa_kids (user_id);
create index dsa_accounts_user_id_idx on public.dsa_accounts (user_id);
create index dsa_accounts_kid_id_idx on public.dsa_accounts (kid_id);
create index dsa_ledger_user_id_idx on public.dsa_ledger_entries (user_id);
create index dsa_ledger_account_id_idx on public.dsa_ledger_entries (account_id);

alter table public.dsa_kids enable row level security;
alter table public.dsa_accounts enable row level security;
alter table public.dsa_ledger_entries enable row level security;

create policy "dsa_kids_select_own"
  on public.dsa_kids for select to authenticated
  using (user_id = auth.uid());

create policy "dsa_kids_insert_own"
  on public.dsa_kids for insert to authenticated
  with check (user_id = auth.uid());

create policy "dsa_kids_update_own"
  on public.dsa_kids for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "dsa_kids_delete_own"
  on public.dsa_kids for delete to authenticated
  using (user_id = auth.uid());

create policy "dsa_accounts_select_own"
  on public.dsa_accounts for select to authenticated
  using (user_id = auth.uid());

create policy "dsa_accounts_insert_own"
  on public.dsa_accounts for insert to authenticated
  with check (user_id = auth.uid());

create policy "dsa_accounts_update_own"
  on public.dsa_accounts for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "dsa_accounts_delete_own"
  on public.dsa_accounts for delete to authenticated
  using (user_id = auth.uid());

create policy "dsa_ledger_select_own"
  on public.dsa_ledger_entries for select to authenticated
  using (user_id = auth.uid());

create policy "dsa_ledger_insert_own"
  on public.dsa_ledger_entries for insert to authenticated
  with check (user_id = auth.uid());

create policy "dsa_ledger_update_own"
  on public.dsa_ledger_entries for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "dsa_ledger_delete_own"
  on public.dsa_ledger_entries for delete to authenticated
  using (user_id = auth.uid());
