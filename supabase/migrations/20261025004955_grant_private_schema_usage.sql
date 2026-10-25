-- Members must USAGE private to invoke security-definer helpers (my_business_id, is_admin)
-- referenced from RLS policies.
grant usage on schema private to authenticated, service_role;
grant execute on function private.my_business_id() to authenticated, service_role;
grant execute on function private.is_admin() to authenticated, service_role;

-- Domain-normalize triggers must run as definer so members can INSERT businesses/seeds
-- without EXECUTE on private.normalize_domain (intentionally revoked from authenticated).
alter function private.businesses_normalize_domain() security definer;
alter function private.icp_seed_accounts_normalize_domain() security definer;
alter function private.business_exclusions_normalize_domain() security definer;
alter function private.companies_normalize_domain() security definer;
alter function private.icp_seed_accounts_max_three() security definer;
alter function private.set_updated_at() security definer;
