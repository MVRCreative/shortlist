import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AttioClient, AttioRecord } from "./client";
import type { AttioWriteValues } from "./mapping";
import {
  type CustomerBusiness,
  previewDryRunFixtures,
  syncShortlistToAttio,
} from "./sync";

type Stored = {
  object: string;
  recordId: string;
  values: AttioWriteValues;
};

class FakeAttio implements AttioClient {
  records: Stored[] = [];
  asserts: { object: string; matchingAttribute: string; values: AttioWriteValues }[] = [];
  updates: { object: string; recordId: string; values: AttioWriteValues }[] = [];

  async queryRecords(object: string, filter: Record<string, unknown>): Promise<AttioRecord[]> {
    return this.records
      .filter((record) => record.object === object && matches(record.values, filter))
      .map((record) => toRecord(record));
  }

  async assertRecord(
    object: string,
    matchingAttribute: string,
    values: AttioWriteValues,
  ): Promise<AttioRecord> {
    this.asserts.push({ object, matchingAttribute, values });
    const existing = this.records.find(
      (record) => record.object === object && matches(record.values, filterFor(matchingAttribute, values)),
    );
    if (existing) {
      existing.values = { ...existing.values, ...values };
      return toRecord(existing);
    }
    const created: Stored = {
      object,
      recordId: `00000000-0000-4000-8000-${String(this.records.length + 1).padStart(12, "0")}`,
      values: { ...values },
    };
    this.records.push(created);
    return toRecord(created);
  }

  async updateRecord(
    object: string,
    recordId: string,
    values: AttioWriteValues,
  ): Promise<AttioRecord> {
    this.updates.push({ object, recordId, values });
    const existing = this.records.find(
      (record) => record.object === object && record.recordId === recordId,
    );
    if (!existing) throw new Error(`missing ${object} ${recordId}`);
    existing.values = { ...existing.values, ...values };
    return toRecord(existing);
  }
}

function business(overrides: Partial<CustomerBusiness> = {}): CustomerBusiness {
  return {
    id: "business-1",
    name: "Acme",
    websiteDomain: "acme.com",
    ownerEmail: "ada@acme.com",
    ownerName: "Ada Lovelace",
    activity: {
      traction: true,
      notActing: false,
      poorFit: false,
    },
    subscriptions: [
      {
        id: "sub-row-1",
        stripeSubscriptionId: "sub_123",
        planId: "pro",
        status: "active",
        deliveryCadence: "weekly",
        priceCents: 9900,
        currency: "usd",
        billingInterval: "monthly",
        periodStart: "2026-10-01T00:00:00.000Z",
        periodEnd: "2026-11-01T00:00:00.000Z",
        cancelAtPeriodEnd: false,
        canceledAt: null,
        startedOn: "2026-09-01T00:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

describe("Attio sync idempotency", () => {
  it("re-running does not create duplicates or replace domains and emails", async () => {
    const client = new FakeAttio();
    client.records.push({
      object: "companies",
      recordId: "00000000-0000-4000-8000-000000000010",
      values: {
        domains: [{ domain: "acme.com" }, { domain: "acme.org" }],
        name: [{ value: "Existing Acme" }],
      },
    });
    client.records.push({
      object: "people",
      recordId: "00000000-0000-4000-8000-000000000020",
      values: {
        email_addresses: [
          { email_address: "ada@acme.com" },
          { email_address: "ada.other@acme.com" },
        ],
      },
    });

    const snapshot = { businesses: [business()] };
    const marked: string[] = [];
    const first = await syncShortlistToAttio({
      client,
      snapshot,
      dryRun: false,
      markSynced: async (businessId) => {
        marked.push(businessId);
      },
    });
    assert.equal(first.businesses[0]?.status, "synced");
    assert.equal(client.asserts.length, 1);
    assert.equal(client.asserts[0]?.object, "subscriptions");
    assert.equal(client.updates.length, 2);
    const companyUpdate = client.updates.find((update) => update.object === "companies");
    assert.deepEqual(
      Object.keys(companyUpdate?.values ?? {}).sort(),
      ["shortlist_not_acting", "shortlist_poor_fit", "shortlist_traction"],
    );
    const personUpdate = client.updates.find((update) => update.object === "people");
    assert.deepEqual(Object.keys(personUpdate?.values ?? {}), ["company"]);
    assert.deepEqual(client.records[0]?.values.domains, [
      { domain: "acme.com" },
      { domain: "acme.org" },
    ]);
    assert.equal(client.records[1]?.values.email_addresses?.length, 2);
    assert.equal(marked.length, 1);

    const second = await syncShortlistToAttio({
      client,
      snapshot,
      dryRun: false,
      markSynced: async (businessId) => {
        marked.push(businessId);
      },
    });
    assert.equal(second.businesses[0]?.status, "synced");
    assert.equal(client.asserts.length, 1);
    assert.equal(client.updates.length, 2);
    assert.equal(client.records.length, 3);
    assert.equal(marked.length, 2);
    assert.equal(second.businesses[0]?.writes.length, 0);
    assert.equal(second.businesses[0]?.companyFlagsWritten, false);
    assert.equal(second.summary.created, 0);
    assert.equal(second.summary.updated, 0);
    assert.equal(second.summary.failed.length, 0);
  });

  it("writes only the one field that changed", async () => {
    const client = new FakeAttio();
    const snapshot = { businesses: [business()] };
    await syncShortlistToAttio({ client, snapshot, dryRun: false });
    client.asserts.length = 0;
    client.updates.length = 0;

    const current = snapshot.businesses[0]!;
    const subscription = current.subscriptions[0]!;
    const statusChange = await syncShortlistToAttio({
      client,
      dryRun: false,
      snapshot: {
        businesses: [
          business({
            subscriptions: [{ ...subscription, status: "past_due" }],
          }),
        ],
      },
    });
    assert.equal(client.asserts.length, 0);
    assert.equal(client.updates.length, 1);
    assert.equal(client.updates[0]?.object, "subscriptions");
    assert.deepEqual(client.updates[0]?.values, {
      status: [{ option: "Past due" }],
    });
    assert.equal(statusChange.summary.created, 0);
    assert.equal(statusChange.summary.updated, 1);
    assert.equal(statusChange.businesses[0]?.writes.length, 1);

    client.updates.length = 0;
    const flagChange = await syncShortlistToAttio({
      client,
      dryRun: false,
      snapshot: {
        businesses: [
          business({
            activity: { traction: false, notActing: false, poorFit: false },
            subscriptions: [{ ...subscription, status: "past_due" }],
          }),
        ],
      },
    });
    assert.equal(client.asserts.length, 0);
    assert.equal(client.updates.length, 1);
    assert.equal(client.updates[0]?.object, "companies");
    assert.deepEqual(client.updates[0]?.values, {
      shortlist_traction: [{ value: false }],
    });
    assert.equal(flagChange.summary.updated, 1);
    assert.equal(flagChange.summary.created, 0);

    client.updates.length = 0;
    const again = await syncShortlistToAttio({
      client,
      dryRun: false,
      snapshot: {
        businesses: [
          business({
            activity: { traction: false, notActing: false, poorFit: false },
            subscriptions: [{ ...subscription, status: "past_due" }],
          }),
        ],
      },
    });
    assert.equal(client.updates.length, 0);
    assert.equal(client.asserts.length, 0);
    assert.equal(again.summary.created, 0);
    assert.equal(again.summary.updated, 0);
    assert.equal(again.businesses[0]?.writes.length, 0);
  });

  it("does not stamp Supabase on a dry-run, and stamps only after a live success", async () => {
    const client = new FakeAttio();
    let dryStamps = 0;
    await syncShortlistToAttio({
      client,
      snapshot: { businesses: [business()] },
      dryRun: true,
      markSynced: async () => {
        dryStamps += 1;
      },
    });
    assert.equal(dryStamps, 0);
    assert.equal(client.asserts.length, 0);
    assert.equal(client.updates.length, 0);

    const live = new FakeAttio();
    const stamped: { businessId: string; recordId: string }[] = [];
    const success = await syncShortlistToAttio({
      client: live,
      snapshot: { businesses: [business()] },
      dryRun: false,
      markSynced: async (businessId, recordId) => {
        stamped.push({ businessId, recordId });
      },
    });
    assert.equal(success.businesses[0]?.status, "synced");
    assert.equal(stamped.length, 1);
    assert.equal(stamped[0]?.businessId, "business-1");
    assert.equal(
      stamped[0]?.recordId,
      live.records.find((record) => record.object === "companies")?.recordId,
    );

    const failing = new FakeAttio();
    failing.assertRecord = async () => {
      throw new Error("attio down");
    };
    const failedStamps: string[] = [];
    const failure = await syncShortlistToAttio({
      client: failing,
      snapshot: { businesses: [business({ id: "business-fail" })] },
      dryRun: false,
      markSynced: async (businessId) => {
        failedStamps.push(businessId);
      },
    });
    assert.equal(failure.businesses[0]?.status, "error");
    assert.deepEqual(failedStamps, []);
  });

  it("limits a run to one business without ignoring a shared domain", async () => {
    const client = new FakeAttio();
    const keep = business({ id: "keep", websiteDomain: "keep.example" });
    const other = business({
      id: "other",
      websiteDomain: "other.example",
      ownerEmail: "other@other.example",
    });
    const limited = await syncShortlistToAttio({
      client,
      snapshot: { businesses: [keep, other] },
      dryRun: true,
      onlyBusinessId: "keep",
    });
    assert.deepEqual(
      limited.businesses.map((result) => result.businessId),
      ["keep"],
    );

    const shared = await syncShortlistToAttio({
      client,
      snapshot: {
        businesses: [
          business({ id: "left" }),
          business({ id: "right", ownerEmail: "right@acme.com" }),
        ],
      },
      dryRun: true,
      onlyBusinessId: "left",
    });
    assert.equal(shared.businesses[0]?.status, "skipped");
    assert.equal(shared.attioRecordQueries, 0);
    assert.equal(shared.collisions.length, 1);
  });

  it("dry-run queries Attio and does not call write methods", async () => {
    const client = new FakeAttio();
    client.records.push(
      {
        object: "companies",
        recordId: "00000000-0000-4000-8000-000000000010",
        values: { domains: [{ domain: "acme.com" }, { domain: "acme.org" }] },
      },
      {
        object: "people",
        recordId: "00000000-0000-4000-8000-000000000020",
        values: {
          email_addresses: [
            { email_address: "ada@acme.com" },
            { email_address: "ada.other@acme.com" },
          ],
        },
      },
    );
    const report = await syncShortlistToAttio({
      client,
      snapshot: { businesses: [business()] },
      dryRun: true,
      markSynced: async () => {
        throw new Error("dry-run must not stamp attio_synced_at");
      },
    });

    assert.equal(client.asserts.length, 0);
    assert.equal(client.updates.length, 0);
    assert.equal(report.attioRecordQueries > 0, true);
    const writes = report.businesses[0]?.writes ?? [];
    assert.equal(writes.every((write) => write.sent === false), true);
    assert.equal(
      writes.some((write) => write.values.domains || write.values.email_addresses),
      false,
    );
    assert.equal(
      writes.some((write) => write.values.company_mrr || write.values.customer_since),
      false,
    );
    const personWrite = writes.find((write) => write.path.includes("/people/"));
    assert.ok(personWrite);
    assert.deepEqual(Object.keys(personWrite.values), ["company"]);
  });

  it("skips both businesses that share a domain and skips a null Stripe id", async () => {
    const client = new FakeAttio();
    const shared = business({ id: "business-1" });
    const other = business({
      id: "business-2",
      ownerEmail: "grace@other.com",
      subscriptions: [
        {
          ...shared.subscriptions[0]!,
          id: "sub-row-2",
          stripeSubscriptionId: null,
        },
      ],
    });
    const report = await syncShortlistToAttio({
      client,
      snapshot: { businesses: [shared, other] },
      dryRun: false,
    });

    assert.equal(client.asserts.length, 0);
    assert.equal(client.updates.length, 0);
    assert.equal(report.collisions.length, 1);
    assert.deepEqual(
      report.businesses.map((result) => result.status),
      ["skipped", "skipped"],
    );
  });

  it("skips non-routable domains without querying Attio", async () => {
    const client = new FakeAttio();
    const report = await syncShortlistToAttio({
      client,
      dryRun: true,
      snapshot: {
        businesses: [
          business({ websiteDomain: "shortlist.local" }),
          business({ id: "business-2", websiteDomain: "localhost", ownerEmail: "a@localhost" }),
        ],
      },
    });
    assert.equal(client.asserts.length, 0);
    assert.equal(report.attioRecordQueries, 0);
    assert.deepEqual(
      report.businesses.map((result) => result.status),
      ["skipped", "skipped"],
    );
    assert.match(report.businesses[0]?.notes[0] ?? "", /\.local/);
    assert.equal(report.businesses.some((result) => result.status === "error"), false);
  });

  it("prints fixture subscription payloads and leaves a conflicting company link", async () => {
    const report = await previewDryRunFixtures();
    const business = report.businesses[0];
    assert.equal(business?.status, "synced");
    assert.match(business?.notes.join(" ") ?? "", /left unchanged/);
    assert.equal(
      business?.writes.some((write) => write.path.includes("/people/")),
      false,
    );
    const subscriptions = (business?.writes ?? []).filter((write) =>
      write.path.includes("/subscriptions/"),
    );
    assert.equal(subscriptions.length, 2);
    for (const write of subscriptions) {
      assert.equal(write.sent, false);
      assert.equal(write.method, "PUT");
      for (const slug of [
        "plan",
        "status",
        "mrr",
        "cadence",
        "period_start_2",
        "period_end",
        "cancel_at_period_end",
        "canceled_on",
        "started_on",
        "company",
        "person",
      ]) {
        assert.equal(slug in write.values, true, slug);
      }
    }
    const flags = business?.writes.find((write) => write.path.includes("/companies/"));
    assert.deepEqual(flags?.values.shortlist_traction, [{ value: true }]);
    assert.deepEqual(flags?.values.shortlist_not_acting, [{ value: false }]);
    assert.deepEqual(flags?.values.shortlist_poor_fit, [{ value: true }]);
    assert.equal(flags?.values.domains, undefined);
    const expired = subscriptions.find((write) =>
      JSON.stringify(write.values.stripe_subscription_id).includes("incomplete_expired"),
    );
    assert.equal(
      (expired?.values.status?.[0] as { option: string }).option,
      "Incomplete expired",
    );
  });
});

function toRecord(record: Stored): AttioRecord {
  const values: Record<string, unknown> = {};
  for (const [slug, entries] of Object.entries(record.values)) {
    values[slug] = entries.map((entry) => {
      if (!entry || typeof entry !== "object") return entry;
      const value = entry as Record<string, unknown>;
      if (typeof value.option === "string") {
        return { ...value, option: { title: value.option } };
      }
      return value;
    });
  }
  return { id: { record_id: record.recordId }, values };
}

function filterFor(matchingAttribute: string, values: AttioWriteValues): Record<string, unknown> {
  if (matchingAttribute === "domains") {
    const domain = (values.domains?.[0] as { domain?: string } | undefined)?.domain;
    return { domains: { domain: { $eq: domain } } };
  }
  if (matchingAttribute === "email_addresses") {
    const email = (values.email_addresses?.[0] as { email_address?: string } | undefined)
      ?.email_address;
    return { email_addresses: { email_address: { $eq: email } } };
  }
  if (matchingAttribute === "stripe_subscription_id") {
    const id = (values.stripe_subscription_id?.[0] as { value?: string } | undefined)?.value;
    return { stripe_subscription_id: { value: { $eq: id } } };
  }
  throw new Error(`unexpected matching attribute ${matchingAttribute}`);
}

function matches(values: AttioWriteValues, filter: Record<string, unknown>): boolean {
  const domains = filter.domains as { domain?: { $eq?: string } } | undefined;
  if (domains?.domain?.$eq) {
    const wanted = domains.domain.$eq.toLowerCase();
    return (values.domains ?? []).some((entry) => {
      const domain = (entry as { domain?: string }).domain;
      return domain?.toLowerCase() === wanted;
    });
  }
  const emails = filter.email_addresses as
    | { email_address?: { $eq?: string } }
    | undefined;
  if (emails?.email_address?.$eq) {
    const wanted = emails.email_address.$eq.toLowerCase();
    return (values.email_addresses ?? []).some((entry) => {
      const email = (entry as { email_address?: string }).email_address;
      return email?.toLowerCase() === wanted;
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
