// Public lookup of registrant by token + kind. Returns minimal info for berkas form.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function maskWa(n: string): string {
  const digits = (n || "").replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  return digits.slice(0, 3) + "•".repeat(Math.max(0, digits.length - 6)) + digits.slice(-3);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const kind = body?.kind;
    const tokenRaw = typeof body?.token === "string" ? body.token.trim().toUpperCase() : "";
    const emailRaw = typeof body?.email === "string" ? body.email.trim() : "";

    if (kind !== "prestasi" && kind !== "ekonomi" && kind !== "umum" && kind !== "yatim") {
      return new Response(JSON.stringify({ ok: false, error: "invalid_kind" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!tokenRaw && !emailRaw) {
      return new Response(JSON.stringify({ ok: false, error: "missing_input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let q = supabase
      .from("registrations")
      .select("id, full_name, email, whatsapp, school_name, education_level, gender, birth_place, birth_date, address, grade, token, fast_track, payment_status, payment_url, extra")
      .eq("kind", kind)
      .order("created_at", { ascending: false })
      .limit(1);

    if (tokenRaw) {
      // Validate token format softly: prefix + 6 chars
      const validFmt = /^(PK|KP)-(PRE|EKO|UMU|YAT)-[A-Z0-9]{4,10}$/.test(tokenRaw);
      if (!validFmt) {
        return new Response(JSON.stringify({ ok: false, error: "invalid_token_format" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      q = q.eq("token", tokenRaw);
    } else {
      if (!emailRaw.includes("@")) {
        return new Response(JSON.stringify({ ok: false, error: "invalid_email" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      q = q.ilike("email", emailRaw);
    }

    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    if (!data) {
      return new Response(JSON.stringify({ ok: false, error: "not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({
      ok: true,
      data: {
        id: data.id,
        full_name: data.full_name,
        email: data.email,
        whatsapp: maskWa(data.whatsapp || ""),
        school_name: data.school_name,
        education_level: data.education_level,
        gender: data.gender,
        birth_place: data.birth_place,
        birth_date: data.birth_date,
        address: data.address,
        grade: data.grade,
        token: data.token,
        fast_track: !!data.fast_track,
        payment_status: (data as { payment_status?: string | null }).payment_status ?? null,
        payment_url: (data as { payment_url?: string | null }).payment_url ?? null,
        essay_submitted: !!((data as { extra?: Record<string, unknown> }).extra as Record<string, unknown> | undefined)?.essay_submitted_at,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
