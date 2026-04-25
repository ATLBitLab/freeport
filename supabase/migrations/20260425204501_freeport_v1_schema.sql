create extension if not exists pgcrypto;

do $$
begin
  create type seller_status as enum ('active', 'suspended', 'deleted');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type listing_category as enum ('agent_service', 'l402_api', 'l402_workflow');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type listing_pricing_model as enum ('free_contact', 'fixed_sats', 'fixed_usd', 'l402', 'quote_required');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type listing_invocation_method as enum ('https', 'l402', 'nostr_dm', 'email', 'webhook', 'manual_contact');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type moderation_status as enum ('active', 'hidden', 'deleted', 'pending');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type listing_payment_status as enum ('requested', 'pending', 'paid', 'failed', 'expired', 'consumed');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  pubkey text not null unique check (pubkey ~ '^[0-9a-f]{64}$'),
  display_name text,
  contact_method_type text,
  contact_method_value text,
  wallet_type text default 'moneydevkit_agent_wallet',
  wallet_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status seller_status not null default 'active'
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete restrict,
  event_id text not null unique check (event_id ~ '^[0-9a-f]{64}$'),
  kind integer not null,
  category listing_category not null,
  title text not null check (char_length(title) between 4 and 120),
  summary text not null check (char_length(summary) between 12 and 220),
  description text not null,
  tags text[] not null default '{}',
  pricing_model listing_pricing_model not null,
  pricing_details jsonb not null default '{}'::jsonb,
  invocation_method listing_invocation_method not null,
  invocation_url text,
  contact_info jsonb not null default '{}'::jsonb,
  sample_input jsonb,
  sample_output jsonb,
  required_capabilities text[] not null default '{}',
  moderation_status moderation_status not null default 'active',
  hidden_reason text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists public.listing_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  event_id text not null unique check (event_id ~ '^[0-9a-f]{64}$'),
  pubkey text not null check (pubkey ~ '^[0-9a-f]{64}$'),
  kind integer not null,
  created_at_unix bigint not null,
  sig text not null check (sig ~ '^[0-9a-f]{128}$'),
  content text not null,
  tags jsonb not null default '[]'::jsonb,
  canonical_json text not null,
  valid_signature boolean not null default false,
  superseded_by_event_id text,
  inserted_at timestamptz not null default now()
);

create table if not exists public.listing_fee_payments (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.sellers(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  invoice_id text,
  payment_status listing_payment_status not null default 'requested',
  amount_sats integer,
  amount_usd_cents integer not null default 50,
  paid_at timestamptz,
  proof_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_pubkey text,
  action text not null,
  subject_type text not null,
  subject_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sellers_pubkey_idx on public.sellers(pubkey);
create index if not exists listings_category_created_idx on public.listings(category, created_at desc);
create index if not exists listings_active_created_idx on public.listings(active, moderation_status, created_at desc);
create index if not exists listings_tags_idx on public.listings using gin(tags);
create index if not exists listing_events_event_id_idx on public.listing_events(event_id);
create index if not exists listing_events_pubkey_idx on public.listing_events(pubkey);
create index if not exists listing_fee_payments_status_idx on public.listing_fee_payments(payment_status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sellers_set_updated_at on public.sellers;
create trigger sellers_set_updated_at
before update on public.sellers
for each row execute function public.set_updated_at();

drop trigger if exists listings_set_updated_at on public.listings;
create trigger listings_set_updated_at
before update on public.listings
for each row execute function public.set_updated_at();

alter table public.sellers enable row level security;
alter table public.listings enable row level security;
alter table public.listing_events enable row level security;
alter table public.listing_fee_payments enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Public active sellers are readable." on public.sellers;
create policy "Public active sellers are readable."
on public.sellers
for select
to anon, authenticated
using (status = 'active');

drop policy if exists "Public active listings are readable." on public.listings;
create policy "Public active listings are readable."
on public.listings
for select
to anon, authenticated
using (active = true and moderation_status = 'active');

drop policy if exists "Public valid listing events are readable." on public.listing_events;
create policy "Public valid listing events are readable."
on public.listing_events
for select
to anon, authenticated
using (valid_signature = true);
