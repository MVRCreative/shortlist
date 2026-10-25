-- 0005: drops, drop_accounts, drop_content, account_events

create table public.drops (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  icp_id uuid not null references public.icps (id),
  plan_id text not null references public.plans (id),
  scheduled_for timestamptz not null,
  status public.drop_status not null default 'scheduled',
  target_count int not null,
  delivered_count int not null default 0,
  shortfall int not null default 0,
  shortfall_note text,
  delivered_at timestamptz,
  notified_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, scheduled_for)
);

create index drops_business_id_idx on public.drops (business_id);

create trigger drops_set_updated_at
  before update on public.drops
  for each row
  execute function private.set_updated_at();

create table public.drop_accounts (
  id uuid primary key default gen_random_uuid(),
  drop_id uuid not null references public.drops (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  company_id uuid not null references public.companies (id),
  contact_id uuid references public.contacts (id),
  signal_id uuid references public.company_signals (id),
  position int not null,
  score numeric(6, 3),
  score_breakdown jsonb,
  fit_reason text not null,
  outreach_angle text not null,
  linkedin_message text not null,
  snapshot jsonb not null,
  fit_status public.fit_status,
  not_fit_reason public.not_fit_reason,
  viewed_at timestamptz,
  contacted_at timestamptz,
  replied_at timestamptz,
  booked_call_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, company_id)
);

create index drop_accounts_cap_idx on public.drop_accounts (company_id, created_at);
create index drop_accounts_drop_idx on public.drop_accounts (drop_id, position);
create index drop_accounts_business_id_idx on public.drop_accounts (business_id);

create trigger drop_accounts_set_updated_at
  before update on public.drop_accounts
  for each row
  execute function private.set_updated_at();

create table public.drop_content (
  id uuid primary key default gen_random_uuid(),
  drop_id uuid not null references public.drops (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  type public.content_type not null,
  title text,
  body text not null,
  outline jsonb,
  created_at timestamptz not null default now(),
  unique (drop_id, type)
);

create index drop_content_business_id_idx on public.drop_content (business_id);

create table public.account_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  drop_account_id uuid not null references public.drop_accounts (id) on delete cascade,
  type public.account_event_type not null,
  metadata jsonb,
  occurred_at timestamptz not null default now()
);

create index account_events_business_time_idx
  on public.account_events (business_id, occurred_at desc);

create index account_events_drop_account_idx
  on public.account_events (drop_account_id);
