-- 0007: helpers, ranking, RPCs, views, RLS, grants

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

create or replace function private.my_business_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id
  from public.businesses
  where owner_id = (select auth.uid())
  limit 1;
$$;

create or replace function private.app_config_int(config_key text)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select (value #>> '{}')::int
  from public.app_config
  where key = config_key;
$$;

create or replace function private.app_config_numeric(config_key text)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select (value #>> '{}')::numeric
  from public.app_config
  where key = config_key;
$$;

create or replace function private.app_config_json(config_key text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select value
  from public.app_config
  where key = config_key;
$$;

revoke all on function private.is_admin() from public;
revoke all on function private.my_business_id() from public;
revoke all on function private.app_config_int(text) from public;
revoke all on function private.app_config_numeric(text) from public;
revoke all on function private.app_config_json(text) from public;

grant execute on function private.is_admin() to authenticated, service_role;
grant execute on function private.my_business_id() to authenticated, service_role;
grant execute on function private.app_config_int(text) to service_role;
grant execute on function private.app_config_numeric(text) to service_role;
grant execute on function private.app_config_json(text) to service_role;

-- ---------------------------------------------------------------------------
-- deliverable_companies
-- ---------------------------------------------------------------------------

create or replace function public.deliverable_companies(
  p_business_id uuid,
  result_limit int default 25
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

  select * into v_icp
  from public.icps
  where business_id = p_business_id
    and is_active
  limit 1;

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

revoke all on function public.deliverable_companies(uuid, int) from public;
revoke all on function public.deliverable_companies(uuid, int) from anon, authenticated;
grant execute on function public.deliverable_companies(uuid, int) to service_role;

-- ---------------------------------------------------------------------------
-- ensure_sector_request
-- ---------------------------------------------------------------------------

create or replace function public.ensure_sector_request(p_business_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_icp public.icps%rowtype;
  v_total int;
  v_outside int;
  v_min_count int;
  v_ratio numeric;
  v_sla_days int;
  v_existing uuid;
  v_new_id uuid;
begin
  select * into v_icp
  from public.icps
  where business_id = p_business_id
    and is_active
  limit 1;

  if v_icp.id is null then
    return null;
  end if;

  select sr.id into v_existing
  from public.sector_requests sr
  where sr.business_id = p_business_id
    and sr.icp_id = v_icp.id
    and sr.status in ('open', 'in_progress')
  limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  select count(*) into v_total
  from public.business_lookalikes bl
  where bl.business_id = p_business_id
    and bl.icp_id = v_icp.id;

  v_min_count := private.app_config_int('lookalike_sector_min_count');
  if v_total < v_min_count then
    return null;
  end if;

  select count(*) into v_outside
  from public.business_lookalikes bl
  where bl.business_id = p_business_id
    and bl.icp_id = v_icp.id
    and not exists (
      select 1
      from public.library_companies lc
      join public.libraries l on l.id = lc.library_id
      where lc.company_id = bl.company_id
        and lc.is_active
        and l.status = 'active'
    );

  v_ratio := private.app_config_numeric('lookalike_outside_library_ratio');
  if (v_outside::numeric / v_total::numeric) <= v_ratio then
    return null;
  end if;

  v_sla_days := private.app_config_int('first_drop_sla_days');

  insert into public.sector_requests (
    business_id,
    icp_id,
    industry_slugs,
    custom_industries,
    employee_ranges,
    regions,
    status,
    due_at
  ) values (
    p_business_id,
    v_icp.id,
    v_icp.industry_slugs,
    v_icp.custom_industries,
    v_icp.employee_ranges,
    v_icp.regions,
    'open',
    now() + make_interval(days => v_sla_days)
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

revoke all on function public.ensure_sector_request(uuid) from public;
revoke all on function public.ensure_sector_request(uuid) from anon, authenticated;
grant execute on function public.ensure_sector_request(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- update_account_state
-- ---------------------------------------------------------------------------

create or replace function public.update_account_state(
  p_drop_account_id uuid,
  p_fit_status public.fit_status default null,
  p_not_fit_reason public.not_fit_reason default null,
  p_viewed boolean default false,
  p_contacted boolean default false,
  p_replied boolean default false,
  p_booked_call boolean default false
)
returns public.drop_accounts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.drop_accounts%rowtype;
  v_business_id uuid;
  v_event public.account_event_type;
begin
  v_business_id := private.my_business_id();

  if v_business_id is null and not private.is_admin() then
    raise exception 'not authorized';
  end if;

  select * into v_row
  from public.drop_accounts
  where id = p_drop_account_id
  for update;

  if not found then
    raise exception 'drop account not found';
  end if;

  if v_row.business_id is distinct from v_business_id and not private.is_admin() then
    raise exception 'not authorized';
  end if;

  if p_fit_status = 'not_fit' and p_not_fit_reason is null and v_row.not_fit_reason is null then
    -- reason optional per product; allow null
    null;
  end if;

  if p_fit_status is not null then
    v_row.fit_status := p_fit_status;
    if p_fit_status = 'fit' then
      v_row.not_fit_reason := null;
      v_event := 'marked_fit';
    else
      v_row.not_fit_reason := p_not_fit_reason;
      v_event := 'marked_not_fit';
    end if;

    insert into public.account_events (business_id, drop_account_id, type)
    values (v_row.business_id, v_row.id, v_event);
  elsif p_not_fit_reason is not null then
    v_row.not_fit_reason := p_not_fit_reason;
  end if;

  if p_viewed and v_row.viewed_at is null then
    v_row.viewed_at := now();
    insert into public.account_events (business_id, drop_account_id, type)
    values (v_row.business_id, v_row.id, 'viewed');
  end if;

  if p_contacted and v_row.contacted_at is null then
    v_row.contacted_at := now();
    insert into public.account_events (business_id, drop_account_id, type)
    values (v_row.business_id, v_row.id, 'contacted');
  end if;

  if p_replied and v_row.replied_at is null then
    v_row.replied_at := now();
    insert into public.account_events (business_id, drop_account_id, type)
    values (v_row.business_id, v_row.id, 'replied');
  end if;

  if p_booked_call and v_row.booked_call_at is null then
    v_row.booked_call_at := now();
    insert into public.account_events (business_id, drop_account_id, type)
    values (v_row.business_id, v_row.id, 'booked_call');
  end if;

  update public.drop_accounts
  set
    fit_status = v_row.fit_status,
    not_fit_reason = v_row.not_fit_reason,
    viewed_at = v_row.viewed_at,
    contacted_at = v_row.contacted_at,
    replied_at = v_row.replied_at,
    booked_call_at = v_row.booked_call_at
  where id = v_row.id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.update_account_state(
  uuid,
  public.fit_status,
  public.not_fit_reason,
  boolean,
  boolean,
  boolean,
  boolean
) from public;
revoke all on function public.update_account_state(
  uuid,
  public.fit_status,
  public.not_fit_reason,
  boolean,
  boolean,
  boolean,
  boolean
) from anon;
grant execute on function public.update_account_state(
  uuid,
  public.fit_status,
  public.not_fit_reason,
  boolean,
  boolean,
  boolean,
  boolean
) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- get_my_streak
-- ---------------------------------------------------------------------------

create or replace function public.get_my_streak()
returns table (
  current_streak int,
  best_streak int
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_business_id uuid;
  v_weeks date[];
  v_week date;
  v_prev date;
  v_run int := 0;
  v_best int := 0;
  v_current int := 0;
  v_this_week date := date_trunc('week', now())::date;
  v_idx int;
begin
  v_business_id := private.my_business_id();
  if v_business_id is null then
    return query select 0, 0;
    return;
  end if;

  select coalesce(array_agg(week_start order by week_start desc), '{}')
  into v_weeks
  from (
    select distinct date_trunc('week', occurred_at)::date as week_start
    from public.account_events
    where business_id = v_business_id
      and type = 'contacted'
  ) w;

  if cardinality(v_weeks) = 0 then
    return query select 0, 0;
    return;
  end if;

  -- best streak across all contacted weeks
  v_prev := null;
  v_run := 0;
  for v_idx in reverse 1..cardinality(v_weeks) loop
    v_week := v_weeks[v_idx];
    if v_prev is null or v_week = v_prev + 7 then
      v_run := v_run + 1;
    else
      v_run := 1;
    end if;
    if v_run > v_best then
      v_best := v_run;
    end if;
    v_prev := v_week;
  end loop;

  -- current streak: must include this week or last week
  if v_weeks[1] = v_this_week or v_weeks[1] = v_this_week - 7 then
    v_current := 1;
    v_prev := v_weeks[1];
    for v_idx in 2..cardinality(v_weeks) loop
      v_week := v_weeks[v_idx];
      if v_week = v_prev - 7 then
        v_current := v_current + 1;
        v_prev := v_week;
      else
        exit;
      end if;
    end loop;
  else
    v_current := 0;
  end if;

  return query select v_current, v_best;
end;
$$;

revoke all on function public.get_my_streak() from public;
revoke all on function public.get_my_streak() from anon;
grant execute on function public.get_my_streak() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------------

create or replace view public.library_inventory
with (security_invoker = true)
as
with config as (
  select
    private.app_config_int('account_cap_per_quarter') as cap,
    private.app_config_int('cap_window_days') as window_days,
    private.app_config_int('low_inventory_weeks') as low_weeks
),
deliverable as (
  select
    lc.library_id,
    count(*)::numeric as deliverable_count
  from public.library_companies lc
  join public.companies c on c.id = lc.company_id
  cross join config cfg
  where lc.is_active
    and not c.is_suppressed
    and (
      select count(distinct da.business_id)
      from public.drop_accounts da
      where da.company_id = c.id
        and da.created_at >= now() - make_interval(days => cfg.window_days)
    ) < cfg.cap
  group by lc.library_id
),
demand as (
  select
    l.id as library_id,
    coalesce(
      sum(
        case
          when p.delivery_cadence = 'weekly' then p.accounts_per_drop
          else p.accounts_per_drop::numeric / 4
        end
      ),
      0
    ) as weekly_demand
  from public.libraries l
  left join public.icps i
    on i.is_active
   and i.industry_slugs && l.industry_slugs
  left join public.subscriptions s
    on s.business_id = i.business_id
   and s.status in ('trialing', 'active', 'past_due')
  left join public.plans p on p.id = s.plan_id
  group by l.id
)
select
  l.id as library_id,
  l.slug,
  l.name,
  l.status,
  coalesce(d.deliverable_count, 0) as deliverable_count,
  coalesce(dm.weekly_demand, 0) as weekly_demand,
  case
    when coalesce(dm.weekly_demand, 0) = 0 then null
    else coalesce(d.deliverable_count, 0) / dm.weekly_demand
  end as weeks_of_supply,
  case
    when coalesce(dm.weekly_demand, 0) = 0 then false
    else (coalesce(d.deliverable_count, 0) / dm.weekly_demand)
      < (select low_weeks from config)
  end as is_low
from public.libraries l
left join deliverable d on d.library_id = l.id
left join demand dm on dm.library_id = l.id;

create or replace view public.member_activity
with (security_invoker = true)
as
with config as (
  select
    private.app_config_numeric('poor_fit_ratio') as poor_fit_ratio,
    private.app_config_int('not_acting_min_delivered') as not_acting_min
),
windowed as (
  select
    da.business_id,
    count(*) as accounts_delivered,
    count(*) filter (where da.viewed_at is not null) as accounts_viewed,
    count(*) filter (where da.contacted_at is not null) as accounts_contacted,
    count(*) filter (where da.replied_at is not null) as accounts_replied,
    count(*) filter (where da.booked_call_at is not null) as accounts_booked,
    count(*) filter (where da.fit_status = 'not_fit') as accounts_not_fit,
    count(*) filter (where da.fit_status is not null) as accounts_rated
  from public.drop_accounts da
  where da.created_at >= now() - interval '4 weeks'
  group by da.business_id
)
select
  b.id as business_id,
  b.name as business_name,
  b.owner_id,
  coalesce(w.accounts_delivered, 0) as accounts_delivered,
  coalesce(w.accounts_viewed, 0) as accounts_viewed,
  coalesce(w.accounts_contacted, 0) as accounts_contacted,
  coalesce(w.accounts_replied, 0) as accounts_replied,
  coalesce(w.accounts_booked, 0) as accounts_booked,
  case
    when coalesce(w.accounts_rated, 0) = 0 then 0
    else w.accounts_not_fit::numeric / w.accounts_rated
  end as not_fit_ratio,
  coalesce(w.accounts_booked, 0) >= 1 as traction,
  (
    coalesce(w.accounts_delivered, 0) >= (select not_acting_min from config)
    and coalesce(w.accounts_contacted, 0) = 0
  ) as not_acting,
  (
    coalesce(w.accounts_rated, 0) > 0
    and (w.accounts_not_fit::numeric / w.accounts_rated)
      >= (select poor_fit_ratio from config)
  ) as poor_fit
from public.businesses b
left join windowed w on w.business_id = b.id;

revoke all on public.library_inventory from public, anon, authenticated;
revoke all on public.member_activity from public, anon, authenticated;
grant select on public.library_inventory to service_role;
grant select on public.member_activity to service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.app_config enable row level security;
alter table public.profiles enable row level security;
alter table public.industries enable row level security;
alter table public.businesses enable row level security;
alter table public.icps enable row level security;
alter table public.icp_seed_accounts enable row level security;
alter table public.business_exclusions enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.company_signals enable row level security;
alter table public.libraries enable row level security;
alter table public.library_companies enable row level security;
alter table public.business_lookalikes enable row level security;
alter table public.drops enable row level security;
alter table public.drop_accounts enable row level security;
alter table public.drop_content enable row level security;
alter table public.account_events enable row level security;
alter table public.sector_requests enable row level security;
alter table public.library_imports enable row level security;
alter table public.provider_calls enable row level security;
alter table public.suppressions enable row level security;

-- profiles
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.is_admin());

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or private.is_admin())
  with check (id = (select auth.uid()) or private.is_admin());

-- industries / plans (public read of active/public)
create policy industries_select_active on public.industries
  for select to authenticated
  using (is_active or private.is_admin());

create policy plans_select_public on public.plans
  for select to authenticated
  using (is_public or private.is_admin());

-- businesses
create policy businesses_select_own on public.businesses
  for select to authenticated
  using (owner_id = (select auth.uid()) or private.is_admin());

create policy businesses_insert_own on public.businesses
  for insert to authenticated
  with check (owner_id = (select auth.uid()) or private.is_admin());

create policy businesses_update_own on public.businesses
  for update to authenticated
  using (owner_id = (select auth.uid()) or private.is_admin())
  with check (owner_id = (select auth.uid()) or private.is_admin());

-- icps
create policy icps_all_own on public.icps
  for all to authenticated
  using (
    business_id = private.my_business_id()
    or private.is_admin()
  )
  with check (
    business_id = private.my_business_id()
    or private.is_admin()
  );

create policy icp_seed_accounts_all_own on public.icp_seed_accounts
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

create policy business_exclusions_all_own on public.business_exclusions
  for all to authenticated
  using (business_id = private.my_business_id() or private.is_admin())
  with check (business_id = private.my_business_id() or private.is_admin());

-- subscriptions (read own)
create policy subscriptions_select_own on public.subscriptions
  for select to authenticated
  using (business_id = private.my_business_id() or private.is_admin());

-- delivery
create policy drops_select_own on public.drops
  for select to authenticated
  using (business_id = private.my_business_id() or private.is_admin());

create policy drop_accounts_select_own on public.drop_accounts
  for select to authenticated
  using (business_id = private.my_business_id() or private.is_admin());

create policy drop_content_select_own on public.drop_content
  for select to authenticated
  using (business_id = private.my_business_id() or private.is_admin());

create policy account_events_select_own on public.account_events
  for select to authenticated
  using (business_id = private.my_business_id() or private.is_admin());

create policy sector_requests_select_own on public.sector_requests
  for select to authenticated
  using (business_id = private.my_business_id() or private.is_admin());

-- Admin policies for tables members cannot access
create policy app_config_admin_all on public.app_config
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy companies_admin_all on public.companies
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy contacts_admin_all on public.contacts
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy company_signals_admin_all on public.company_signals
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy libraries_admin_all on public.libraries
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy library_companies_admin_all on public.library_companies
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy business_lookalikes_admin_all on public.business_lookalikes
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy library_imports_admin_all on public.library_imports
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy provider_calls_admin_all on public.provider_calls
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy suppressions_admin_all on public.suppressions
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

-- Members have no useful policies on these tables; RLS denies them.
-- Authenticated still needs grants so admin policies can succeed.
revoke all on table public.app_config from anon;
revoke all on table public.companies from anon;
revoke all on table public.contacts from anon;
revoke all on table public.company_signals from anon;
revoke all on table public.libraries from anon;
revoke all on table public.library_companies from anon;
revoke all on table public.business_lookalikes from anon;
revoke all on table public.library_imports from anon;
revoke all on table public.provider_calls from anon;
revoke all on table public.suppressions from anon;

grant select, insert, update, delete on table public.app_config to authenticated;
grant select, insert, update, delete on table public.companies to authenticated;
grant select, insert, update, delete on table public.contacts to authenticated;
grant select, insert, update, delete on table public.company_signals to authenticated;
grant select, insert, update, delete on table public.libraries to authenticated;
grant select, insert, update, delete on table public.library_companies to authenticated;
grant select, insert, update, delete on table public.business_lookalikes to authenticated;
grant select, insert, update, delete on table public.library_imports to authenticated;
grant select, insert, update, delete on table public.provider_calls to authenticated;
grant select, insert, update, delete on table public.suppressions to authenticated;

-- Member-readable tables
grant select on table public.industries to authenticated;
grant select on table public.plans to authenticated;

grant select, update on table public.profiles to authenticated;
revoke update (role) on table public.profiles from authenticated;

grant select, insert, update on table public.businesses to authenticated;
revoke update (stripe_customer_id, attio_record_id, attio_synced_at)
  on table public.businesses from authenticated;

grant select, insert, update, delete on table public.icps to authenticated;
grant select, insert, update, delete on table public.icp_seed_accounts to authenticated;
grant select, insert, update, delete on table public.business_exclusions to authenticated;

grant select on table public.subscriptions to authenticated;
grant select on table public.drops to authenticated;
grant select on table public.drop_content to authenticated;
grant select on table public.account_events to authenticated;
grant select on table public.sector_requests to authenticated;

-- drop_accounts: select without score columns
revoke all on table public.drop_accounts from anon, authenticated;
grant select (
  id,
  drop_id,
  business_id,
  company_id,
  contact_id,
  signal_id,
  position,
  fit_reason,
  outreach_angle,
  linkedin_message,
  snapshot,
  fit_status,
  not_fit_reason,
  viewed_at,
  contacted_at,
  replied_at,
  booked_call_at,
  created_at,
  updated_at
) on table public.drop_accounts to authenticated;

-- Service role needs full access (bypass RLS by default, but grants still matter for some paths)
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
grant usage on schema private to service_role;
grant execute on all functions in schema private to service_role;
