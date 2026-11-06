import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  NEVER_WRITE_SLUGS,
  assertAllowedWrite,
  buildCompanyCreateValues,
  buildPersonCompanyLink,
  buildPersonCreateValues,
  buildSubscriptionValues,
  differingValues,
  managedValuesMatch,
  mapCadence,
  mapMrr,
  mapPlan,
  mapStatus,
  toAttioDate,
} from "./mapping";

describe("Attio mapping", () => {
  it("maps plan, status, and delivery cadence onto discovered option titles", () => {
    assert.equal(mapPlan("starter"), "Starter");
    assert.equal(mapPlan("pro"), "Pro");
    assert.equal(mapPlan("growth"), "Growth");
    assert.equal(mapPlan("enterprise"), null);

    assert.equal(mapStatus("past_due"), "Past due");
    assert.equal(mapStatus("incomplete_expired"), "Incomplete expired");
    assert.equal(mapStatus("active"), "Active");

    assert.equal(mapCadence("weekly"), "Weekly");
    assert.equal(mapCadence("monthly"), "Monthly");
    assert.equal(mapCadence("yearly"), null);
  });

  it("writes monthly price for active and past_due, and 0 USD otherwise", () => {
    assert.deepEqual(
      mapMrr({
        status: "active",
        priceCents: 7900,
        currency: "usd",
        billingInterval: "monthly",
      }),
      { ok: true, currencyValue: 79, currencyCode: "USD" },
    );
    assert.deepEqual(
      mapMrr({
        status: "past_due",
        priceCents: 17900,
        currency: "usd",
        billingInterval: "monthly",
      }),
      { ok: true, currencyValue: 179, currencyCode: "USD" },
    );
    for (const status of [
      "trialing",
      "canceled",
      "incomplete",
      "incomplete_expired",
      "unpaid",
      "paused",
    ]) {
      assert.deepEqual(
        mapMrr({
          status,
          priceCents: 9900,
          currency: "usd",
          billingInterval: "yearly",
        }),
        { ok: true, currencyValue: 0, currencyCode: "USD" },
      );
    }
    const skipped = mapMrr({
      status: "active",
      priceCents: 9900,
      currency: "usd",
      billingInterval: "yearly",
    });
    assert.equal(skipped.ok, false);
  });

  it("converts date fields to the UTC calendar day near midnight", () => {
    assert.equal(toAttioDate("2026-10-02T00:30:00.000Z"), "2026-10-02");
    assert.equal(toAttioDate("2026-10-01T20:30:00-04:00"), "2026-10-02");
    const built = buildSubscriptionValues({
      stripeSubscriptionId: "sub_123",
      companyRecordId: "company-1",
      personRecordId: "person-1",
      planId: "pro",
      status: "canceled",
      deliveryCadence: "weekly",
      priceCents: 9900,
      currency: "usd",
      billingInterval: "monthly",
      periodStart: "2026-10-01T20:30:00-04:00",
      periodEnd: "2026-10-31T20:30:00-04:00",
      cancelAtPeriodEnd: true,
      canceledAt: "2026-10-01T23:30:00-04:00",
      startedOn: "2026-09-30T21:30:00-04:00",
    });
    assert.deepEqual(built.values.period_start_2, [{ value: "2026-10-02" }]);
    assert.deepEqual(built.values.period_end, [{ value: "2026-11-01" }]);
    assert.deepEqual(built.values.canceled_on, [{ value: "2026-10-02" }]);
    assert.deepEqual(built.values.started_on, [{ value: "2026-10-01" }]);
    assert.deepEqual(built.values.mrr, [{ currency_value: 0, currency_code: "USD" }]);
  });

  it("sends a single name as a string and never sends an empty last name", () => {
    const single = buildPersonCreateValues({
      email: "josh@revlo.io",
      fullName: "Josh",
      companyRecordId: "company-1",
    });
    assert.deepEqual(single.name, ["Josh"]);

    const both = buildPersonCreateValues({
      email: "ada@acme.com",
      fullName: "Ada Lovelace",
      companyRecordId: "company-1",
    });
    assert.deepEqual(both.name, [{ first_name: "Ada", last_name: "Lovelace" }]);
    assert.equal("full_name" in (both.name?.[0] as object), false);
  });

  it("writes 0 MRR for incomplete_expired even when billing is yearly", () => {
    const built = buildSubscriptionValues({
      stripeSubscriptionId: "sub_123",
      companyRecordId: "company-1",
      personRecordId: "person-1",
      planId: "pro",
      status: "incomplete_expired",
      deliveryCadence: "weekly",
      priceCents: 9900,
      currency: "usd",
      billingInterval: "yearly",
      periodStart: "2026-10-01T15:00:00.000Z",
      periodEnd: "2026-11-01T15:00:00.000Z",
      cancelAtPeriodEnd: true,
      canceledAt: "2026-10-20T00:00:00.000Z",
      startedOn: "2026-09-01T00:00:00.000Z",
    });

    assert.deepEqual(built.values.mrr, [{ currency_value: 0, currency_code: "USD" }]);
    assert.equal(
      (built.values.status?.[0] as { option: string }).option,
      "Incomplete expired",
    );
    assert.equal(
      built.values.cadence?.[0] && (built.values.cadence[0] as { option: string }).option,
      "Weekly",
    );
    assert.deepEqual(built.values.cancel_at_period_end, [{ value: true }]);
    assert.deepEqual(built.values.canceled_on, [{ value: "2026-10-20" }]);
    assert.deepEqual(built.values.started_on, [{ value: "2026-09-01" }]);
    assert.deepEqual(built.values.period_start_2, [{ value: "2026-10-01" }]);
    for (const slug of NEVER_WRITE_SLUGS) {
      assert.equal(slug in built.values, false);
    }
    assert.equal(
      built.notes.some((note) => note.includes("billing_interval")),
      false,
    );
  });

  it("treats a read-shaped Attio record as unchanged when the write matches", () => {
    const desired = buildSubscriptionValues({
      stripeSubscriptionId: "sub_123",
      companyRecordId: "company-1",
      personRecordId: "person-1",
      planId: "starter",
      status: "active",
      deliveryCadence: "monthly",
      priceCents: 7900,
      currency: "usd",
      billingInterval: "monthly",
      periodStart: "2026-10-01T00:00:00.000Z",
      periodEnd: "2026-11-01T00:00:00.000Z",
      cancelAtPeriodEnd: false,
      canceledAt: null,
      startedOn: "2026-09-01T00:00:00.000Z",
    }).values;

    const existing: Record<string, unknown[]> = {
      plan: [{ option: { title: "Starter" }, active_until: null }],
      status: [{ option: { title: "Active" } }],
      cadence: [{ option: { title: "Monthly" } }],
      mrr: [{ currency_value: 79, currency_code: "USD" }],
      period_start_2: [{ value: "2026-10-01" }],
      period_end: [{ value: "2026-11-01" }],
      cancel_at_period_end: [{ value: false }],
      started_on: [{ value: "2026-09-01" }],
      stripe_subscription_id: [{ value: "sub_123" }],
      company: [{ target_record_id: "company-1", target_object: "companies" }],
      person: [{ target_record_id: "person-1", target_object: "people" }],
      company_mrr: [{ currency_value: 10, currency_code: "USD" }],
    };

    assert.equal(managedValuesMatch(existing, desired), true);
    assert.deepEqual(differingValues(existing, desired), {});
    existing.plan = [{ option: { title: "Pro" } }];
    assert.equal(managedValuesMatch(existing, desired), false);
    assert.deepEqual(Object.keys(differingValues(existing, desired)), ["plan"]);
  });

  it("normalizes select, currency, date, and checkbox values before diffing", () => {
    const desired = buildSubscriptionValues({
      stripeSubscriptionId: "sub_123",
      companyRecordId: "company-1",
      personRecordId: "person-1",
      planId: "starter",
      status: "past_due",
      deliveryCadence: "monthly",
      priceCents: 7900,
      currency: "usd",
      billingInterval: "monthly",
      periodStart: "2026-10-01T20:30:00-04:00",
      periodEnd: "2026-11-01T00:00:00.000Z",
      cancelAtPeriodEnd: false,
      canceledAt: null,
      startedOn: "2026-09-01T00:00:00.000Z",
    }).values;

    const existing: Record<string, unknown[]> = {
      plan: [{ option: { title: "Starter" } }],
      status: [{ option: { title: "Active" } }],
      cadence: [{ option: { title: "Monthly" } }],
      mrr: [{ currency_value: "79.0000", currency_code: "usd" }],
      period_start_2: [{ value: "2026-10-02T00:00:00.000Z" }],
      period_end: [{ value: "2026-11-01" }],
      cancel_at_period_end: [{ value: false }],
      started_on: [{ value: "2026-09-01" }],
      stripe_subscription_id: [{ value: "sub_123" }],
      company: [{ target_record_id: "company-1" }],
      person: [{ target_record_id: "person-1" }],
      company_mrr: [{ currency_value: 10, currency_code: "USD" }],
    };

    assert.deepEqual(differingValues(existing, desired), {
      status: [{ option: "Past due" }],
    });
  });

  it("refuses domain, email, and company MRR replacement", () => {
    assert.doesNotThrow(() =>
      assertAllowedWrite("companies", buildCompanyCreateValues("acme.com", "Acme"), "create"),
    );
    assert.throws(
      () => assertAllowedWrite("companies", { domains: [{ domain: "acme.com" }] }, "update"),
      /domains/,
    );
    assert.throws(
      () =>
        assertAllowedWrite(
          "people",
          { email_addresses: [{ email_address: "a@acme.com" }] },
          "update",
        ),
      /email/,
    );
    assert.throws(
      () => assertAllowedWrite("companies", { company_mrr: [{ currency_value: 1 }] }, "update"),
      /company_mrr/,
    );
    const link = buildPersonCompanyLink("company-1");
    assert.deepEqual(Object.keys(link), ["company"]);
  });
});
