import { z } from "zod";

const publicSupabaseSchema = z.object({
  url: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  publishableKey: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY (or PUBLISHABLE_KEY) is required"),
});

export type PublicSupabaseEnv = z.infer<typeof publicSupabaseSchema>;

/** URL and publishable/anon key for cookie-backed Supabase clients. */
export function getPublicSupabaseEnv(
  source: NodeJS.ProcessEnv = process.env,
): PublicSupabaseEnv {
  const parsed = publicSupabaseSchema.safeParse({
    url: source.NEXT_PUBLIC_SUPABASE_URL ?? source.SUPABASE_URL,
    publishableKey:
      source.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      source.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid Supabase environment: ${details}`);
  }
  return parsed.data;
}
