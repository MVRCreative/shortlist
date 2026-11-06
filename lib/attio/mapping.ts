/**
 * Shortlist → Attio field mapping.
 *
 * Slugs and option titles come from docs/attio-discovery.md (re-run 2026-10-27).
 * Do not add a slug that discovery did not return.
 */

export type AttioWriteValues = Record<string, unknown[]>;

export const ATTIO_SLUGS = {
  objects: {
    companies: "companies",
    people: "people",
    subscriptions: "subscriptions",
  },
  company: {
    domains: "domains",
    name: "name",
    traction: "shortlist_traction",
    notActing: "shortlist_not_acting",
    poorFit: "shortlist_poor_fit",
  },
  person: {
    emailAddresses: "email_addresses",
    name: "name",
    company: "company",
  },
  subscription: {
    stripeSubscriptionId: "stripe_subscription_id",
    company: "company",
    person: "person",
    plan: "plan",
    status: "status",
    mrr: "mrr",
    cadence: "cadence",
    periodStart: "period_start_2",
    periodEnd: "period_end",
    cancelAtPeriodEnd: "cancel_at_period_end",
    canceledOn: "canceled_on",
    startedOn: "started_on",
  },
} as const;

/** Company attributes discovery returned that this job must not write. */
export const NEVER_WRITE_SLUGS = ["company_mrr", "customer_since"] as const;

export type CompanyFlags = {
  traction: boolean;
  notActing: boolean;
  poorFit: boolean;
};

const PLAN_TITLES: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  growth: "Growth",
};

const STATUS_TITLES: Record<string, string> = {
  trialing: "Trialing",
  active: "Active",
  past_due: "Past due",
  canceled: "Canceled",
  incomplete: "Incomplete",
  incomplete_expired: "Incomplete expired",
  unpaid: "Unpaid",
  paused: "Paused",
};

const CADENCE_TITLES: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
};

const ZERO_MRR_STATUSES = new Set([
  "trialing",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "unpaid",
  "paused",
]);

export type MrrMapping =
  | { ok: true; currencyValue: number; currencyCode: string }
  | { ok: false; reason: string };

export function mapPlan(planId: string): string | null {
  return PLAN_TITLES[planId] ?? null;
}

export function mapStatus(status: string): string | null {
  return STATUS_TITLES[status] ?? null;
}

/** Maps `plans.delivery_cadence`, not `billing_interval`. */
export function mapCadence(cadence: string): string | null {
  return CADENCE_TITLES[cadence] ?? null;
}

export function mapMrr(input: {
  status: string;
  priceCents: number | null;
  currency: string | null;
  billingInterval: string | null;
}): MrrMapping {
  if (ZERO_MRR_STATUSES.has(input.status)) {
    return { ok: true, currencyValue: 0, currencyCode: "USD" };
  }
  if (input.status !== "active" && input.status !== "past_due") {
    return {
      ok: false,
      reason: `skipped MRR because status is ${input.status}`,
    };
  }
  if (
    input.priceCents === null ||
    input.currency === null ||
    input.billingInterval === null
  ) {
    return { ok: false, reason: "skipped MRR because the plan price is missing" };
  }
  if (input.billingInterval !== "monthly") {
    return {
      ok: false,
      reason: `skipped MRR because billing_interval is ${input.billingInterval}`,
    };
  }
  if (!Number.isInteger(input.priceCents) || input.priceCents < 0) {
    return {
      ok: false,
      reason: "skipped MRR because price_cents is not a non-negative integer",
    };
  }
  const currencyCode = input.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currencyCode)) {
    return {
      ok: false,
      reason: "skipped MRR because currency is not a 3-letter code",
    };
  }
  return {
    ok: true,
    currencyValue: input.priceCents / 100,
    currencyCode,
  };
}

/** Calendar date in UTC. An offset near local midnight can fall on the next UTC day. */
export function toAttioDate(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function companyDomainFilter(domain: string): Record<string, unknown> {
  return { domains: { domain: { $eq: domain } } };
}

export function personEmailFilter(email: string): Record<string, unknown> {
  return { email_addresses: { email_address: { $eq: email } } };
}

export function stripeSubscriptionFilter(
  stripeSubscriptionId: string,
): Record<string, unknown> {
  return {
    stripe_subscription_id: { value: { $eq: stripeSubscriptionId } },
  };
}

export function assertAllowedWrite(
  object: "companies" | "people" | "subscriptions",
  values: AttioWriteValues,
  mode: "create" | "update",
): void {
  for (const slug of Object.keys(values)) {
    if ((NEVER_WRITE_SLUGS as readonly string[]).includes(slug)) {
      throw new Error(`refusing to write ${slug}`);
    }
  }
  if (object === "companies" && mode === "update") {
    if (ATTIO_SLUGS.company.domains in values) {
      throw new Error("refusing to replace company domains");
    }
    if (ATTIO_SLUGS.company.name in values) {
      throw new Error("refusing to replace company name");
    }
  }
  if (object === "people" && mode === "update") {
    if (ATTIO_SLUGS.person.emailAddresses in values) {
      throw new Error("refusing to replace person email addresses");
    }
    if (ATTIO_SLUGS.person.name in values) {
      throw new Error("refusing to replace person name");
    }
  }
}

export function buildCompanyCreateValues(
  domain: string,
  name: string | null,
  flags: CompanyFlags | null = null,
): AttioWriteValues {
  const values: AttioWriteValues = {
    [ATTIO_SLUGS.company.domains]: [{ domain }],
  };
  const trimmed = name?.trim();
  if (trimmed) {
    values[ATTIO_SLUGS.company.name] = [{ value: trimmed }];
  }
  if (flags) Object.assign(values, buildCompanyFlagValues(flags));
  assertAllowedWrite("companies", values, "create");
  return values;
}

/** The only Company fields this job writes, besides domain and name on create. */
export function buildCompanyFlagValues(flags: CompanyFlags): AttioWriteValues {
  const slugs = ATTIO_SLUGS.company;
  const values: AttioWriteValues = {
    [slugs.traction]: [{ value: flags.traction }],
    [slugs.notActing]: [{ value: flags.notActing }],
    [slugs.poorFit]: [{ value: flags.poorFit }],
  };
  assertAllowedWrite("companies", values, "update");
  return values;
}

export function buildPersonCreateValues(input: {
  email: string;
  fullName: string | null;
  companyRecordId: string;
}): AttioWriteValues {
  const values: AttioWriteValues = {
    [ATTIO_SLUGS.person.emailAddresses]: [{ email_address: input.email }],
    [ATTIO_SLUGS.person.company]: [
      {
        target_object: ATTIO_SLUGS.objects.companies,
        target_record_id: input.companyRecordId,
      },
    ],
  };
  const name = personalName(input.fullName);
  if (name) values[ATTIO_SLUGS.person.name] = name;
  assertAllowedWrite("people", values, "create");
  return values;
}

export function buildPersonCompanyLink(
  companyRecordId: string,
): AttioWriteValues {
  const values: AttioWriteValues = {
    [ATTIO_SLUGS.person.company]: [
      {
        target_object: ATTIO_SLUGS.objects.companies,
        target_record_id: companyRecordId,
      },
    ],
  };
  assertAllowedWrite("people", values, "update");
  return values;
}

export type SubscriptionWriteInput = {
  stripeSubscriptionId: string;
  companyRecordId: string;
  personRecordId: string | null;
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

export function buildSubscriptionValues(input: SubscriptionWriteInput): {
  values: AttioWriteValues;
  notes: string[];
} {
  const notes: string[] = [];
  const slugs = ATTIO_SLUGS.subscription;
  const values: AttioWriteValues = {
    [slugs.stripeSubscriptionId]: [{ value: input.stripeSubscriptionId }],
    [slugs.company]: [
      {
        target_object: ATTIO_SLUGS.objects.companies,
        target_record_id: input.companyRecordId,
      },
    ],
  };
  if (input.personRecordId) {
    values[slugs.person] = [
      {
        target_object: ATTIO_SLUGS.objects.people,
        target_record_id: input.personRecordId,
      },
    ];
  }

  const plan = mapPlan(input.planId);
  if (!plan) notes.push(`unmapped plan_id ${input.planId}`);
  else values[slugs.plan] = [{ option: plan }];

  const status = mapStatus(input.status);
  if (!status) notes.push(`unmapped status ${input.status}; no Attio option`);
  else values[slugs.status] = [{ option: status }];

  if (!input.deliveryCadence) {
    notes.push("skipped cadence because the plan has no delivery_cadence");
  } else {
    const cadence = mapCadence(input.deliveryCadence);
    if (!cadence) notes.push(`unmapped delivery_cadence ${input.deliveryCadence}`);
    else values[slugs.cadence] = [{ option: cadence }];
  }

  const mrr = mapMrr({
    status: input.status,
    priceCents: input.priceCents,
    currency: input.currency,
    billingInterval: input.billingInterval,
  });
  if (!mrr.ok) notes.push(mrr.reason);
  else {
    values[slugs.mrr] = [
      { currency_value: mrr.currencyValue, currency_code: mrr.currencyCode },
    ];
  }

  if (input.periodStart) {
    const day = toAttioDate(input.periodStart);
    if (day) values[slugs.periodStart] = [{ value: day }];
    else notes.push("skipped period start because the timestamp is invalid");
  }
  if (input.periodEnd) {
    const day = toAttioDate(input.periodEnd);
    if (day) values[slugs.periodEnd] = [{ value: day }];
    else notes.push("skipped period end because the timestamp is invalid");
  }

  values[slugs.cancelAtPeriodEnd] = [{ value: input.cancelAtPeriodEnd }];
  if (input.canceledAt) {
    const day = toAttioDate(input.canceledAt);
    if (day) values[slugs.canceledOn] = [{ value: day }];
    else notes.push("skipped Canceled on because the timestamp is invalid");
  }
  if (input.startedOn) {
    const day = toAttioDate(input.startedOn);
    if (day) values[slugs.startedOn] = [{ value: day }];
    else notes.push("skipped Started on because the timestamp is invalid");
  } else {
    notes.push("skipped Started on because created_at is missing");
  }

  assertAllowedWrite("subscriptions", values, "create");
  return { values, notes };
}

type AttioEntry = Record<string, unknown>;

function activeEntries(value: unknown): AttioEntry[] {
  if (!Array.isArray(value)) return [];
  const entries: AttioEntry[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const entry = item as AttioEntry;
    if ("active_until" in entry && entry.active_until != null) continue;
    entries.push(entry);
  }
  return entries;
}

function selectTitle(entry: AttioEntry): string | null {
  const option = entry.option;
  if (typeof option === "string") return option;
  if (option && typeof option === "object" && "title" in option) {
    const title = (option as { title?: unknown }).title;
    return typeof title === "string" ? title : null;
  }
  return null;
}

function entrySignature(entry: AttioEntry): string | null {
  if ("option" in entry) return `option:${selectTitle(entry) ?? ""}`;
  if ("currency_value" in entry) {
    const raw = entry.currency_value;
    const value =
      typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
    const code =
      typeof entry.currency_code === "string"
        ? entry.currency_code.toUpperCase()
        : "";
    if (!Number.isFinite(value) || !code) return null;
    return `currency:${code}:${value.toFixed(4)}`;
  }
  if ("target_record_id" in entry) {
    return typeof entry.target_record_id === "string"
      ? `record:${entry.target_record_id}`
      : null;
  }
  if ("domain" in entry && typeof entry.domain === "string") {
    return `domain:${entry.domain.toLowerCase()}`;
  }
  if ("email_address" in entry && typeof entry.email_address === "string") {
    return `email:${entry.email_address.toLowerCase()}`;
  }
  if ("value" in entry) {
    if (typeof entry.value === "string") {
      const normalized = /^\d{4}-\d{2}-\d{2}(?:T|$)/.test(entry.value)
        ? entry.value.slice(0, 10)
        : entry.value;
      return `value:${normalized}`;
    }
    if (typeof entry.value === "boolean") return `bool:${entry.value}`;
    if (typeof entry.value === "number") return `num:${entry.value}`;
  }
  return null;
}

function valuesMatch(existingValue: unknown, desiredEntries: unknown[]): boolean {
  const existing = activeEntries(existingValue);
  const desired = desiredEntries.filter(
    (item): item is AttioEntry => !!item && typeof item === "object",
  );
  if (existing.length !== desired.length) return false;
  for (let index = 0; index < desired.length; index += 1) {
    const current = existing[index];
    const next = desired[index];
    if (!current || !next) return false;
    const left = entrySignature(current);
    const right = entrySignature(next);
    if (left === null || left !== right) return false;
  }
  return true;
}

/**
 * Slugs in `desired` whose normalized value differs from the Attio record.
 * Extra existing slugs, including company_mrr and customer_since, are ignored.
 * Select titles, currency amounts, UTC dates, and checkbox booleans are compared
 * after normalization, so a read-shaped record can match a write payload.
 */
export function differingValues(
  existingValues: Record<string, unknown> | undefined,
  desired: AttioWriteValues,
): AttioWriteValues {
  const diff: AttioWriteValues = {};
  for (const [slug, desiredEntries] of Object.entries(desired)) {
    if (!valuesMatch(existingValues?.[slug], desiredEntries)) {
      diff[slug] = desiredEntries;
    }
  }
  return diff;
}

/** True when every slug in `desired` already matches. Extra existing slugs are ignored. */
export function managedValuesMatch(
  existingValues: Record<string, unknown> | undefined,
  desired: AttioWriteValues,
): boolean {
  return Object.keys(differingValues(existingValues, desired)).length === 0;
}

export function linkedRecordIds(
  values: Record<string, unknown> | undefined,
  slug: string,
): string[] {
  const ids: string[] = [];
  for (const entry of activeEntries(values?.[slug])) {
    if (typeof entry.target_record_id === "string") {
      ids.push(entry.target_record_id);
    }
  }
  return ids;
}

function personalName(fullName: string | null): unknown[] | null {
  const trimmed = fullName?.trim().replace(/\s+/g, " ") ?? "";
  if (!trimmed) return null;
  const space = trimmed.indexOf(" ");
  if (space === -1) {
    // Object syntax requires first_name, last_name, and full_name. A single
    // name has no last name, so send the string form. Attio stores that as
    // the first name and we never send an empty last_name.
    return [trimmed];
  }
  const firstName = trimmed.slice(0, space).trim();
  const lastName = trimmed.slice(space + 1).trim();
  if (!firstName || !lastName) return [trimmed];
  return [{ first_name: firstName, last_name: lastName }];
}
