-- Add avatar color for family member tiles (Greenlight-style profile colors).
alter table public.dsa_kids
  add column if not exists avatar_color text not null default 'green';
