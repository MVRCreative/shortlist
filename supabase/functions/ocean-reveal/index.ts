import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type RevealResult = {
  personId: string;
  email?: {
    address?: string | null;
    status?: string;
  };
};

type RevealPayload = {
  results?: RevealResult[];
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const secret = Deno.env.get("OCEAN_WEBHOOK_SECRET");
  if (!secret) {
    console.error("OCEAN_WEBHOOK_SECRET is not configured");
    return new Response(JSON.stringify({ error: "misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const provided = url.searchParams.get("secret");
  if (!provided || provided !== secret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Supabase service credentials missing");
    return new Response(JSON.stringify({ error: "misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: RevealPayload;
  try {
    payload = (await request.json()) as RevealPayload;
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results = payload.results ?? [];
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Acknowledge quickly; process updates before returning 2xx.
  for (const result of results) {
    const personId = result.personId;
    const status = result.email?.status ?? "notFound";
    const address = result.email?.address ?? null;

    const { data: contact, error: selectError } = await supabase
      .from("contacts")
      .select("id, raw")
      .eq("source", "ocean")
      .eq("source_id", personId)
      .maybeSingle();

    if (selectError) {
      console.error("contact select failed", selectError.message);
      continue;
    }
    if (!contact) {
      console.warn("no contact for personId", personId);
      continue;
    }

    const prev =
      contact.raw && typeof contact.raw === "object"
        ? (contact.raw as Record<string, unknown>)
        : {};

    if (status === "verified" && address) {
      const { error } = await supabase
        .from("contacts")
        .update({
          email: address,
          email_status: "verified",
          email_verified_at: new Date().toISOString(),
          raw: {
            ...prev,
            emailReveal: { status, address },
          },
        })
        .eq("id", contact.id);
      if (error) console.error("verified update failed", error.message);
    } else {
      // guessed / catchAll / notFound: keep out of contacts.email
      const { error } = await supabase
        .from("contacts")
        .update({
          raw: {
            ...prev,
            emailReveal: { status, address },
          },
        })
        .eq("id", contact.id);
      if (error) console.error("reveal raw update failed", error.message);
    }
  }

  return new Response(JSON.stringify({ ok: true, processed: results.length }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
