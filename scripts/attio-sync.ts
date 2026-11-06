/**
 * Sync Shortlist customers to Attio.
 *
 *   pnpm attio:sync -- --dry-run
 *   pnpm attio:sync -- --live
 *   pnpm attio:sync -- --live --only <business_id>
 *
 * --dry-run reads Supabase and queries Attio. It does not PUT, PATCH, or update
 * businesses.attio_record_id or attio_synced_at.
 */
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

import { createAttioClient } from "@/lib/attio/client";
import { loadAttioSyncSnapshot, previewDryRunFixtures, syncShortlistToAttio } from "@/lib/attio/sync";
import type { Database } from "@/lib/supabase/database.types";

loadEnv({ path: ".env.local", override: true });
loadEnv({ override: false });

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function parseArgs(argv: string[]): { dryRun: boolean; only: string | null } {
  const dryRun = argv.includes("--dry-run");
  const live = argv.includes("--live");
  if (dryRun === live) {
    throw new Error("Pass exactly one of --dry-run or --live");
  }
  const onlyFlag = argv.indexOf("--only");
  if (onlyFlag === -1) return { dryRun, only: null };
  const only = argv[onlyFlag + 1]?.trim() ?? "";
  if (!only || only.startsWith("--")) {
    throw new Error("--only requires a business id");
  }
  return { dryRun, only };
}

async function main() {
  const { dryRun, only } = parseArgs(process.argv.slice(2));
  const supabase = createClient<Database>(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const client = createAttioClient(requireEnv("ATTIO_API_KEY"));
  const snapshot = await loadAttioSyncSnapshot(supabase);
  if (only && !snapshot.businesses.some((business) => business.id === only)) {
    throw new Error(`no business with id ${only}`);
  }
  const report = await syncShortlistToAttio({
    client,
    snapshot,
    dryRun,
    ...(only ? { onlyBusinessId: only } : {}),
    markSynced: dryRun
      ? undefined
      : async (businessId, attioRecordId) => {
          const { error } = await supabase
            .from("businesses")
            .update({
              attio_record_id: attioRecordId,
              attio_synced_at: new Date().toISOString(),
            })
            .eq("id", businessId);
          if (error) throw new Error(`businesses update failed: ${error.message}`);
        },
  });

  const fixtures = dryRun ? await previewDryRunFixtures() : null;
  console.log(JSON.stringify(dryRun ? { customers: report, fixtures } : report, null, 2));
  const results = [
    ...report.businesses,
    ...(fixtures?.businesses ?? []),
  ];
  if (results.some((business) => business.status === "error")) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Attio sync failed";
  console.error(message);
  process.exit(1);
});
