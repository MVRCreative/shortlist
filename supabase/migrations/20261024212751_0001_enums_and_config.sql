-- 0001: extensions, enums, private schema, app_config, set_updated_at

create schema if not exists extensions;
create schema if not exists private;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

create type public.user_role as enum ('member', 'admin');
create type public.plan_cadence as enum ('weekly', 'monthly');
create type public.billing_interval as enum ('monthly', 'yearly');
create type public.subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid',
  'paused'
);
create type public.employee_range as enum (
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1000+'
);
create type public.region_code as enum (
  'north_america',
  'uk_ireland',
  'europe',
  'apac',
  'latin_america'
);
create type public.deal_size as enum (
  'under_10k',
  '10k_25k',
  '25k_75k',
  '75k_plus'
);
create type public.signal_type as enum (
  'funding',
  'hiring',
  'leadership_change',
  'product_launch',
  'expansion',
  'news',
  'other'
);
create type public.data_source as enum ('ocean', 'predictleads', 'csv', 'manual');
create type public.email_status as enum ('verified', 'risky', 'invalid', 'unknown');
create type public.library_status as enum ('building', 'active', 'paused', 'archived');
create type public.drop_status as enum ('scheduled', 'building', 'delivered', 'failed', 'skipped');
create type public.fit_status as enum ('fit', 'not_fit');
create type public.not_fit_reason as enum (
  'too_small',
  'too_big',
  'wrong_industry',
  'wrong_region',
  'already_client'
);
create type public.content_type as enum ('linkedin_post', 'x_post', 'blog_idea');
create type public.account_event_type as enum (
  'delivered',
  'viewed',
  'marked_fit',
  'marked_not_fit',
  'contacted',
  'replied',
  'booked_call'
);
create type public.sector_request_status as enum ('open', 'in_progress', 'fulfilled', 'declined');
create type public.suppression_type as enum ('company_domain', 'person_linkedin', 'email');
create type public.import_status as enum ('pending', 'processing', 'completed', 'failed');

create table public.app_config (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

insert into public.app_config (key, value, description) values
  ('account_cap_per_quarter', '3'::jsonb, 'Max distinct businesses an account can be delivered to in the rolling cap window'),
  ('cap_window_days', '90'::jsonb, 'Rolling window in days for the account cap'),
  ('low_inventory_weeks', '4'::jsonb, 'Alert when a library has fewer than N weeks of supply for its current members'),
  ('new_library_target_size', '150'::jsonb, 'Default number of accounts for a newly requested sector'),
  ('first_drop_sla_days', '3'::jsonb, 'Promised days to first drop when a sector must be built'),
  ('lookalike_promote_limit', '25'::jsonb, 'Max lookalike companies promoted into a sector library per business'),
  ('lookalike_sector_min_count', '5'::jsonb, 'Minimum lookalikes before opening a sector request for out-of-library share'),
  ('lookalike_outside_library_ratio', '0.5'::jsonb, 'Open a sector request when this share of lookalikes has no active library membership'),
  ('max_shortfall_extra_drops', '1'::jsonb, 'Cap target_count at accounts_per_drop * (1 + this value)'),
  ('poor_fit_ratio', '0.5'::jsonb, 'member_activity poor_fit flag threshold'),
  ('not_acting_min_delivered', '10'::jsonb, 'member_activity not_acting flag: delivered at least this many with zero contacted'),
  (
    'ranking_weights',
    '{"lookalike":0.35,"signal":0.25,"feedback":0.15,"outcome":0.25}'::jsonb,
    'Weights for deliverable_companies scoring'
  );

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public;
revoke all on function private.set_updated_at() from anon, authenticated;
