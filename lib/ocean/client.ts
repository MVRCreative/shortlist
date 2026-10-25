import {
  creditTotal,
  flattenOceanIndustryLabels,
  oceanCompanySearchResponseSchema,
  oceanCreditBalanceSchema,
  oceanDataFieldsSchema,
  oceanPeopleSearchResponseSchema,
  oceanRevealEmailsResponseSchema,
  type OceanCompanySearchResponse,
  type OceanCreditBalance,
  type OceanPeopleSearchResponse,
} from "@/lib/ocean/schemas";

const OCEAN_BASE_URL = "https://api.ocean.io";
const MAX_429_RETRIES = 2;

export class OceanApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "OceanApiError";
  }
}

export type OceanRequestMeta = {
  endpoint: string;
  statusCode: number;
  durationMs: number;
  creditsUsed: number | null;
  error: string | null;
};

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  onMeta?: (meta: OceanRequestMeta) => void | Promise<void>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class OceanClient {
  constructor(private readonly apiToken: string) {}

  private async request<T>(
    endpoint: string,
    parse: (json: unknown) => T,
    options: RequestOptions = {},
  ): Promise<T> {
    const method = options.method ?? "GET";
    let attempt = 0;

    while (true) {
      const started = Date.now();
      let statusCode = 0;
      let creditsUsed: number | null = null;
      let error: string | null = null;
      let json: unknown = null;

      try {
        const response = await fetch(`${OCEAN_BASE_URL}${endpoint}`, {
          method,
          headers: {
            "X-Api-Token": this.apiToken,
            Accept: "application/json",
            ...(method === "POST"
              ? { "Content-Type": "application/json" }
              : {}),
          },
          body: method === "POST" ? JSON.stringify(options.body ?? {}) : undefined,
        });

        statusCode = response.status;
        const text = await response.text();
        json = text ? JSON.parse(text) : null;

        if (
          json &&
          typeof json === "object" &&
          "creditsUsed" in json &&
          typeof (json as { creditsUsed: unknown }).creditsUsed === "number"
        ) {
          creditsUsed = (json as { creditsUsed: number }).creditsUsed;
        }

        if (response.status === 429 && attempt < MAX_429_RETRIES) {
          const retryAfterHeader = response.headers.get("Retry-After");
          const retryAfterSeconds = retryAfterHeader
            ? Number.parseInt(retryAfterHeader, 10)
            : Number.NaN;
          const waitMs = Number.isFinite(retryAfterSeconds)
            ? retryAfterSeconds * 1000
            : 1000 * 2 ** attempt;
          attempt += 1;
          error = `rate_limited_retry_${attempt}`;
          await options.onMeta?.({
            endpoint,
            statusCode,
            durationMs: Date.now() - started,
            creditsUsed,
            error,
          });
          await sleep(waitMs);
          continue;
        }

        if (response.status === 402) {
          error =
            typeof json === "object" &&
            json &&
            "detail" in json &&
            typeof (json as { detail: unknown }).detail === "string"
              ? (json as { detail: string }).detail
              : "Insufficient credits";
          await options.onMeta?.({
            endpoint,
            statusCode,
            durationMs: Date.now() - started,
            creditsUsed,
            error,
          });
          throw new OceanApiError(error, 402, json);
        }

        if (!response.ok) {
          const detail =
            typeof json === "object" &&
            json &&
            "detail" in json &&
            typeof (json as { detail: unknown }).detail === "string"
              ? (json as { detail: string }).detail
              : `Ocean request failed with ${response.status}`;
          error = detail;
          await options.onMeta?.({
            endpoint,
            statusCode,
            durationMs: Date.now() - started,
            creditsUsed,
            error,
          });
          throw new OceanApiError(detail, response.status, json);
        }

        const parsed = parse(json);
        await options.onMeta?.({
          endpoint,
          statusCode,
          durationMs: Date.now() - started,
          creditsUsed,
          error: null,
        });
        return parsed;
      } catch (err) {
        if (err instanceof OceanApiError) throw err;
        error = err instanceof Error ? err.message : "unknown_fetch_error";
        await options.onMeta?.({
          endpoint,
          statusCode: statusCode || 0,
          durationMs: Date.now() - started,
          creditsUsed,
          error,
        });
        throw err;
      }
    }
  }

  getCreditBalance(
    onMeta?: RequestOptions["onMeta"],
  ): Promise<OceanCreditBalance> {
    return this.request(
      "/v2/credits/balance",
      (json) => oceanCreditBalanceSchema.parse(json),
      { onMeta },
    );
  }

  getDataFields(onMeta?: RequestOptions["onMeta"]): Promise<{
    industries: string[];
  }> {
    return this.request(
      "/v2/data-fields",
      (json) => {
        const parsed = oceanDataFieldsSchema.parse(json);
        return { industries: flattenOceanIndustryLabels(parsed.industries) };
      },
      { onMeta },
    );
  }

  searchCompanies(
    body: Record<string, unknown>,
    onMeta?: RequestOptions["onMeta"],
  ): Promise<OceanCompanySearchResponse> {
    return this.request(
      "/v3/search/companies",
      (json) => oceanCompanySearchResponseSchema.parse(json),
      { method: "POST", body, onMeta },
    );
  }

  searchPeople(
    body: Record<string, unknown>,
    onMeta?: RequestOptions["onMeta"],
  ): Promise<OceanPeopleSearchResponse> {
    return this.request(
      "/v3/search/people",
      (json) => oceanPeopleSearchResponseSchema.parse(json),
      { method: "POST", body, onMeta },
    );
  }

  revealEmails(
    personIds: string[],
    webhookUrl: string,
    onMeta?: RequestOptions["onMeta"],
  ): Promise<{ status: string }> {
    return this.request(
      "/v2/reveal/emails",
      (json) => oceanRevealEmailsResponseSchema.parse(json),
      {
        method: "POST",
        body: { personIds, webhookUrl },
        onMeta,
      },
    );
  }
}

export function assertEnoughCredits(balance: OceanCreditBalance): {
  companyCredits: number;
  emailCredits: number;
  dailyLeft: number | null;
  canReveal: boolean;
} {
  const companyCredits = creditTotal(balance.credits);
  const emailCredits = creditTotal(balance.emailCredits);
  const dailyLeft = balance.dailyLimitRateLeft ?? null;

  // Cap: 10 companies * 0.2 = 2.0, 1 person * 0.2 = 0.2 → need ≥ 2.2 company credits
  if (companyCredits < 2.2) {
    throw new Error(
      `Insufficient company credits for capped test (have ${companyCredits}, need ≥ 2.2)`,
    );
  }
  if (dailyLeft !== null && dailyLeft < 5) {
    throw new Error(
      `Daily request limit too low for capped test (have ${dailyLeft}, need ≥ 5)`,
    );
  }

  return {
    companyCredits,
    emailCredits,
    dailyLeft,
    // Reveal is optional when the account has no email credits — company path still runs.
    canReveal: emailCredits >= 1,
  };
}
