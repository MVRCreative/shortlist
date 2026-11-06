/**
 * Pushes Shortlist customer data to Attio.
 * Prospect libraries, drop accounts, and contacts are not read or sent.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { AttioClient, AttioRecord } from "@/lib/attio/client";
import {
  ATTIO_SLUGS,
  NEVER_WRITE_SLUGS,
  type AttioWriteValues,
  type CompanyFlags,
  buildCompanyCreateValues,
  buildCompanyFlagValues,
  buildPersonCompanyLink,
  buildPersonCreateValues,
  buildSubscriptionValues,
  companyDomainFilter,
  differingValues,
  linkedRecordIds,
  personEmailFilter,
  stripeSubscriptionFilter,
} from "@/lib/attio/mapping";
import type { Database } from "@/lib/supabase/database.types";

export type ActivitySnapshot = CompanyFlags;

export type SubscriptionSnapshot = {
  id: string;
  stripeSubscriptionId: string | null;
  planId: string;
  status: string;
  deliveryCadence: string | null;
  priceCents: number | null;
  currency: string | null;
  billingInterval: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  startedOn: string | null;
};

export type CustomerBusiness = {
  id: string;
  name: string | null;
  websiteDomain: string;
  ownerEmail: string | null;
  ownerName: string | null;
  subscriptions: SubscriptionSnapshot[];
  activity: ActivitySnapshot | null;
};

export type SyncSnapshot = {
  businesses: CustomerBusiness[];
};

export type PlannedWrite = {
  sent: boolean;
  method: "PUT" | "PATCH";
  path: string;
  values: AttioWriteValues;
};

export type BusinessSyncResult = {
  businessId: string;
  domain: string;
  status: "synced" | "skipped" | "error";
  notes: string[];
  writes: PlannedWrite[];
  companyFlags: {
    shortlist_traction: boolean;
    shortlist_not_acting: boolean;
    shortlist_poor_fit: boolean;
  } | null;
  companyFlagsWritten: boolean;
  error?: string;
};

export type SyncSkip = {
  subject: string;
  reason: string;
};

export type SyncFailure = {
  subject: string;
  error: string;
};

export type SyncSummary = {
  created: number;
  updated: number;
  unchanged: number;
  skipped: SyncSkip[];
  failed: SyncFailure[];
};

export type SyncReport = {
  summary: SyncSummary;
  dryRun: boolean;
  notWritten: {
    neverWrite: readonly string[];
  };
  collisions: { domain: string; businessIds: string[] }[];
  attioRecordQueries: number;
  businesses: BusinessSyncResult[];
};

const NEW_RECORD_PREFIX = "(new ";

export function collidingDomains(
  businesses: { id: string; websiteDomain: string }[],
): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const business of businesses) {
    const domain = business.websiteDomain.trim().toLowerCase();
    const ids = groups.get(domain) ?? [];
    ids.push(business.id);
    groups.set(domain, ids);
  }
  const collisions = new Map<string, string[]>();
  for (const [domain, ids] of groups) {
    if (ids.length > 1) collisions.set(domain, ids);
  }
  return collisions;
}

export async function syncShortlistToAttio(input: {
  client: AttioClient;
  snapshot: SyncSnapshot;
  dryRun: boolean;
  onlyBusinessId?: string;
  markSynced?: (businessId: string, attioRecordId: string) => Promise<void>;
}): Promise<SyncReport> {
  const collisions = collidingDomains(input.snapshot.businesses);
  const collisionIds = new Set<string>();
  for (const ids of collisions.values()) {
    for (const id of ids) collisionIds.add(id);
  }

  const report: SyncReport = {
    summary: { created: 0, updated: 0, unchanged: 0, skipped: [], failed: [] },
    dryRun: input.dryRun,
    notWritten: {
      neverWrite: NEVER_WRITE_SLUGS,
    },
    collisions: [...collisions.entries()]
      .filter(
        ([, businessIds]) =>
          !input.onlyBusinessId || businessIds.includes(input.onlyBusinessId),
      )
      .map(([domain, businessIds]) => ({
        domain,
        businessIds,
      })),
    attioRecordQueries: 0,
    businesses: [],
  };

  for (const business of input.snapshot.businesses) {
    if (input.onlyBusinessId && business.id !== input.onlyBusinessId) continue;
    const domain = business.websiteDomain.trim().toLowerCase();
    if (business.subscriptions.length === 0) {
      if (input.onlyBusinessId) {
        recordSkip(
          report,
          business,
          domain,
          "skipped because the business has no subscription",
        );
      }
      continue;
    }
    const nonRoutable = nonRoutableDomainNote(domain);
    if (nonRoutable) {
      recordSkip(report, business, domain, nonRoutable);
      continue;
    }
    if (collisionIds.has(business.id)) {
      recordSkip(
        report,
        business,
        domain,
        "skipped because website_domain is shared by more than one business",
      );
      continue;
    }

    const notes: string[] = [];
    const writes: PlannedWrite[] = [];
    try {
      const result = await syncBusiness(input, business, report, notes, writes);
      report.businesses.push(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      report.summary.failed.push({ subject: business.id, error: message });
      report.businesses.push({
        businessId: business.id,
        domain,
        status: "error",
        notes,
        writes,
        companyFlags: companyFlagValues(business.activity),
        companyFlagsWritten: writesIncludeCompanyFlags(writes),
        error: message,
      });
    }
  }

  return report;
}

async function syncBusiness(
  input: {
    client: AttioClient;
    dryRun: boolean;
    markSynced?: (businessId: string, attioRecordId: string) => Promise<void>;
  },
  business: CustomerBusiness,
  report: SyncReport,
  notes: string[],
  writes: PlannedWrite[],
): Promise<BusinessSyncResult> {
  const domain = business.websiteDomain.trim().toLowerCase();
  const email = business.ownerEmail?.trim().toLowerCase() ?? "";
  if (!domain) throw new Error("website_domain is empty");
  if (!email) throw new Error("owner email is missing");
  if (!business.activity) {
    notes.push("member_activity row missing; company flags not written");
  }

  const companyRecordId = await resolveCompany(
    input,
    business,
    domain,
    report,
    writes,
  );
  const personRecordId = await resolvePerson(
    input,
    business,
    email,
    companyRecordId,
    report,
    writes,
    notes,
  );

  for (const subscription of business.subscriptions) {
    if (!subscription.stripeSubscriptionId) {
      const reason = `skipped subscription ${subscription.id} because stripe_subscription_id is null`;
      notes.push(reason);
      report.summary.skipped.push({ subject: subscription.id, reason });
      continue;
    }
    const built = buildSubscriptionValues({
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      companyRecordId,
      personRecordId,
      planId: subscription.planId,
      status: subscription.status,
      deliveryCadence: subscription.deliveryCadence,
      priceCents: subscription.priceCents,
      currency: subscription.currency,
      billingInterval: subscription.billingInterval,
      periodStart: subscription.periodStart,
      periodEnd: subscription.periodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      canceledAt: subscription.canceledAt,
      startedOn: subscription.startedOn,
    });
    notes.push(...built.notes);

    const matches = await query(
      input.client,
      report,
      ATTIO_SLUGS.objects.subscriptions,
      stripeSubscriptionFilter(subscription.stripeSubscriptionId),
    );
    if (matches.length > 1) {
      throw new Error(
        `multiple Attio subscriptions matched ${subscription.stripeSubscriptionId}`,
      );
    }
    const existing = matches[0];
    if (!existing) {
      await commitAssert(
        input,
        writes,
        ATTIO_SLUGS.objects.subscriptions,
        ATTIO_SLUGS.subscription.stripeSubscriptionId,
        built.values,
      );
      report.summary.created += 1;
      continue;
    }

    const diff = differingValues(existing.values, built.values);
    if (Object.keys(diff).length === 0) {
      report.summary.unchanged += 1;
      continue;
    }
    await commitUpdate(
      input,
      writes,
      ATTIO_SLUGS.objects.subscriptions,
      existing.id.record_id,
      diff,
    );
    report.summary.updated += 1;
  }

  if (!input.dryRun && input.markSynced && !companyRecordId.startsWith(NEW_RECORD_PREFIX)) {
    await input.markSynced(business.id, companyRecordId);
  }

  return {
    businessId: business.id,
    domain,
    status: "synced",
    notes,
    writes,
    companyFlags: companyFlagValues(business.activity),
    companyFlagsWritten: writesIncludeCompanyFlags(writes),
  };
}

async function resolveCompany(
  input: { client: AttioClient; dryRun: boolean },
  business: CustomerBusiness,
  domain: string,
  report: SyncReport,
  writes: PlannedWrite[],
): Promise<string> {
  const matches = await query(
    input.client,
    report,
    ATTIO_SLUGS.objects.companies,
    companyDomainFilter(domain),
  );
  if (matches.length > 1) {
    throw new Error("multiple Attio companies matched this domain");
  }
  const existing = matches[0];
  const flags = business.activity ? buildCompanyFlagValues(business.activity) : null;
  if (!existing) {
    const recordId = await commitAssert(
      input,
      writes,
      ATTIO_SLUGS.objects.companies,
      ATTIO_SLUGS.company.domains,
      buildCompanyCreateValues(domain, business.name, business.activity),
    );
    report.summary.created += 1;
    return recordId;
  }

  if (!flags) {
    report.summary.unchanged += 1;
    return existing.id.record_id;
  }
  const diff = differingValues(existing.values, flags);
  if (Object.keys(diff).length === 0) {
    report.summary.unchanged += 1;
    return existing.id.record_id;
  }
  await commitUpdate(
    input,
    writes,
    ATTIO_SLUGS.objects.companies,
    existing.id.record_id,
    diff,
  );
  report.summary.updated += 1;
  return existing.id.record_id;
}

async function resolvePerson(
  input: { client: AttioClient; dryRun: boolean },
  business: CustomerBusiness,
  email: string,
  companyRecordId: string,
  report: SyncReport,
  writes: PlannedWrite[],
  notes: string[],
): Promise<string> {
  const matches = await query(
    input.client,
    report,
    ATTIO_SLUGS.objects.people,
    personEmailFilter(email),
  );
  if (matches.length > 1) {
    throw new Error("multiple Attio people matched this email");
  }
  const existing = matches[0];
  if (!existing) {
    const recordId = await commitAssert(
      input,
      writes,
      ATTIO_SLUGS.objects.people,
      ATTIO_SLUGS.person.emailAddresses,
      buildPersonCreateValues({
        email,
        fullName: business.ownerName,
        companyRecordId,
      }),
    );
    report.summary.created += 1;
    return recordId;
  }

  const linked = linkedRecordIds(existing.values, ATTIO_SLUGS.person.company);
  if (linked.length > 1) {
    const reason = "person company link has multiple values; left unchanged";
    notes.push(reason);
    report.summary.skipped.push({ subject: existing.id.record_id, reason });
    return existing.id.record_id;
  }
  if (linked.length === 0) {
    await commitUpdate(
      input,
      writes,
      ATTIO_SLUGS.objects.people,
      existing.id.record_id,
      buildPersonCompanyLink(companyRecordId),
    );
    report.summary.updated += 1;
    return existing.id.record_id;
  }
  if (linked[0] !== companyRecordId) {
    const reason = `person company link already set to ${linked[0]}; left unchanged`;
    notes.push(reason);
    report.summary.skipped.push({ subject: existing.id.record_id, reason });
    return existing.id.record_id;
  }
  report.summary.unchanged += 1;
  return existing.id.record_id;
}

async function query(
  client: AttioClient,
  report: SyncReport,
  object: string,
  filter: Record<string, unknown>,
): Promise<AttioRecord[]> {
  report.attioRecordQueries += 1;
  return client.queryRecords(object, filter);
}

async function commitAssert(
  input: { client: AttioClient; dryRun: boolean },
  writes: PlannedWrite[],
  object: string,
  matchingAttribute: string,
  values: AttioWriteValues,
): Promise<string> {
  const path = `/v2/objects/${object}/records?matching_attribute=${matchingAttribute}`;
  if (input.dryRun) {
    writes.push({ sent: false, method: "PUT", path, values });
    return `${NEW_RECORD_PREFIX}${object})`;
  }
  const record = await input.client.assertRecord(object, matchingAttribute, values);
  writes.push({ sent: true, method: "PUT", path, values });
  return record.id.record_id;
}

async function commitUpdate(
  input: { client: AttioClient; dryRun: boolean },
  writes: PlannedWrite[],
  object: string,
  recordId: string,
  values: AttioWriteValues,
): Promise<void> {
  const path = `/v2/objects/${object}/records/${recordId}`;
  if (input.dryRun) {
    writes.push({ sent: false, method: "PATCH", path, values });
    return;
  }
  await input.client.updateRecord(object, recordId, values);
  writes.push({ sent: true, method: "PATCH", path, values });
}

type BusinessRow = Pick<
  Database["public"]["Tables"]["businesses"]["Row"],
  "id" | "name" | "website_domain" | "owner_id"
>;
type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "email" | "full_name"
>;
type SubscriptionRow = Pick<
  Database["public"]["Tables"]["subscriptions"]["Row"],
  | "id"
  | "business_id"
  | "plan_id"
  | "status"
  | "stripe_subscription_id"
  | "current_period_start"
  | "current_period_end"
  | "cancel_at_period_end"
  | "canceled_at"
  | "created_at"
>;
type PlanRow = Pick<
  Database["public"]["Tables"]["plans"]["Row"],
  "id" | "price_cents" | "currency" | "delivery_cadence" | "billing_interval"
>;
type ActivityRow = Database["public"]["Views"]["member_activity"]["Row"];

export async function loadAttioSyncSnapshot(
  supabase: SupabaseClient<Database>,
): Promise<SyncSnapshot> {
  const { data: businessRows, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, website_domain, owner_id");
  throwIfError(businessError, "businesses select failed");

  const { data: subscriptionRows, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select(
      "id, business_id, plan_id, status, stripe_subscription_id, current_period_start, current_period_end, cancel_at_period_end, canceled_at, created_at",
    );
  throwIfError(subscriptionError, "subscriptions select failed");

  const { data: planRows, error: planError } = await supabase
    .from("plans")
    .select("id, price_cents, currency, delivery_cadence, billing_interval");
  throwIfError(planError, "plans select failed");

  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name");
  throwIfError(profileError, "profiles select failed");

  const businesses = (businessRows ?? []) as BusinessRow[];
  const subscriptions = (subscriptionRows ?? []) as SubscriptionRow[];
  const plans = new Map(
    ((planRows ?? []) as PlanRow[]).map((plan) => [plan.id, plan]),
  );
  const profiles = new Map(
    ((profileRows ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]),
  );

  const subscribedIds = [
    ...new Set(subscriptions.map((subscription) => subscription.business_id)),
  ];
  const activity = new Map<string, ActivitySnapshot>();
  if (subscribedIds.length > 0) {
    const { data: activityRows, error: activityError } = await supabase
      .from("member_activity")
      .select("business_id, traction, not_acting, poor_fit")
      .in("business_id", subscribedIds);
    throwIfError(activityError, "member_activity select failed");
    for (const row of (activityRows ?? []) as ActivityRow[]) {
      activity.set(row.business_id, toActivity(row));
    }
  }

  const subscriptionsByBusiness = new Map<string, SubscriptionSnapshot[]>();
  for (const subscription of subscriptions) {
    const plan = plans.get(subscription.plan_id) ?? null;
    const list = subscriptionsByBusiness.get(subscription.business_id) ?? [];
    list.push({
      id: subscription.id,
      stripeSubscriptionId: subscription.stripe_subscription_id,
      planId: subscription.plan_id,
      status: subscription.status,
      deliveryCadence: plan?.delivery_cadence ?? null,
      priceCents: plan?.price_cents ?? null,
      currency: plan?.currency ?? null,
      billingInterval: plan?.billing_interval ?? null,
      periodStart: subscription.current_period_start,
      periodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at,
      startedOn: subscription.created_at,
    });
    subscriptionsByBusiness.set(subscription.business_id, list);
  }

  return {
    businesses: businesses.map((business) => {
      const profile = profiles.get(business.owner_id) ?? null;
      return {
        id: business.id,
        name: business.name,
        websiteDomain: business.website_domain,
        ownerEmail: profile?.email ?? null,
        ownerName: profile?.full_name ?? null,
        subscriptions: subscriptionsByBusiness.get(business.id) ?? [],
        activity: activity.get(business.id) ?? null,
      };
    }),
  };
}

function toActivity(row: ActivityRow): ActivitySnapshot {
  return {
    traction: row.traction === true,
    notActing: row.not_acting === true,
    poorFit: row.poor_fit === true,
  };
}

export function nonRoutableDomainNote(domain: string): string | null {
  const host = domain.trim().toLowerCase().replace(/\.$/, "");
  if (host === "localhost" || host.endsWith(".localhost")) {
    return "skipped because website_domain is not routable (localhost)";
  }
  if (host.endsWith(".local")) {
    return "skipped because website_domain is not routable (.local)";
  }
  if (host.endsWith(".test")) {
    return "skipped because website_domain is not routable (.test)";
  }
  if (host.endsWith(".invalid")) {
    return "skipped because website_domain is not routable (.invalid)";
  }
  return null;
}

function companyFlagValues(activity: ActivitySnapshot | null): BusinessSyncResult["companyFlags"] {
  if (!activity) return null;
  return {
    shortlist_traction: activity.traction,
    shortlist_not_acting: activity.notActing,
    shortlist_poor_fit: activity.poorFit,
  };
}

function writesIncludeCompanyFlags(writes: PlannedWrite[]): boolean {
  const slugs = new Set<string>([
    ATTIO_SLUGS.company.traction,
    ATTIO_SLUGS.company.notActing,
    ATTIO_SLUGS.company.poorFit,
  ]);
  return writes.some((write) => Object.keys(write.values).some((slug) => slugs.has(slug)));
}

function recordSkip(
  report: SyncReport,
  business: CustomerBusiness,
  domain: string,
  reason: string,
): void {
  report.summary.skipped.push({ subject: `${business.id} (${domain})`, reason });
  report.businesses.push(skippedBusiness(business, domain, reason));
}

function skippedBusiness(
  business: CustomerBusiness,
  domain: string,
  note: string,
): BusinessSyncResult {
  return {
    businessId: business.id,
    domain,
    status: "skipped",
    notes: [note],
    writes: [],
    companyFlags: companyFlagValues(business.activity),
    companyFlagsWritten: false,
  };
}

function throwIfError(
  error: { message: string } | null,
  label: string,
): void {
  if (error) throw new Error(`${label}: ${error.message}`);
}

const FIXTURE_COMPANY_ID = "11111111-1111-4111-8111-111111111111";
const FIXTURE_OTHER_COMPANY_ID = "22222222-2222-4222-8222-222222222222";
const FIXTURE_PERSON_ID = "33333333-3333-4333-8333-333333333333";

/** In-memory Attio records for the dry-run fixture. No network and no database writes. */
export async function previewDryRunFixtures(): Promise<SyncReport> {
  const records: {
    object: string;
    recordId: string;
    values: AttioWriteValues;
  }[] = [
    {
      object: "companies",
      recordId: FIXTURE_COMPANY_ID,
      values: {
        domains: [{ domain: "fixture.example" }],
        name: [{ value: "Fixture Co" }],
      },
    },
    {
      object: "people",
      recordId: FIXTURE_PERSON_ID,
      values: {
        email_addresses: [{ email_address: "owner@fixture.example" }],
        company: [
          {
            target_object: "companies",
            target_record_id: FIXTURE_OTHER_COMPANY_ID,
          },
        ],
      },
    },
  ];

  const client: AttioClient = {
    async queryRecords(object, filter) {
      return records
        .filter((record) => record.object === object && fixtureMatches(record.values, filter))
        .map((record) => ({
          id: { record_id: record.recordId },
          values: record.values,
        }));
    },
    async assertRecord() {
      throw new Error("dry-run fixture must not write to Attio");
    },
    async updateRecord() {
      throw new Error("dry-run fixture must not write to Attio");
    },
  };

  return syncShortlistToAttio({
    client,
    dryRun: true,
    snapshot: {
      businesses: [
        {
          id: "fixture-business",
          name: "Fixture Co",
          websiteDomain: "fixture.example",
          ownerEmail: "owner@fixture.example",
          ownerName: "Fixture Owner",
          activity: { traction: true, notActing: false, poorFit: true },
          subscriptions: [
            {
              id: "fixture-monthly",
              stripeSubscriptionId: "sub_fixture_monthly",
              planId: "pro",
              status: "active",
              deliveryCadence: "weekly",
              priceCents: 9900,
              currency: "usd",
              billingInterval: "monthly",
              periodStart: "2026-10-01T00:00:00.000Z",
              periodEnd: "2026-11-01T00:00:00.000Z",
              cancelAtPeriodEnd: true,
              canceledAt: "2026-10-20T00:00:00.000Z",
              startedOn: "2026-09-01T00:00:00.000Z",
            },
            {
              id: "fixture-incomplete-expired",
              stripeSubscriptionId: "sub_fixture_incomplete_expired",
              planId: "starter",
              status: "incomplete_expired",
              deliveryCadence: "monthly",
              priceCents: 7900,
              currency: "usd",
              billingInterval: "monthly",
              periodStart: "2026-08-01T00:00:00.000Z",
              periodEnd: "2026-09-01T00:00:00.000Z",
              cancelAtPeriodEnd: false,
              canceledAt: "2026-08-15T00:00:00.000Z",
              startedOn: "2026-08-01T00:00:00.000Z",
            },
          ],
        },
      ],
    },
  });
}

function fixtureMatches(
  values: AttioWriteValues,
  filter: Record<string, unknown>,
): boolean {
  const domains = filter.domains as { domain?: { $eq?: string } } | undefined;
  if (domains?.domain?.$eq) {
    return (values.domains ?? []).some((entry) => {
      const domain = (entry as { domain?: string }).domain;
      return domain?.toLowerCase() === domains.domain?.$eq?.toLowerCase();
    });
  }
  const emails = filter.email_addresses as
    | { email_address?: { $eq?: string } }
    | undefined;
  if (emails?.email_address?.$eq) {
    return (values.email_addresses ?? []).some((entry) => {
      const email = (entry as { email_address?: string }).email_address;
      return email?.toLowerCase() === emails.email_address?.$eq?.toLowerCase();
    });
  }
  const stripe = filter.stripe_subscription_id as { value?: { $eq?: string } } | undefined;
  if (stripe?.value && "$eq" in stripe.value) {
    return (values.stripe_subscription_id ?? []).some((entry) => {
      return (entry as { value?: string }).value === stripe.value?.$eq;
    });
  }
  return false;
}
