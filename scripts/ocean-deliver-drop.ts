/**
 * CLI wrapper around deliverFirstDrop.
 *
 * Usage:
 *   pnpm ocean:deliver -- --email user@example.com --seeds stripe.com,notion.so
 */
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv, resetServerEnvCacheForTests } from "@/lib/env";
import {
  deliverFirstDrop,
  resolveCustomerByEmail,
} from "@/lib/shortlist/deliver-first-drop";
import type { Database } from "@/lib/supabase/database.types";

loadEnv({ path: ".env.local", override: true });
loadEnv({ override: false });

type CliArgs = {
  email: string;
  seeds: string[];
};

function parseArgs(argv: string[]): CliArgs {
  let email = "";
  const seeds: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--email") {
      email = (argv[++i] ?? "").trim().toLowerCase();
      continue;
    }
    if (arg === "--seeds") {
      const value = argv[++i] ?? "";
      seeds.push(
        ...value
          .split(",")
          .map((part) => part.trim().toLowerCase())
          .filter(Boolean),
      );
    }
  }
  if (!email.includes("@")) {
    throw new Error("--email user@example.com is required");
  }
  if (seeds.length < 2 || seeds.length > 3) {
    throw new Error("--seeds requires 2–3 domains");
  }
  return { email, seeds };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  resetServerEnvCacheForTests();
  const env = getServerEnv();
  const client = createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  console.log("1) Resolve customer…", args.email);
  const customer = await resolveCustomerByEmail(client, args.email);
  console.log(`   business=${customer.businessId}`);

  console.log("2) Deliver first drop…");
  const result = await deliverFirstDrop(client, {
    businessId: customer.businessId,
    audienceId: customer.audienceId,
    seeds: args.seeds,
    oceanToken: env.OCEAN_API_TOKEN,
  });

  console.log("\n=== Deliver report ===");
  console.log(JSON.stringify({ email: args.email, seeds: args.seeds, ...result }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
