-- Audiences (multi-ICP lineages), campaign context, reusable campaign content.
-- Existing businesses, ICPs, drops, and contacts are preserved.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.campaign_status as enum (
  'draft',
  'active',
  'completed',
  'archived'
);

create type public.audience_review_verdict as enum ('fit', 'not_fit');

-- ---------------------------------------------------------------------------
-- businesses: social + enriched profile persistence
-- ---------------------------------------------------------------------------

alter table public.businesses
  add column if not exists linkedin_url text,
  add column if not exists x_url text,
  add column if not exists enriched_profile jsonb,
  add column if not exists enriched_at timestamptz;

-- ---------------------------------------------------------------------------
-- icps: stable audience lineage + primary flag
-- ---------------------------------------------------------------------------

alter table public.icps
  add column if not exists lineage_id uuid,
  add column if not exists name text not null default 'Primary audience',
  add column if not exists description text,
  add column if not exists is_primary boolean not null default false;

update public.icps
set lineage_id = id
where lineage_id is null;

alter table public.icps
  alter column lineage_id set not null;

update public.icps i
set is_primary = true
where i.is_active
  and not exists (
    select 1
    from public.icps other
    where other.business_id = i.business_id
      and other.is_primary
  );

drop index if exists public.icps_one_active_per_business;

create unique index icps_one_active_per_lineage
  on public.icps (lineage_id)
  where is_active;

create unique index icps_one_primary_per_business
  on public.icps (business_id)
  where is_primary and is_active;

create index icps_lineage_id_idx on public.icps (lineage_id);

-- ---------------------------------------------------------------------------
-- Reference companies (not Ocean lookalike seeds)
-- ---------------------------------------------------------------------------

create table public.icp_reference_accounts (
  id uuid primary key default gen_random_uuid(),
  icp_id uuid not null references public.icps (id) on delete cascade,
  domain extensions.citext not null,
  label text,
  url text,
  created_at timestamptz not null default now(),
  unique (icp_id, domain)
);

create index icp_reference_accounts_icp_id_idx
  on public.icp_reference_accounts (icp_id);

create or replace function private.icp_reference_accounts_normalize_domain()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.domain := private.normalize_domain(new.domain::text);
  return new;
end;
$$;

create trigger icp_reference_accounts_normalize_domain
  before insert or update of domain on public.icp_reference_accounts
  for each row
  execute function private.icp_reference_accounts_normalize_domain();

-- ---------------------------------------------------------------------------
-- Audience reviews (Ocean company fit / not-fit decisions)
-- ---------------------------------------------------------------------------

create table public.audience_reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  lineage_id uuid not null,
  domain extensions.citext not null,
  verdict public.audience_review_verdict not null,
  company_name text,
  snapshot jsonb,
  reviewed_at timestamptz not null default now(),
  unique (lineage_id, domain)
);

create index audience_reviews_business_id_idx
  on public.audience_reviews (business_id);

create index audience_reviews_lineage_id_idx
  on public.audience_reviews (lineage_id);

create or replace function private.audience_reviews_normalize_domain()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.domain := private.normalize_domain(new.domain::text);
  return new;
end;
$$;

create trigger audience_reviews_normalize_domain
  before insert or update of domain on public.audience_reviews
  for each row
  execute function private.audience_reviews_normalize_domain();

-- ---------------------------------------------------------------------------
-- Campaigns
-- ---------------------------------------------------------------------------

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  audience_lineage_id uuid not null,
  title text not null,
  objective text not null,
  interpreted jsonb,
  supporting_url text,
  status public.campaign_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index campaigns_business_id_idx on public.campaigns (business_id);

create unique index campaigns_one_active_per_business
  on public.campaigns (business_id)
  where status = 'active';

create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row
  execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Campaign assets (reusable LinkedIn / X / blog content)
-- ---------------------------------------------------------------------------

create table public.campaign_assets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  campaign_id uuid references public.campaigns (id) on delete cascade,
  type public.content_type not null,
  title text,
  body text not null,
  outline jsonb,
  input_hash text not null,
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_assets_campaign_or_general check (
    campaign_id is not null
    or type in ('linkedin_post', 'x_post', 'blog_idea')
  )
);

create unique index campaign_assets_campaign_type_uidx
  on public.campaign_assets (campaign_id, type)
  where campaign_id is not null;

create unique index campaign_assets_general_type_uidx
  on public.campaign_assets (business_id, type)
  where campaign_id is null;

create index campaign_assets_business_id_idx
  on public.campaign_assets (business_id);

create trigger campaign_assets_set_updated_at
  before update on public.campaign_assets
  for each row
  execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- drops: freeze audience/campaign context at generation time
-- ---------------------------------------------------------------------------

alter table public.drops
  add column if not exists campaign_id uuid references public.campaigns (id) on delete set null,
  add column if not exists audience_snapshot jsonb,
  add column if not exists campaign_snapshot jsonb;

create index drops_campaign_id_idx on public.drops (campaign_id);

-- ---------------------------------------------------------------------------
-- deliverable_companies: optional audience lineage
-- ---------------------------------------------------------------------------

create or replace function public.deliverable_companies(
  p_business_id uuid,
  result_limit int default 25,
  p_audience_lineage_id uuid default null
)
returns table (
  company_id uuid,
  score numeric,
  score_breakdown jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_icp public.icps%rowtype;
  v_own_domain extensions.citext;
  v_cap int;
  v_window_days int;
  v_weights jsonb;
  w_lookalike numeric;
  w_signal numeric;
  w_feedback numeric;
  w_outcome numeric;
begin
  if result_limit is null or result_limit < 1 then
    result_limit := 25;
  end if;

  if p_audience_lineage_id is not null then
    select * into v_icp
    from public.icps
    where business_id = p_business_id
      and lineage_id = p_audience_lineage_id
      and is_active
    limit 1;
  else
    select * into v_icp
    from public.icps
    where business_id = p_business_id
      and is_active
      and is_primary
    limit 1;

    if v_icp.id is null then
      select * into v_icp
      from public.icps
      where business_id = p_business_id
        and is_active
      limit 1;
    end if;
  end if;

  if v_icp.id is null then
    return;
  end if;

  select website_domain into v_own_domain
  from public.businesses
  where id = p_business_id;

  v_cap := private.app_config_int('account_cap_per_quarter');
  v_window_days := private.app_config_int('cap_window_days');
  v_weights := private.app_config_json('ranking_weights');
  w_lookalike := coalesce((v_weights ->> 'lookalike')::numeric, 0.35);
  w_signal := coalesce((v_weights ->> 'signal')::numeric, 0.25);
  w_feedback := coalesce((v_weights ->> 'feedback')::numeric, 0.15);
  w_outcome := coalesce((v_weights ->> 'outcome')::numeric, 0.25);

  return query
  with candidate_ids as (
    select distinct lc.company_id
    from public.library_companies lc
    join public.libraries l on l.id = lc.library_id
    where lc.is_active
      and l.status = 'active'
      and l.industry_slugs && v_icp.industry_slugs

    union

    select bl.company_id
    from public.business_lookalikes bl
    where bl.business_id = p_business_id
      and bl.icp_id = v_icp.id
  ),
  gated as (
    select c.id
    from candidate_ids ci
    join public.companies c on c.id = ci.company_id
    where not c.is_suppressed
      and c.domain is distinct from v_own_domain
      and not exists (
        select 1
        from public.drop_accounts da
        where da.business_id = p_business_id
          and da.company_id = c.id
      )
      and not exists (
        select 1
        from public.business_exclusions be
        where be.business_id = p_business_id
          and be.domain = c.domain
      )
      and not exists (
        select 1
        from public.audience_reviews ar
        where ar.lineage_id = v_icp.lineage_id
          and ar.domain = c.domain
          and ar.verdict = 'not_fit'
      )
      and (
        cardinality(v_icp.employee_ranges) = 0
        or c.employee_range = any (v_icp.employee_ranges)
      )
      and (
        cardinality(v_icp.regions) = 0
        or c.region = any (v_icp.regions)
      )
      and (
        select count(distinct da.business_id)
        from public.drop_accounts da
        where da.company_id = c.id
          and da.created_at >= now() - make_interval(days => v_window_days)
      ) < v_cap
  ),
  scored as (
    select
      g.id as company_id,
      coalesce(bl.similarity, 0)::numeric as lookalike_score,
      case
        when exists (
          select 1
          from public.company_signals cs
          where cs.company_id = g.id
            and (cardinality(v_icp.signal_types) = 0 or cs.type = any (v_icp.signal_types))
            and (cs.expires_at is null or cs.expires_at > now())
        ) then 1::numeric
        else 0::numeric
      end as signal_score,
      coalesce((
        select
          case
            when count(*) = 0 then 0.5
            else greatest(
              0,
              least(
                1,
                (count(*) filter (where da.fit_status = 'fit'))::numeric
                  / nullif(count(*) filter (where da.fit_status is not null), 0)
              )
            )
          end
        from public.drop_accounts da
        where da.company_id = g.id
          and da.fit_status is not null
      ), 0.5) as feedback_score,
      coalesce((
        select
          least(
            1,
            (
              count(*) filter (where da.replied_at is not null) * 0.5
              + count(*) filter (where da.booked_call_at is not null) * 1.0
            ) / nullif(count(*), 0)
          )
        from public.drop_accounts da
        where da.company_id = g.id
      ), 0) as outcome_score,
      bl.similarity
    from gated g
    left join public.business_lookalikes bl
      on bl.company_id = g.id
     and bl.business_id = p_business_id
     and bl.icp_id = v_icp.id
  )
  select
    s.company_id,
    round(
      (s.lookalike_score * w_lookalike)
      + (s.signal_score * w_signal)
      + (s.feedback_score * w_feedback)
      + (s.outcome_score * w_outcome),
      3
    ) as score,
    jsonb_build_object(
      'lookalike', s.lookalike_score,
      'signal', s.signal_score,
      'feedback', s.feedback_score,
      'outcome', s.outcome_score,
      'weights', v_weights
    ) as score_breakdown
  from scored s
  order by
    score desc,
    s.similarity desc nulls last,
    s.company_id
  limit result_limit;
end;
$$;

revoke all on function public.deliverable_companies(uuid, int, uuid) from public;
grant execute on function public.deliverable_companies(uuid, int, uuid) to authenticated, service_role;

-- Keep the two-arg overload for existing callers.
create or replace function public.deliverable_companies(
  p_business_id uuid,
  result_limit int default 25
)
returns table (
  company_id uuid,
  score numeric,
  score_breakdown jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.deliverable_companies(p_business_id, result_limit, null);
$$;

revoke all on function public.deliverable_companies(uuid, int) from public;
grant execute on function public.deliverable_companies(uuid, int) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.icp_reference_accounts enable row level security;
alter table public.audience_reviews enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_assets enable row level security;

create policy icp_reference_accounts_all_own on public.icp_reference_accounts
  for all to authenticated
  using (
    exists (
      select 1 from public.icps i
      where i.id = icp_id
        and (i.business_id = private.my_business_id() or private.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.icps i
      where i.id = icp_id
        and (i.business_id = private.my_business_id() or private.is_admin())
    )
  );

create policy audience_reviews_all_own on public.audience_reviews
  for all to authenticated
  using (business_id = private.my_business_id() or private.is_admin())
  with check (business_id = private.my_business_id() or private.is_admin());

create policy campaigns_all_own on public.campaigns
  for all to authenticated
  using (business_id = private.my_business_id() or private.is_admin())
  with check (business_id = private.my_business_id() or private.is_admin());

create policy campaign_assets_all_own on public.campaign_assets
  for all to authenticated
  using (business_id = private.my_business_id() or private.is_admin())
  with check (business_id = private.my_business_id() or private.is_admin());
