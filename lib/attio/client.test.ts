import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AttioError, createAttioClient } from "./client";

describe("Attio client", () => {
  it("retries a 429 using Retry-After and does not put the key in the error", async () => {
    const secret = "attio-test-key";
    let calls = 0;
    const fetchImpl: typeof fetch = async (_input, init) => {
      calls += 1;
      const headers = new Headers(init?.headers);
      assert.equal(headers.get("authorization"), `Bearer ${secret}`);
      if (calls === 1) {
        return new Response(JSON.stringify({ message: `nope ${secret}` }), {
          status: 429,
          headers: { "retry-after": "0" },
        });
      }
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    };

    const client = createAttioClient(secret, fetchImpl);
    const records = await client.queryRecords("companies", {
      domains: { domain: { $eq: "missing.example" } },
    });
    assert.deepEqual(records, []);
    assert.equal(calls, 2);

    const failing: typeof fetch = async () =>
      new Response(JSON.stringify({ code: "unauthorized", message: secret }), {
        status: 403,
      });
    await assert.rejects(
      () => createAttioClient(secret, failing).queryRecords("companies", {}),
      (error: unknown) => {
        assert.ok(error instanceof AttioError);
        assert.equal(error.message.includes(secret), false);
        assert.match(error.message, /\[redacted\]/);
        return true;
      },
    );
  });
});
