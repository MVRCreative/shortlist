import type { SupabaseClient } from "@supabase/supabase-js";
import type { Digest } from "@/lib/shortlist/schemas";
import type { Database, Json } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

type Snapshot = {
  company?: {
    name?: string;
    domain?: string;
    industry?: string | null;
    employeeRange?: string | null;
    region?: string | null;
  };
  contact?: {
    fullName?: string;
    title?: string | null;
    linkedinUrl?: string | null;
    email?: string | null;
  } | null;
  signal?: { title?: string; type?: string } | null;
};

function asSnapshot(raw: Json): Snapshot {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as Snapshot;
}

function placeholderLinkedIn(name: string, company: string): string {
  const q = encodeURIComponent(`${name} ${company}`);
  return `https://www.linkedin.com/search/results/all/?keywords=${q}`;
}

/**
 * Loads the latest delivered drop for the authenticated member and maps it
 * into the existing Digest UI shape. Tenant-scoped via RLS (my_business_id).
 */
export async function loadDigestForUser(client: Client): Promise<{
  digest: Digest | null;
  dropId: string | null;
  deliveredCount: number;
}> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return { digest: null, dropId: null, deliveredCount: 0 };
  }

  const { data: business, error: businessError } = await client
    .from("businesses")
    .select("id, name, services")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (businessError) {
    throw new Error(businessError.message);
  }
  if (!business) {
    return { digest: null, dropId: null, deliveredCount: 0 };
  }

  const { data: drop, error: dropError } = await client
    .from("drops")
    .select("id, delivered_count, shortfall, shortfall_note, delivered_at")
    .eq("business_id", business.id)
    .eq("status", "delivered")
    .order("delivered_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (dropError) throw new Error(dropError.message);
  if (!drop) {
    return { digest: null, dropId: null, deliveredCount: 0 };
  }

  const { data: accounts, error: accountsError } = await client
    .from("drop_accounts")
    .select(
      "id, position, fit_reason, outreach_angle, linkedin_message, snapshot",
    )
    .eq("drop_id", drop.id)
    .order("position", { ascending: true });
  if (accountsError) throw new Error(accountsError.message);

  const leads = (accounts ?? []).map((row) => {
    const snap = asSnapshot(row.snapshot);
    const companyName = snap.company?.name ?? "Unknown company";
    const domain = snap.company?.domain ?? "";
    const contactName = snap.contact?.fullName ?? "Decision-maker TBD";
    const title = snap.contact?.title ?? "Leadership";
    const linkedinUrl =
      snap.contact?.linkedinUrl && snap.contact.linkedinUrl.startsWith("http")
        ? snap.contact.linkedinUrl
        : placeholderLinkedIn(contactName, companyName);
    const email =
      typeof snap.contact?.email === "string" && snap.contact.email.includes("@")
        ? snap.contact.email
        : null;

    return {
      contactName,
      title,
      company: companyName,
      domain,
      email,
      linkedinUrl,
      signal: snap.signal?.title ?? "ICP lookalike match",
      angle: row.outreach_angle,
      message: row.linkedin_message,
    };
  });

  const studio = business.name ?? "your studio";
  const services = (business.services ?? []).slice(0, 2).join(" and ");
  const theme =
    drop.shortfall && drop.shortfall > 0
      ? `Strong matches this week (${leads.length})`
      : "Your Shortlist this week";

  const digest: Digest = {
    theme,
    leads,
    linkedinPost: {
      hook: `Most studios wait for referrals. ${studio} doesn't have to.`,
      body: [
        `This week we queued ${leads.length} accounts that look like your best-fit clients.`,
        services
          ? `Each one is a plausible buyer for ${services}.`
          : "Each one is ranked to your ICP.",
        "Open Shortlist, pick one, and send the draft note. Consistency beats volume.",
      ].join("\n\n"),
    },
    xPost: `New Shortlist drop: ${leads.length} accounts worth a note this week. Who to contact, why, and what to say — without the research slog.`,
    blogIdea: {
      title: "How we pick who to contact next",
      angle:
        "A short explanation of lookalike + ICP matching for studio founders building an outbound habit.",
      outline: [
        "Start from customers you already love",
        "Filter by size, region, and buyer role",
        "Prefer dated signals when they exist",
        "Ship a small weekly list, not a database",
        "Track replies, not vanity metrics",
      ],
    },
  };

  return {
    digest,
    dropId: drop.id,
    deliveredCount: leads.length,
  };
}
