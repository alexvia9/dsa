-- Parent attestation, and a way for the signed-in parent to delete the login.
-- Family rows already cascade from auth.users (see 001_dsa_family_schema.sql).
-- Run in the Supabase SQL editor after 001 and 002.
--
-- Operator note (information security, sized to this app):
-- One operator. Production data lives in Supabase (sign-in and family rows)
-- and is served from GitHub Pages. Family rows are readable only by the
-- owning parent via row-level security. The browser never receives the
-- service-role key. Review who has access to the Supabase and GitHub
-- accounts at least once a year, and remove access that is no longer needed.

create table public.dsa_parent_ack (
  user_id uuid primary key references auth.users (id) on delete cascade,
  terms_accepted_at timestamptz not null,
  is_adult_guardian boolean not null check (is_adult_guardian),
  created_at timestamptz not null default now()
);

alter table public.dsa_parent_ack enable row level security;

create policy "dsa_parent_ack_select_own"
  on public.dsa_parent_ack for select to authenticated
  using (user_id = auth.uid());

create policy "dsa_parent_ack_insert_own"
  on public.dsa_parent_ack for insert to authenticated
  with check (user_id = auth.uid());

create policy "dsa_parent_ack_update_own"
  on public.dsa_parent_ack for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  delete from public.dsa_ledger_entries where user_id = uid;
  delete from public.dsa_accounts where user_id = uid;
  delete from public.dsa_kids where user_id = uid;
  delete from public.dsa_parent_ack where user_id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
