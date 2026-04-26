alter type listing_pricing_model add value if not exists 'fixed';
alter type listing_pricing_model add value if not exists 'donation';
alter type listing_pricing_model add value if not exists 'amountless_offer';

alter table public.listings
  add column if not exists contact_methods jsonb not null default '[]'::jsonb,
  add column if not exists payment_methods jsonb not null default '[]'::jsonb,
  add column if not exists delivery_method text,
  add column if not exists turnaround jsonb,
  add column if not exists service_area jsonb,
  add column if not exists capabilities text[] not null default '{}',
  add column if not exists requirements text[] not null default '{}',
  add column if not exists availability jsonb,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.listings
  drop constraint if exists listings_contact_methods_array_check,
  add constraint listings_contact_methods_array_check
    check (jsonb_typeof(contact_methods) = 'array');

alter table public.listings
  drop constraint if exists listings_payment_methods_array_check,
  add constraint listings_payment_methods_array_check
    check (jsonb_typeof(payment_methods) = 'array');

alter table public.listings
  drop constraint if exists listings_delivery_method_check,
  add constraint listings_delivery_method_check
    check (
      delivery_method is null
      or delivery_method in ('async_contact', 'email', 'api', 'scheduled_call', 'manual')
    );

alter table public.listings
  drop constraint if exists listings_availability_object_check,
  add constraint listings_availability_object_check
    check (availability is null or jsonb_typeof(availability) = 'object');

alter table public.listings
  drop constraint if exists listings_service_area_object_check,
  add constraint listings_service_area_object_check
    check (service_area is null or jsonb_typeof(service_area) = 'object');

alter table public.listings
  drop constraint if exists listings_turnaround_object_check,
  add constraint listings_turnaround_object_check
    check (turnaround is null or jsonb_typeof(turnaround) = 'object');

alter table public.listings
  drop constraint if exists listings_metadata_object_check,
  add constraint listings_metadata_object_check
    check (jsonb_typeof(metadata) = 'object');

update public.listings
set
  contact_methods = case
    when contact_methods = '[]'::jsonb and contact_info ? 'email' then
      jsonb_build_array(jsonb_build_object(
        'type', 'email',
        'value', contact_info ->> 'email',
        'label', 'Primary contact',
        'preferred', true
      ))
    when contact_methods = '[]'::jsonb and contact_info ? 'url' then
      jsonb_build_array(jsonb_build_object(
        'type', 'http',
        'value', contact_info ->> 'url',
        'label', 'Service URL',
        'preferred', true
      ))
    when contact_methods = '[]'::jsonb and contact_info ? 'webhook' then
      jsonb_build_array(jsonb_build_object(
        'type', 'http',
        'value', contact_info ->> 'webhook',
        'label', 'Webhook',
        'preferred', true
      ))
    else contact_methods
  end,
  capabilities = case
    when capabilities = '{}' and required_capabilities <> '{}' then required_capabilities
    else capabilities
  end,
  delivery_method = case
    when delivery_method is not null then delivery_method
    when invocation_method = 'email' then 'email'
    when invocation_method in ('https', 'webhook', 'l402') then 'api'
    else 'manual'
  end,
  metadata = case
    when metadata = '{}'::jsonb then jsonb_build_object('version', 'legacy')
    else metadata
  end;

create index if not exists listings_contact_methods_idx on public.listings using gin(contact_methods);
create index if not exists listings_payment_methods_idx on public.listings using gin(payment_methods);
create index if not exists listings_capabilities_idx on public.listings using gin(capabilities);
