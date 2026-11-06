-- Vocabulary: audiences, seeds, references, lookalikes, drop account events,
-- library requests. Contacted can be undone unless a reply or booked call exists.
-- Snapshot remains the card. data_source gains deepline (unused in this file).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

alter table public.icps rename to audiences;
alter table public.icp_seed_accounts rename to audience_seeds;
alter table public.icp_reference_accounts rename to audience_references;
alter table public.business_lookalikes rename to audience_lookalikes;
alter table public.account_events rename to drop_account_events;
alter table public.sector_requests rename to library_requests;

alter table public.audience_seeds rename column icp_id to audience_id;
alter table public.audience_references rename column icp_id to audience_id;
alter table public.audience_lookalikes rename column icp_id to audience_id;
alter table public.drops rename column icp_id to audience_id;
alter table public.library_requests rename column icp_id to audience_id;

alter type public.sector_request_status rename to library_request_status;

-- ---------------------------------------------------------------------------
-- Constraints, indexes, triggers, policies
-- ---------------------------------------------------------------------------

alter table public.audiences rename constraint icps_pkey to audiences_pkey;
alter table public.audiences rename constraint icps_business_id_version_key to audiences_business_id_version_key;
alter table public.audiences rename constraint icps_business_id_fkey to audiences_business_id_fkey;

alter index public.icps_business_id_idx rename to audiences_business_id_idx;
alter index public.icps_one_active_per_lineage rename to audiences_one_active_per_lineage;
alter index public.icps_one_primary_per_business rename to audiences_one_primary_per_business;
alter index public.icps_lineage_id_idx rename to audiences_lineage_id_idx;

alter trigger icps_set_updated_at on public.audiences rename to audiences_set_updated_at;

alter table public.audience_seeds rename constraint icp_seed_accounts_pkey to audience_seeds_pkey;
alter table public.audience_seeds rename constraint icp_seed_accounts_icp_id_domain_key to audience_seeds_audience_id_domain_key;
alter table public.audience_seeds rename constraint icp_seed_accounts_icp_id_fkey to audience_seeds_audience_id_fkey;
alter table public.audience_seeds rename constraint icp_seed_accounts_company_fk to audience_seeds_company_fk;

alter index public.icp_seed_accounts_icp_id_idx rename to audience_seeds_audience_id_idx;

alter trigger icp_seed_accounts_normalize_domain on public.audience_seeds rename to audience_seeds_normalize_domain;
alter trigger icp_seed_accounts_max_three on public.audience_seeds rename to audience_seeds_max_three;

alter table public.audience_references rename constraint icp_reference_accounts_pkey to audience_references_pkey;
alter table public.audience_references rename constraint icp_reference_accounts_icp_id_domain_key to audience_references_audience_id_domain_key;
alter table public.audience_references rename constraint icp_reference_accounts_icp_id_fkey to audience_references_audience_id_fkey;

alter index public.icp_reference_accounts_icp_id_idx rename to audience_references_audience_id_idx;

alter trigger icp_reference_accounts_normalize_domain on public.audience_references rename to audience_references_normalize_domain;

alter table public.audience_lookalikes rename constraint business_lookalikes_pkey to audience_lookalikes_pkey;
alter table public.audience_lookalikes rename constraint business_lookalikes_business_id_fkey to audience_lookalikes_business_id_fkey;
alter table public.audience_lookalikes rename constraint business_lookalikes_icp_id_fkey to audience_lookalikes_audience_id_fkey;
alter table public.audience_lookalikes rename constraint business_lookalikes_company_id_fkey to audience_lookalikes_company_id_fkey;
alter table public.audience_lookalikes rename constraint business_lookalikes_similarity_range to audience_lookalikes_similarity_range;

alter index public.business_lookalikes_business_idx rename to audience_lookalikes_business_idx;
alter index public.business_lookalikes_company_idx rename to audience_lookalikes_company_idx;

alter table public.drops rename constraint drops_icp_id_fkey to drops_audience_id_fkey;

alter table public.drop_account_events rename constraint account_events_pkey to drop_account_events_pkey;
alter table public.drop_account_events rename constraint account_events_business_id_fkey to drop_account_events_business_id_fkey;
alter table public.drop_account_events rename constraint account_events_drop_account_id_fkey to drop_account_events_drop_account_id_fkey;

alter index public.account_events_business_time_idx rename to drop_account_events_business_time_idx;
alter index public.account_events_drop_account_idx rename to drop_account_events_drop_account_idx;

alter table public.library_requests rename constraint sector_requests_pkey to library_requests_pkey;
alter table public.library_requests rename constraint sector_requests_business_id_fkey to library_requests_business_id_fkey;
alter table public.library_requests rename constraint sector_requests_icp_id_fkey to library_requests_audience_id_fkey;
alter table public.library_requests rename constraint sector_requests_library_id_fkey to library_requests_library_id_fkey;

alter index public.sector_requests_business_id_idx rename to library_requests_business_id_idx;
alter index public.sector_requests_status_idx rename to library_requests_status_idx;
alter index public.sector_requests_one_open_per_business_icp rename to library_requests_one_open_per_business_audience;

alter trigger sector_requests_set_updated_at on public.library_requests rename to library_requests_set_updated_at;

alter policy icps_all_own on public.audiences rename to audiences_all_own;
alter policy icp_seed_accounts_all_own on public.audience_seeds rename to audience_seeds_all_own;
alter policy icp_reference_accounts_all_own on public.audience_references rename to audience_references_all_own;
alter policy business_lookalikes_admin_all on public.audience_lookalikes rename to audience_lookalikes_admin_all;
alter policy account_events_select_own on public.drop_account_events rename to drop_account_events_select_own;
alter policy sector_requests_select_own on public.library_requests rename to library_requests_select_own;

-- ---------------------------------------------------------------------------
-- Trigger functions whose bodies name the old tables
-- ---------------------------------------------------------------------------

create or replace function private.icp_seed_accounts_max_three()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  seed_count int;
begin
  select count(*) into seed_count
  from public.audience_seeds
  where audience_id = new.audience_id;

  if seed_count >= 3 then
    raise exception 'an audience may have at most 3 seeds';
  end if;

  return new;
end;
$$;

alter function private.icp_seed_accounts_normalize_domain() rename to audience_seeds_normalize_domain;
alter function private.icp_seed_accounts_max_three() rename to audience_seeds_max_three;
alter function private.icp_reference_accounts_normalize_domain() rename to audience_references_normalize_domain;

-- ---------------------------------------------------------------------------
-- deliverable_companies
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
  v_audience public.audiences%rowtype;
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
    select * into v_audience
    from public.audiences
    where business_id = p_business_id
      and lineage_id = p_audience_lineage_id
      and is_active
    limit 1;
  else
    select * into v_audience
    from public.audiences
    where business_id = p_business_id
      and is_active
      and is_primary
    limit 1;

    if v_audience.id is null then
      select * into v_audience
      from public.audiences
      where business_id = p_business_id
        and is_active
      limit 1;
    end if;
  end if;

  if v_audience.id is null then
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
      and l.industry_slugs && v_audience.industry_slugs

    union

    select bl.company_id
    from public.audience_lookalikes bl
    where bl.business_id = p_business_id
      and bl.audience_id = v_audience.id
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
        where ar.lineage_id = v_audience.lineage_id
          and ar.domain = c.domain
          and ar.verdict = 'not_fit'
      )
      and (
        cardinality(v_audience.employee_ranges) = 0
        or c.employee_range = any (v_audience.employee_ranges)
      )
      and (
        cardinality(v_audience.regions) = 0
        or c.region = any (v_audience.regions)
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
            and (cardinality(v_audience.signal_types) = 0 or cs.type = any (v_audience.signal_types))
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
    left join public.audience_lookalikes bl
      on bl.company_id = g.id
     and bl.business_id = p_business_id
     and bl.audience_id = v_audience.id
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
-- ensure_library_request
-- ---------------------------------------------------------------------------

create or replace function public.ensure_library_request(p_business_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_audience public.audiences%rowtype;
  v_total int;
  v_outside int;
  v_min_count int;
  v_ratio numeric;
  v_sla_days int;
  v_existing uuid;
  v_new_id uuid;
begin
  select * into v_audience
  from public.audiences
  where business_id = p_business_id
    and is_active
    and is_primary
  limit 1;

  if v_audience.id is null then
    select * into v_audience
    from public.audiences
    where business_id = p_business_id
      and is_active
    limit 1;
  end if;

  if v_audience.id is null then
    return null;
  end if;

  select lr.id into v_existing
  from public.library_requests lr
  where lr.business_id = p_business_id
    and lr.audience_id = v_audience.id
    and lr.status in ('open', 'in_progress')
  limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  select count(*) into v_total
  from public.audience_lookalikes bl
  where bl.business_id = p_business_id
    and bl.audience_id = v_audience.id;

  v_min_count := private.app_config_int('lookalike_sector_min_count');
  if v_total < v_min_count then
    return null;
  end if;

  select count(*) into v_outside
  from public.audience_lookalikes bl
  where bl.business_id = p_business_id
    and bl.audience_id = v_audience.id
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

  insert into public.library_requests (
    business_id,
    audience_id,
    industry_slugs,
    custom_industries,
    employee_ranges,
    regions,
    status,
    due_at
  ) values (
    p_business_id,
    v_audience.id,
    v_audience.industry_slugs,
    v_audience.custom_industries,
    v_audience.employee_ranges,
    v_audience.regions,
    'open',
    now() + make_interval(days => v_sla_days)
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

revoke all on function public.ensure_library_request(uuid) from public;
revoke all on function public.ensure_library_request(uuid) from anon, authenticated;
grant execute on function public.ensure_library_request(uuid) to service_role;

drop function public.ensure_sector_request(uuid);

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
    from public.drop_account_events
    where business_id = v_business_id
      and type = 'contacted'
  ) w;

  if cardinality(v_weeks) = 0 then
    return query select 0, 0;
    return;
  end if;

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
-- library_inventory reads audiences
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
  left join public.audiences a
    on a.is_active
   and a.industry_slugs && l.industry_slugs
  left join public.subscriptions s
    on s.business_id = a.business_id
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

revoke all on public.library_inventory from public, anon, authenticated;
grant select on public.library_inventory to service_role;

-- ---------------------------------------------------------------------------
-- update_drop_account
-- ---------------------------------------------------------------------------

create or replace function public.update_drop_account(
  p_drop_account_id uuid,
  p_fit_status public.fit_status default null,
  p_not_fit_reason public.not_fit_reason default null,
  p_viewed boolean default null,
  p_contacted boolean default null,
  p_replied boolean default null,
  p_booked_call boolean default null
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

  if p_fit_status is not null then
    v_row.fit_status := p_fit_status;
    if p_fit_status = 'fit' then
      v_row.not_fit_reason := null;
      v_event := 'marked_fit';
    else
      v_row.not_fit_reason := p_not_fit_reason;
      v_event := 'marked_not_fit';
    end if;

    insert into public.drop_account_events (business_id, drop_account_id, type)
    values (v_row.business_id, v_row.id, v_event);
  elsif p_not_fit_reason is not null then
    v_row.not_fit_reason := p_not_fit_reason;
  end if;

  if p_viewed is true and v_row.viewed_at is null then
    v_row.viewed_at := now();
    insert into public.drop_account_events (business_id, drop_account_id, type)
    values (v_row.business_id, v_row.id, 'viewed');
  end if;

  if p_contacted is true and v_row.contacted_at is null then
    v_row.contacted_at := now();
    insert into public.drop_account_events (business_id, drop_account_id, type)
    values (v_row.business_id, v_row.id, 'contacted');
  elsif p_contacted is false then
    if v_row.replied_at is not null or v_row.booked_call_at is not null then
      raise exception 'Cannot mark this account as not contacted after a reply or a booked call';
    end if;

    if v_row.contacted_at is not null then
      v_row.contacted_at := null;
      delete from public.drop_account_events
      where drop_account_id = v_row.id
        and type = 'contacted';
    end if;
  end if;

  if p_replied is true and v_row.replied_at is null then
    v_row.replied_at := now();
    insert into public.drop_account_events (business_id, drop_account_id, type)
    values (v_row.business_id, v_row.id, 'replied');
  end if;

  if p_booked_call is true and v_row.booked_call_at is null then
    v_row.booked_call_at := now();
    insert into public.drop_account_events (business_id, drop_account_id, type)
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

revoke all on function public.update_drop_account(
  uuid,
  public.fit_status,
  public.not_fit_reason,
  boolean,
  boolean,
  boolean,
  boolean
) from public;
revoke all on function public.update_drop_account(
  uuid,
  public.fit_status,
  public.not_fit_reason,
  boolean,
  boolean,
  boolean,
  boolean
) from anon;
grant execute on function public.update_drop_account(
  uuid,
  public.fit_status,
  public.not_fit_reason,
  boolean,
  boolean,
  boolean,
  boolean
) to authenticated, service_role;

drop function public.update_account_state(
  uuid,
  public.fit_status,
  public.not_fit_reason,
  boolean,
  boolean,
  boolean,
  boolean
);

create index drop_accounts_open_idx
  on public.drop_accounts (business_id)
  where contacted_at is null;

-- New enum value is not used in this migration. Postgres will not accept it
-- until this transaction commits.
alter type public.data_source add value if not exists 'deepline';
