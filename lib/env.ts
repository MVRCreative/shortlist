import { z } from "zod";

const serverEnvSchema = z.object({
  OCEAN_API_TOKEN: z.string().min(1, "OCEAN_API_TOKEN is required"),
  OCEAN_WEBHOOK_BASE_URL: z
    .string()
    .url("OCEAN_WEBHOOK_BASE_URL must be a valid URL"),
  OCEAN_WEBHOOK_SECRET: z.string().min(16, "OCEAN_WEBHOOK_SECRET is required"),
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url()
    .optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

/** Parse server-only secrets. Never import this from client components. */
export function getServerEnv(
  source: NodeJS.ProcessEnv = process.env,
): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid server environment: ${details}`);
  }
  cached = parsed.data;
  return cached;
}

export function resetServerEnvCacheForTests(): void {
  cached = null;
}
