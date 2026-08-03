// Create Mayar invoice for voluntary donation
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Body = {
  name: string;
  email: string;
  whatsapp?: string;
  amount: number;
  registration_id?: string | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = (await req.json()) as Body;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Validate
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const whatsapp = String(body.whatsapp || "").trim();
    const amount = Math.floor(Number(body.amount));
    if (name.length < 2) return json({ ok: false, error: "Nama tidak valid" }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: "Email tidak valid" }, 400);
    if (!Number.isFinite(amount) || amount < 1000) return json({ ok: false, error: "Jumlah donasi tidak valid" }, 400);

    // Load donation + mayar config
    const [{ data: donRow }, { data: mayarRow }] = await Promise.all([
      supabase.from("site_settings").select("value").eq("key", "donation").maybeSingle(),
      supabase.from("site_settings").select("value").eq("key", "mayar_config").maybeSingle(),
    ]);
    const don = (donRow?.value ?? {}) as { enabled?: boolean; min_amount?: number; max_amount?: number; title?: string };
    const mayar = (mayarRow?.value ?? {}) as { api_key?: string; mode?: "live" | "sandbox"; redirect_url?: string };

    if (don.enabled === false) return json({ ok: false, error: "Donasi sedang dinonaktifkan" }, 400);
    if (don.min_amount && amount < don.min_amount) return json({ ok: false, error: `Minimal donasi Rp${don.min_amount.toLocaleString("id-ID")}` }, 400);
    if (don.max_amount && amount > don.max_amount) return json({ ok: false, error: `Maksimal donasi Rp${don.max_amount.toLocaleString("id-ID")}` }, 400);
    if (!mayar.api_key) return json({ ok: false, error: "Integrasi Mayar belum dikonfigurasi admin" }, 400);

    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    const redirectUrl = mayar.redirect_url || (origin ? `${origin.replace(/\/$/, "")}/donasi/terima-kasih` : "https://example.com/donasi/terima-kasih");

    // Insert donation row first to get our id
    const { data: inserted, error: insErr } = await supabase
      .from("donations")
      .insert({
        registration_id: body.registration_id ?? null,
        name,
        email,
        whatsapp: whatsapp || null,
        amount,
        status: "pending",
      })
      .select("id")
      .single();
    if (insErr || !inserted) throw new Error(insErr?.message || "Gagal menyimpan donasi");

    // Create Mayar invoice
    const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const description = don.title || "Donasi Sukarela — Prestasi Kita";
    const mayarBody = {
      name,
      email,
      amount,
      mobile: normalizeNumber(whatsapp) || "62800000000",
      redirectUrl,
      description,
      expiredAt,
      referenceId: inserted.id,
      items: [
        {
          name: description,
          quantity: 1,
          rate: amount,
          description,
        },
      ],
    };

    const mayarRes = await fetch("https://api.mayar.id/hl/v1/invoice/create", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mayar.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mayarBody),
    });

    let mayarJson: unknown = null;
    try { mayarJson = await mayarRes.json(); } catch { /* ignore */ }

    if (!mayarRes.ok) {
      await supabase.from("donations").update({ status: "failed" }).eq("id", inserted.id);
      console.error("Mayar error", mayarRes.status, mayarJson);
      const msg = (mayarJson as { messages?: string; message?: string } | null)?.messages
        || (mayarJson as { message?: string } | null)?.message
        || `Mayar API ${mayarRes.status}`;
      return json({ ok: false, error: msg }, 400);
    }

    const data = (mayarJson as { data?: { id?: string; link?: string; transaction_id?: string } } | null)?.data ?? {};
    const link = data.link || "";
    const invoiceId = data.id || data.transaction_id || null;

    if (!link) {
      await supabase.from("donations").update({ status: "failed" }).eq("id", inserted.id);
      return json({ ok: false, error: "Mayar tidak mengembalikan link pembayaran" }, 502);
    }

    await supabase
      .from("donations")
      .update({ mayar_invoice_id: invoiceId, mayar_link: link })
      .eq("id", inserted.id);

    return json({ ok: true, link, id: inserted.id });
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeNumber(raw: string): string {
  let n = (raw || "").replace(/\D/g, "");
  if (!n) return "";
  if (n.startsWith("0")) n = "62" + n.slice(1);
  else if (n.startsWith("8")) n = "62" + n;
  return n;
}
