-- 0006: sector requests, imports, provider calls, suppressions + erasure

create table public.sector_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  icp_id uuid not null references public.icps (id) on delete cascade,
  industry_slugs text[] not null default '{}',
  custom_industries text[] not null default '{}',
  employee_ranges public.employee_range[] not null default '{}',
  regions public.region_code[] not null default '{}',
  status public.sector_request_status not null default 'open',
  library_id uuid references public.libraries (id),
  alerted_at timestamptz,
  due_at timestamptz,
  fulfilled_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sector_requests_business_id_idx on public.sector_requests (business_id);
create index sector_requests_status_idx on public.sector_requests (status);

create unique index sector_requests_one_open_per_business_icp
  on public.sector_requests (business_id, icp_id)
  where status in ('open', 'in_progress');

create trigger sector_requests_set_updated_at
  before update on public.sector_requests
  for each row
  execute function private.set_updated_at();

create table public.library_imports (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references public.libraries (id) on delete cascade,
  source public.data_source not null,
  file_name text,
  column_map jsonb,
  status public.import_status not null default 'pending',
  rows_total int,
  rows_inserted int,
  rows_updated int,
  rows_skipped int,
  errors jsonb,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.provider_calls (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  endpoint text not null,
  business_id uuid references public.businesses (id) on delete set null,
  drop_id uuid references public.drops (id) on delete set null,
  credits_used numeric(10, 2),
  cost_cents numeric(10, 2),
  status_code int,
  duration_ms int,
  error text,
  created_at timestamptz not null default now()
);

create index provider_calls_time_idx
  on public.provider_calls (provider, created_at desc);

create table public.suppressions (
  id uuid primary key default gen_random_uuid(),
  type public.suppression_type not null,
  value extensions.citext not null,
  reason text,
  affected_count int not null default 0,
  scrub_log jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (type, value)
);

create or replace function private.scrub_contact_text(
  input text,
  full_name text,
  email text,
  linkedin_url text
)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  result text := input;
begin
  if result is null then
    return null;
  end if;

  if full_name is not null and btrim(full_name) <> '' then
    result := replace(result, full_name, '[redacted]');
  end if;
  if email is not null and btrim(email::text) <> '' then
    result := replace(result, email::text, '[redacted]');
  end if;
  if linkedin_url is not null and btrim(linkedin_url) <> '' then
    result := replace(result, linkedin_url, '[redacted]');
  end if;

  return result;
end;
$$;

create or replace function private.apply_suppression()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  matched_company_count int := 0;
  scrub_entries jsonb := '[]'::jsonb;
  rec record;
  snap jsonb;
  contact_name text;
  contact_email text;
  contact_linkedin text;
  v_fit_reason text;
  v_outreach_angle text;
  v_linkedin_message text;
  norm_value text;
begin
  if new.type = 'company_domain' then
    norm_value := private.normalize_domain(new.value::text)::text;

    update public.companies
    set is_suppressed = true
    where domain = norm_value::extensions.citext
      and not is_suppressed;

    get diagnostics matched_company_count = row_count;

    new.value := norm_value::extensions.citext;
    new.affected_count := matched_company_count;
    new.scrub_log := '[]'::jsonb;
    return new;
  end if;

  -- Person-level erasure: suppress contacts and scrub delivered snapshots.
  if new.type = 'email' then
    norm_value := lower(btrim(new.value::text));
  else
    norm_value := lower(btrim(new.value::text));
    norm_value := regexp_replace(norm_value, '/$', '');
  end if;

  new.value := norm_value::extensions.citext;

  update public.contacts ct
  set is_suppressed = true
  where (
    (new.type = 'email' and ct.email = norm_value::extensions.citext)
    or (
      new.type = 'person_linkedin'
      and ct.linkedin_url is not null
      and lower(regexp_replace(ct.linkedin_url, '/$', '')) = norm_value
    )
  )
  and not ct.is_suppressed;

  for rec in
      select
      da_row.id as drop_account_id,
      da_row.contact_id,
      da_row.snapshot,
      da_row.fit_reason,
      da_row.outreach_angle,
      da_row.linkedin_message,
      ct.full_name as contact_full_name,
      ct.email::text as contact_email,
      ct.linkedin_url as contact_linkedin
    from public.drop_accounts as da_row
    left join public.contacts ct on ct.id = da_row.contact_id
    where
      (
        da_row.contact_id is not null
        and (
          (new.type = 'email' and ct.email = norm_value::extensions.citext)
          or (
            new.type = 'person_linkedin'
            and ct.linkedin_url is not null
            and lower(regexp_replace(ct.linkedin_url, '/$', '')) = norm_value
          )
        )
      )
      or (
        new.type = 'email'
        and lower(coalesce(da_row.snapshot #>> '{contact,email}', '')) = norm_value
      )
      or (
        new.type = 'person_linkedin'
        and lower(regexp_replace(coalesce(da_row.snapshot #>> '{contact,linkedinUrl}', ''), '/$', '')) = norm_value
      )
  loop
    contact_name := coalesce(
      rec.contact_full_name,
      rec.snapshot #>> '{contact,fullName}'
    );
    contact_email := coalesce(
      rec.contact_email,
      rec.snapshot #>> '{contact,email}'
    );
    contact_linkedin := coalesce(
      rec.contact_linkedin,
      rec.snapshot #>> '{contact,linkedinUrl}'
    );

    snap := rec.snapshot - 'contact';
    v_fit_reason := private.scrub_contact_text(rec.fit_reason, contact_name, contact_email, contact_linkedin);
    v_outreach_angle := private.scrub_contact_text(rec.outreach_angle, contact_name, contact_email, contact_linkedin);
    v_linkedin_message := private.scrub_contact_text(rec.linkedin_message, contact_name, contact_email, contact_linkedin);

    if snap ? 'fitReason' then
      snap := jsonb_set(
        snap,
        '{fitReason}',
        to_jsonb(private.scrub_contact_text(snap ->> 'fitReason', contact_name, contact_email, contact_linkedin))
      );
    end if;
    if snap ? 'outreachAngle' then
      snap := jsonb_set(
        snap,
        '{outreachAngle}',
        to_jsonb(private.scrub_contact_text(snap ->> 'outreachAngle', contact_name, contact_email, contact_linkedin))
      );
    end if;
    if snap ? 'linkedinMessage' then
      snap := jsonb_set(
        snap,
        '{linkedinMessage}',
        to_jsonb(private.scrub_contact_text(snap ->> 'linkedinMessage', contact_name, contact_email, contact_linkedin))
      );
    end if;

    update public.drop_accounts
    set
      contact_id = null,
      snapshot = snap,
      fit_reason = v_fit_reason,
      outreach_angle = v_outreach_angle,
      linkedin_message = v_linkedin_message
    where id = rec.drop_account_id;

    scrub_entries := scrub_entries || jsonb_build_array(
      jsonb_build_object(
        'drop_account_id', rec.drop_account_id,
        'scrubbed_at', now()
      )
    );
  end loop;

  new.affected_count := jsonb_array_length(scrub_entries);
  new.scrub_log := scrub_entries;
  return new;
end;
$$;

revoke all on function private.scrub_contact_text(text, text, text, text) from public;
revoke all on function private.scrub_contact_text(text, text, text, text) from anon, authenticated;
revoke all on function private.apply_suppression() from public;
revoke all on function private.apply_suppression() from anon, authenticated;

create trigger suppressions_apply
  before insert on public.suppressions
  for each row
  execute function private.apply_suppression();
