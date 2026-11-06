/**
 * Server-only Attio HTTP client. Never import this from a client component.
 * The API key is sent as a Bearer token and is never written into errors.
 */

import type { AttioWriteValues } from "@/lib/attio/mapping";

const ATTIO_BASE_URL = "https://api.attio.com/v2";
const MAX_ATTEMPTS = 4;

export class AttioError extends Error {
  readonly status: number;
  readonly path: string;

  constructor(status: number, path: string, message: string) {
    super(`Attio ${status} ${path}: ${message}`);
    this.name = "AttioError";
    this.status = status;
    this.path = path;
  }
}

export type AttioRecord = {
  id: { record_id: string };
  values: Record<string, unknown>;
};

export type AttioClient = {
  queryRecords(
    object: string,
    filter: Record<string, unknown>,
  ): Promise<AttioRecord[]>;
  assertRecord(
    object: string,
    matchingAttribute: string,
    values: AttioWriteValues,
  ): Promise<AttioRecord>;
  updateRecord(
    object: string,
    recordId: string,
    values: AttioWriteValues,
  ): Promise<AttioRecord>;
};

export function createAttioClient(
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): AttioClient {
  const token = apiKey.trim();
  if (!token) throw new Error("ATTIO_API_KEY is required");

  async function request(
    method: "GET" | "POST" | "PUT" | "PATCH",
    path: string,
    body?: unknown,
  ): Promise<unknown> {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const response = await fetchImpl(`${ATTIO_BASE_URL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      if (response.status === 429 && attempt < MAX_ATTEMPTS) {
        await sleep(retryDelayMs(response.headers.get("retry-after"), attempt));
        continue;
      }

      const text = await response.text();
      let parsed: unknown = null;
      if (text) {
        try {
          parsed = JSON.parse(text) as unknown;
        } catch {
          parsed = null;
        }
      }

      if (!response.ok) {
        throw new AttioError(
          response.status,
          path,
          redact(errorMessage(parsed, text), token),
        );
      }

      return parsed;
    }

    throw new AttioError(429, path, "rate limit retries exhausted");
  }

  return {
    async queryRecords(object, filter) {
      const slug = assertSlug(object);
      const body = await request("POST", `/objects/${slug}/records/query`, {
        filter,
        limit: 2,
      });
      return readRecords(body, `/objects/${slug}/records/query`);
    },
    async assertRecord(object, matchingAttribute, values) {
      const slug = assertSlug(object);
      const attribute = assertSlug(matchingAttribute);
      const path = `/objects/${slug}/records?matching_attribute=${encodeURIComponent(attribute)}`;
      const body = await request("PUT", path, { data: { values } });
      return readRecord(body, path);
    },
    async updateRecord(object, recordId, values) {
      const slug = assertSlug(object);
      const id = assertRecordId(recordId);
      const path = `/objects/${slug}/records/${id}`;
      const body = await request("PATCH", path, { data: { values } });
      return readRecord(body, path);
    },
  };
}

function assertSlug(value: string): string {
  if (!/^[a-z0-9_]+$/.test(value)) {
    throw new Error("invalid Attio slug");
  }
  return value;
}

function assertRecordId(value: string): string {
  if (!/^[0-9a-f-]{36}$/i.test(value)) {
    throw new Error("invalid Attio record id");
  }
  return value;
}

function errorMessage(parsed: unknown, text: string): string {
  if (parsed && typeof parsed === "object") {
    const body = parsed as { code?: unknown; message?: unknown };
    const parts = [body.code, body.message].filter(
      (part): part is string => typeof part === "string" && part.length > 0,
    );
    if (parts.length > 0) return parts.join(": ");
  }
  return text.slice(0, 300) || "empty error response";
}

function redact(message: string, apiKey: string): string {
  if (!apiKey) return message;
  return message.split(apiKey).join("[redacted]");
}

function retryDelayMs(retryAfter: string | null, attempt: number): number {
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(seconds * 1000, 120_000);
    }
    const date = Date.parse(retryAfter);
    if (!Number.isNaN(date)) {
      return Math.min(Math.max(0, date - Date.now()), 120_000);
    }
  }
  return Math.min(1000 * 2 ** (attempt - 1), 120_000);
}

function readRecords(body: unknown, path: string): AttioRecord[] {
  if (!body || typeof body !== "object" || !("data" in body)) {
    throw new AttioError(200, path, "response missing data");
  }
  const data = (body as { data: unknown }).data;
  if (!Array.isArray(data)) {
    throw new AttioError(200, path, "response data is not a list");
  }
  return data.map((item) => readRecord({ data: item }, path));
}

function readRecord(body: unknown, path: string): AttioRecord {
  if (!body || typeof body !== "object" || !("data" in body)) {
    throw new AttioError(200, path, "response missing data");
  }
  const data = (body as { data: unknown }).data;
  if (!data || typeof data !== "object") {
    throw new AttioError(200, path, "response missing record");
  }
  const id = (data as { id?: unknown }).id;
  const recordId =
    id && typeof id === "object"
      ? (id as { record_id?: unknown }).record_id
      : null;
  if (typeof recordId !== "string" || recordId.length === 0) {
    throw new AttioError(200, path, "response missing record_id");
  }
  const values = (data as { values?: unknown }).values;
  return {
    id: { record_id: recordId },
    values:
      values && typeof values === "object"
        ? (values as Record<string, unknown>)
        : {},
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
