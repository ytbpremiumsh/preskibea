import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

/**
 * Rekonsiliasi pembayaran Fast Track / Fast Track Premium.
 * Menyapu semua pendaftar fast track yang masih "pending" lalu menanyakan
 * status sebenarnya ke Doku lewat fungsi check-payment-status.
 * Dipanggil manual dari dashboard admin, atau otomatis oleh cron.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    let days = 30;
    let limit = 200;
    try {
      const body = await req.json();
      if (body?.days) days = Math.min(365, Math.max(1, Number(body.days)));
      if (body?.limit) limit = Math.min(500, Math.max(1, Number(body.limit)));
    } catch (_) {
      // no body -> defaults (cron)
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: pending, error } = await supabaseAdmin
      .from("registrations")
      .select("token")
      .eq("fast_track", true)
      .or("payment_status.is.null,payment_status.neq.paid")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    const tokens = (pending ?? []).map((r) => r.token).filter(Boolean) as string[];
    let updated = 0;
    const fixed: string[] = [];

    // Batch kecil supaya tidak membanjiri API Doku
    for (let i = 0; i < tokens.length; i += 5) {
      const chunk = tokens.slice(i, i + 5);
      const results = await Promise.all(
        chunk.map(async (token) => {
          try {
            const { data } = await supabaseAdmin.functions.invoke("check-payment-status", {
              body: { token },
            });
            return { token, status: (data as any)?.status };
          } catch (e) {
            console.error("reconcile failed", token, (e as Error).message);
            return { token, status: "error" };
          }
        }),
      );
      for (const r of results) {
        if (r.status === "paid") {
          updated++;
          fixed.push(r.token);
        }
      }
    }

    console.log(`reconcile-payments: checked=${tokens.length} updated=${updated}`);
    return json({ checked: tokens.length, updated, fixed });
  } catch (e) {
    console.error("reconcile-payments error", (e as Error).message);
    return json({ error: (e as Error).message }, 500);
  }
});
