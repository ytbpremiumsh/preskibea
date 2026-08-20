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
      .select("id, full_name, kind, status, candidate_status, created_at, fast_track, payment_status, education_level, extra")
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
    const paymentStatus = (reg as { payment_status?: string | null }).payment_status ?? null;
    const fastPaid = fastTrack && paymentStatus === "paid";
    const essaySubmittedAt = typeof extra.essay_submitted_at === "string" ? extra.essay_submitted_at : null;
    const rawEssayStatus = typeof extra.essay_status === "string" ? extra.essay_status : null;

    // Auto lolos khusus jalur Reguler (toggle admin)
    const { data: autoRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "esai_auto_lolos_reguler")
      .maybeSingle();
    const autoCfg = (autoRow?.value ?? {}) as { enabled?: boolean };
    const essayAutoReguler = !!autoCfg.enabled && !fastTrack && !!essaySubmittedAt &&
      rawEssayStatus !== "rejected";

    const essayStatus = rawEssayStatus === "approved" || rawEssayStatus === "rejected"
      ? rawEssayStatus
      : fastPaid || essayAutoReguler
      ? "approved"
      : "pending";


    const { data: annRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "esai_announcement")
      .maybeSingle();
    const ann = (annRow?.value ?? {}) as { published?: boolean; message?: string };

    const { data: admAnnRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "administrasi_announcement")
      .maybeSingle();
    const admAnn = (admAnnRow?.value ?? {}) as { published?: boolean; message?: string };

    const { data: tpaAnnRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "tpa_announcement")
      .maybeSingle();
    const tpaAnn = (tpaAnnRow?.value ?? {}) as { published?: boolean; message?: string };

    const { data: itwAnnRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "interview_announcement")
      .maybeSingle();
    const itwAnn = (itwAnnRow?.value ?? {}) as { published?: boolean; message?: string };

    const norm = (v: unknown) =>
      v === "approved" || v === "rejected" ? (v as string) : "pending";
    const tpaStatus = norm(extra.tpa_status);
    const interviewStatus = norm(extra.interview_status);


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
        payment_status: paymentStatus,
        essay_submitted: fastPaid || !!essaySubmittedAt,

        essay_submitted_at: essaySubmittedAt,
        essay_status: essayStatus,
        essay_auto_reguler: essayAutoReguler,
        essay_announcement_published: !!ann.published,
        essay_announcement_message: ann.published ? (ann.message ?? null) : null,
        education_level: reg.education_level,
        admin_announcement_published: !!admAnn.published,
        admin_announcement_message: admAnn.published ? (admAnn.message ?? null) : null,
        tpa_status: tpaStatus,
        tpa_announcement_published: !!tpaAnn.published,
        tpa_announcement_message: tpaAnn.published ? (tpaAnn.message ?? null) : null,
        interview_status: interviewStatus,
        interview_announcement_published: !!itwAnn.published,
        interview_announcement_message: itwAnn.published ? (itwAnn.message ?? null) : null,
        docs: { total: docCount, pending, approved, rejected },
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
