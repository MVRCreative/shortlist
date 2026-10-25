-- 0002: profiles, industries, businesses, icps, seeds, exclusions

create or replace function private.normalize_domain(input text)
returns extensions.citext
language plpgsql
immutable
set search_path = ''
as $$
declare
  d text;
begin
  if input is null or btrim(input) = '' then
    raise exception 'domain is required';
  end if;

  d := lower(btrim(input));
  d := regexp_replace(d, '^https?://', '');
  d := regexp_replace(d, '/.*$', '');
  d := regexp_replace(d, ':.*$', '');
  d := regexp_replace(d, '^www\.', '');

  if d = '' or position('.' in d) = 0 or d ~ '[[:space:]]' then
    raise exception 'invalid domain: %', input;
  end if;

  return d::extensions.citext;
end;
$$;

revoke all on function private.normalize_domain(text) from public;
revoke all on function private.normalize_domain(text) from anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email extensions.citext not null,
  full_name text,
  role public.user_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), '')
  );
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;
revoke all on function private.handle_new_user() from anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();

create table public.industries (
  slug text primary key,
  label text not null,
  ocean_values text[] not null default '{}',
  sort_order int not null default 0,
  is_active boolean not null default true
);

insert into public.industries (slug, label, ocean_values, sort_order) values
  ('b2b_saas', 'B2B SaaS', '{}', 1),
  ('fintech', 'Fintech', '{}', 2),
  ('healthcare', 'Healthcare', '{}', 3),
  ('ecommerce', 'E-commerce', '{}', 4),
  ('developer_tools', 'Developer tools', '{}', 5),
  ('professional_services', 'Professional services', '{}', 6),
  ('manufacturing', 'Manufacturing', '{}', 7),
  ('real_estate', 'Real estate', '{}', 8),
  ('education', 'Education', '{}', 9),
  ('media_entertainment', 'Media & entertainment', '{}', 10),
  ('logistics', 'Logistics', '{}', 11),
  ('climate_energy', 'Climate & energy', '{}', 12);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id) on delete cascade,
  website_domain extensions.citext not null,
  name text,
  description text,
  services text[] not null default '{}',
  case_study_urls text[] not null default '{}',
  deal_size public.deal_size,
  prefill jsonb,
  prefilled_at timestamptz,
  onboarding_completed_at timestamptz,
  stripe_customer_id text unique,
  attio_record_id text,
  attio_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_case_study_urls_max_3 check (cardinality(case_study_urls) <= 3)
);

create or replace function private.businesses_normalize_domain()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.website_domain := private.normalize_domain(new.website_domain::text);
  return new;
end;
$$;

create trigger businesses_normalize_domain
  before insert or update of website_domain on public.businesses
  for each row
  execute function private.businesses_normalize_domain();

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row
  execute function private.set_updated_at();

create table public.icps (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  version int not null,
  is_active boolean not null default true,
  industry_slugs text[] not null default '{}',
  custom_industries text[] not null default '{}',
  employee_ranges public.employee_range[] not null default '{}',
  regions public.region_code[] not null default '{}',
  buyer_titles text[] not null default '{}',
  signal_types public.signal_type[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, version)
);

create unique index icps_one_active_per_business
  on public.icps (business_id)
  where is_active;

create index icps_business_id_idx on public.icps (business_id);

create trigger icps_set_updated_at
  before update on public.icps
  for each row
  execute function private.set_updated_at();

create table public.icp_seed_accounts (
  id uuid primary key default gen_random_uuid(),
  icp_id uuid not null references public.icps (id) on delete cascade,
  domain extensions.citext not null,
  company_id uuid,
  created_at timestamptz not null default now(),
  unique (icp_id, domain)
);

create index icp_seed_accounts_icp_id_idx on public.icp_seed_accounts (icp_id);

create or replace function private.icp_seed_accounts_normalize_domain()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.domain := private.normalize_domain(new.domain::text);
  return new;
end;
$$;

create trigger icp_seed_accounts_normalize_domain
  before insert or update of domain on public.icp_seed_accounts
  for each row
  execute function private.icp_seed_accounts_normalize_domain();

create or replace function private.icp_seed_accounts_max_three()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  seed_count int;
begin
  select count(*) into seed_count
  from public.icp_seed_accounts
  where icp_id = new.icp_id;

  if seed_count >= 3 then
    raise exception 'an ICP may have at most 3 seed accounts';
  end if;

  return new;
end;
$$;

create trigger icp_seed_accounts_max_three
  before insert on public.icp_seed_accounts
  for each row
  execute function private.icp_seed_accounts_max_three();

create table public.business_exclusions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  domain extensions.citext not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (business_id, domain)
);

create index business_exclusions_business_id_idx on public.business_exclusions (business_id);

create or replace function private.business_exclusions_normalize_domain()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.domain := private.normalize_domain(new.domain::text);
  return new;
end;
$$;

create trigger business_exclusions_normalize_domain
  before insert or update of domain on public.business_exclusions
  for each row
  execute function private.business_exclusions_normalize_domain();
