// Public status check by token
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function maskName(n: string): string {
  const parts = (n || "").trim().split(/\s+/);
  return parts.map((p) => (p.length <= 2 ? p : p[0] + "•".repeat(Math.max(1, p.length - 2)) + p[p.length - 1])).join(" ");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const tokenRaw = typeof body?.token === "string" ? body.token.trim().toUpperCase() : "";
    if (!/^(PK|KP)-(PRE|EKO|UMU|YAT)-[A-Z0-9]{4,10}$/.test(tokenRaw)) {
      return new Response(JSON.stringify({ ok: false, error: "invalid_token_format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: reg, error } = await supabase
      .from("registrations")
      .select("id, full_name, kind, status, candidate_status, created_at, fast_track, payment_status, extra")
      .eq("token", tokenRaw)
      .maybeSingle();
    if (error) throw error;
    if (!reg) {
      return new Response(JSON.stringify({ ok: false, error: "not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: docs } = await supabase
      .from("documents")
      .select("review_status")
      .eq("registration_id", reg.id);

    const docCount = docs?.length ?? 0;
    const pending = docs?.filter((d) => d.review_status === "pending").length ?? 0;
    const approved = docs?.filter((d) => d.review_status === "approved").length ?? 0;
    const rejected = docs?.filter((d) => d.review_status === "rejected").length ?? 0;

    const extra = ((reg as { extra?: Record<string, unknown> }).extra ?? {}) as Record<string, unknown>;
    const fastTrack = !!(reg as { fast_track?: boolean }).fast_track;
    const essaySubmittedAt = typeof extra.essay_submitted_at === "string" ? extra.essay_submitted_at : null;

    return new Response(JSON.stringify({
      ok: true,
      data: {
        full_name: maskName(reg.full_name || ""),
        kind: reg.kind,
        status: reg.status,
        candidate_status: reg.candidate_status,
        created_at: reg.created_at,
        token: tokenRaw,
        fast_track: fastTrack,
        payment_status: (reg as { payment_status?: string | null }).payment_status ?? null,
        essay_submitted: fastTrack || !!essaySubmittedAt,
        essay_submitted_at: essaySubmittedAt,
        docs: { total: docCount, pending, approved, rejected },
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
