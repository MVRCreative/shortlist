-- 0003: plans and subscriptions

create table public.plans (
  id text primary key,
  name text not null,
  price_cents int not null,
  currency text not null default 'usd',
  delivery_cadence public.plan_cadence not null,
  billing_interval public.billing_interval not null default 'monthly',
  accounts_per_drop int not null,
  drops_per_month int not null,
  content_types public.content_type[] not null default '{linkedin_post,x_post,blog_idea}',
  stripe_price_id text unique,
  is_public boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger plans_set_updated_at
  before update on public.plans
  for each row
  execute function private.set_updated_at();

insert into public.plans (
  id,
  name,
  price_cents,
  delivery_cadence,
  billing_interval,
  accounts_per_drop,
  drops_per_month,
  sort_order
) values
  ('starter', 'Starter', 7900, 'monthly', 'monthly', 10, 1, 1),
  ('pro', 'Pro', 9900, 'weekly', 'monthly', 5, 4, 2),
  ('growth', 'Growth', 17900, 'weekly', 'monthly', 10, 4, 3);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  plan_id text not null references public.plans (id),
  stripe_subscription_id text unique,
  status public.subscription_status not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_business_id_idx on public.subscriptions (business_id);

create unique index subscriptions_one_live_per_business
  on public.subscriptions (business_id)
  where status in ('trialing', 'active', 'past_due');

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row
  execute function private.set_updated_at();
