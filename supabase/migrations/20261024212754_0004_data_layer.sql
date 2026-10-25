-- 0004: companies, contacts, signals, libraries, lookalikes

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  domain extensions.citext not null unique,
  name text not null,
  linkedin_url text,
  description text,
  industry_slug text references public.industries (slug),
  industry_raw text,
  employee_count int,
  employee_range public.employee_range,
  hq_city text,
  hq_state text,
  hq_country_code text,
  region public.region_code,
  founded_year int,
  technologies text[] not null default '{}',
  logo_url text,
  source public.data_source not null,
  source_id text,
  raw jsonb,
  enriched_at timestamptz,
  is_suppressed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint companies_hq_country_code_iso2 check (
    hq_country_code is null or hq_country_code ~ '^[A-Z]{2}$'
  )
);

create unique index companies_source_source_id_uidx
  on public.companies (source, source_id)
  where source_id is not null;

create index companies_filter_idx
  on public.companies (industry_slug, employee_range, region)
  where not is_suppressed;

create or replace function private.companies_normalize_domain()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.domain := private.normalize_domain(new.domain::text);
  if new.hq_country_code is not null then
    new.hq_country_code := upper(new.hq_country_code);
  end if;
  return new;
end;
$$;

create trigger companies_normalize_domain
  before insert or update of domain, hq_country_code on public.companies
  for each row
  execute function private.companies_normalize_domain();

create trigger companies_set_updated_at
  before update on public.companies
  for each row
  execute function private.set_updated_at();

alter table public.icp_seed_accounts
  add constraint icp_seed_accounts_company_fk
  foreign key (company_id) references public.companies (id) on delete set null;

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  full_name text not null,
  first_name text,
  last_name text,
  title text,
  seniority text,
  department text,
  linkedin_url text unique,
  email extensions.citext,
  email_status public.email_status not null default 'unknown',
  email_confidence numeric(4, 3),
  email_verified_at timestamptz,
  source public.data_source not null,
  source_id text,
  raw jsonb,
  is_suppressed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contacts_email_confidence_range check (
    email_confidence is null
    or (email_confidence >= 0 and email_confidence <= 1)
  )
);

create index contacts_company_idx
  on public.contacts (company_id)
  where not is_suppressed;

create index contacts_email_idx
  on public.contacts (email)
  where email is not null;

create trigger contacts_set_updated_at
  before update on public.contacts
  for each row
  execute function private.set_updated_at();

create table public.company_signals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  type public.signal_type not null,
  title text not null,
  summary text,
  source_url text,
  occurred_at date,
  detected_at timestamptz not null default now(),
  expires_at timestamptz,
  source public.data_source not null,
  raw jsonb,
  created_at timestamptz not null default now()
);

create index company_signals_recent_idx
  on public.company_signals (company_id, type, occurred_at desc);

create table public.libraries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  industry_slugs text[] not null default '{}',
  source_query jsonb,
  status public.library_status not null default 'building',
  target_size int,
  last_refreshed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger libraries_set_updated_at
  before update on public.libraries
  for each row
  execute function private.set_updated_at();

create table public.library_companies (
  library_id uuid not null references public.libraries (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_active boolean not null default true,
  primary key (library_id, company_id)
);

create index library_companies_company_idx
  on public.library_companies (company_id)
  where is_active;

create trigger library_companies_set_updated_at
  before update on public.library_companies
  for each row
  execute function private.set_updated_at();

create table public.business_lookalikes (
  business_id uuid not null references public.businesses (id) on delete cascade,
  icp_id uuid not null references public.icps (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  similarity numeric(5, 4),
  seed_domain extensions.citext,
  fetched_at timestamptz not null default now(),
  primary key (icp_id, company_id),
  constraint business_lookalikes_similarity_range check (
    similarity is null
    or (similarity >= 0 and similarity <= 1)
  )
);

create index business_lookalikes_business_idx
  on public.business_lookalikes (business_id);

create index business_lookalikes_company_idx
  on public.business_lookalikes (company_id);
