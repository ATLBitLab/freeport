alter table if exists public.sellers
  add column if not exists profile_name text,
  add column if not exists profile_display_name text,
  add column if not exists profile_about text,
  add column if not exists profile_picture_url text,
  add column if not exists profile_website text,
  add column if not exists profile_nip05 text,
  add column if not exists profile_lud16 text,
  add column if not exists profile_bot boolean,
  add column if not exists profile_metadata jsonb not null default '{}'::jsonb,
  add column if not exists profile_event_id text,
  add column if not exists profile_event_created_at bigint;

do $$
begin
  alter table public.sellers
    add constraint sellers_profile_event_id_check
    check (profile_event_id is null or profile_event_id ~ '^[0-9a-f]{64}$');
exception
  when duplicate_object then null;
end $$;

create index if not exists sellers_profile_event_id_idx on public.sellers(profile_event_id);
