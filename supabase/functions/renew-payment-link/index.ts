// Buat ulang link pembayaran Fast Track ketika link lama expired
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function normalizeNumber(raw: string): string {
  let n = (raw || "").replace(/\D/g, "");
  if (!n) return "";
  if (n.startsWith("0")) n = "62" + n.slice(1);
  else if (n.startsWith("8")) n = "62" + n;
  return n;
}

const sanitize = (s: string, max = 100) =>
  (s || "")
    .replace(/[^a-zA-Z0-9.\-/+,=_:'@%() ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

async function hmacB64(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { token } = await req.json();
    if (!token) return json({ error: "token required" }, 400);

    const { data: reg } = await supabaseAdmin
      .from("registrations")
      .select("id, token, full_name, email, whatsapp, address, kind, fast_track, payment_status, extra")
      .eq("token", token)
      .maybeSingle();

    if (!reg) return json({ error: "Pendaftaran tidak ditemukan" }, 404);
    if (!reg.fast_track) return json({ error: "Pendaftaran ini bukan Fast Track" }, 400);
    if (reg.payment_status === "paid") return json({ status: "paid" });

    const extra = (reg.extra ?? {}) as Record<string, unknown>;

    const { data: settings } = await supabaseAdmin
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "payment_provider",
        "mayar_config",
        "aulaa_config",
        "doku_config",
        "fast_track_fee",
        "fast_track_premium_fee",
      ]);

    const rawProvider = settings?.find((s) => s.key === "payment_provider")?.value as unknown;
    const provider = (
      typeof rawProvider === "string" ? rawProvider : (rawProvider as any)?.provider ?? ""
    ).toString().replace(/["\s]/g, "").toLowerCase() || "doku";

    const isPremium = extra.fast_track_type === "premium";
    const feeKey = isPremium ? "fast_track_premium_fee" : "fast_track_fee";
    const feeSetting = settings?.find((s) => s.key === feeKey)?.value;
    const amount = feeSetting ? Number(feeSetting) : (isPremium ? 35000 : 15000);

    const originHeader = req.headers.get("origin") || req.headers.get("referer") || "";
    let cleanOrigin = "";
    try {
      if (originHeader) cleanOrigin = new URL(originHeader).origin;
    } catch {
      cleanOrigin = originHeader.split("?")[0].replace(/\/$/, "");
    }
    const baseSite = cleanOrigin || "https://preskibea.lovable.app";
    const redirectUrl =
      `${baseSite}/pendaftaran/sukses?token=${reg.token}&name=${encodeURIComponent(reg.full_name)}` +
      `&email=${encodeURIComponent(reg.email)}&whatsapp=${encodeURIComponent(reg.whatsapp ?? "")}&kind=${reg.kind}`;

    // Nomor invoice baru unik, tetap bisa dipetakan ke token asal (suffix -Rn)
    const attempt = Number(extra.payment_retry ?? 0) + 1;
    const invoiceNumber = `${reg.token}-R${attempt}`;

    let link: string | null = null;
    const newExtra: Record<string, unknown> = { ...extra, payment_retry: attempt };

    if (provider === "mayar") {
      const cfg = settings?.find((s) => s.key === "mayar_config")?.value as { api_key?: string };
      if (!cfg?.api_key) return json({ error: "Konfigurasi pembayaran belum lengkap" }, 400);
      const description = "Biaya Pendaftaran Jalur Fast Track Batch #8";
      const res = await fetch("https://api.mayar.id/hl/v1/invoice/create", {
        method: "POST",
        headers: { Authorization: `Bearer ${cfg.api_key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reg.full_name,
          email: reg.email,
          mobile: normalizeNumber(reg.whatsapp ?? "") || "62800000000",
          redirectUrl,
          description,
          expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          items: [{ quantity: 1, rate: amount, description }],
          extraData: { noCustomer: reg.token, idProd: "FAST_TRACK_BATCH_8" },
        }),
      });
      const body = await res.json().catch(() => null);
      link = body?.data?.link ?? null;
      if (link) newExtra.mayar_invoice_id = body?.data?.id;
    } else if (provider === "aulaa") {
      const cfg = settings?.find((s) => s.key === "aulaa_config")?.value as any;
      if (!cfg?.api_key) return json({ error: "Konfigurasi pembayaran belum lengkap" }, 400);
      const payload: Record<string, unknown> = { order_id: invoiceNumber, amount };
      if (cfg?.qris_only) payload.payment_method = "qris";
      const res = await fetch("https://api.aulaa.co/v1/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${cfg.api_key}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => null);
      const paymentId = body?.id;
      if (paymentId) {
        link = `https://payment.aulaa.co/pay/${paymentId}`;
        newExtra.aulaa_payment_id = paymentId;
      }
    } else {
      const rawDoku = settings?.find((s) => s.key === "doku_config")?.value as any;
      const cfg = rawDoku
        ? {
            ...rawDoku,
            client_id: String(rawDoku.client_id ?? "").trim(),
            secret_key: String(rawDoku.secret_key ?? "").trim(),
          }
        : null;
      if (!cfg?.client_id || !cfg?.secret_key) {
        return json({ error: "Konfigurasi pembayaran belum lengkap" }, 400);
      }

      const dokuBody = {
        order: {
          amount,
          invoice_number: invoiceNumber,
          currency: "IDR",
          callback_url: `${baseSite}/pendaftaran/sukses`,
          line_items: [{ name: "Pendaftaran Fast Track Batch 8", price: amount, quantity: 1 }],
        },
        payment: { payment_due_date: 60 },
        customer: {
          name: sanitize(reg.full_name, 100) || "Pendaftar",
          email: reg.email,
          phone: normalizeNumber(reg.whatsapp ?? "") || "62800000000",
          address: sanitize((reg as any).address ?? "", 200) || "-",
        },
      };

      const bodyString = JSON.stringify(dokuBody);
      const digestBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(bodyString));
      const digest = btoa(String.fromCharCode(...new Uint8Array(digestBuffer)));
      const requestId = crypto.randomUUID();
      const timestamp = new Date().toISOString().split(".")[0] + "Z";
      const target = "/checkout/v1/payment";
      const signature = `HMACSHA256=${await hmacB64(
        cfg.secret_key,
        `Client-Id:${cfg.client_id}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${target}\nDigest:${digest}`,
      )}`;
      const baseUrl = cfg.is_production ? "https://api.doku.com" : "https://api-sandbox.doku.com";

      const res = await fetch(`${baseUrl}${target}`, {
        method: "POST",
        headers: {
          "Client-Id": cfg.client_id,
          "Request-Id": requestId,
          "Request-Timestamp": timestamp,
          Signature: signature,
          Digest: digest,
          "Content-Type": "application/json",
        },
        body: bodyString,
      });

      if (!res.ok) {
        console.error("Doku renew error:", await res.text());
        return json({ error: "Gagal membuat link pembayaran baru" }, 502);
      }
      const body = await res.json();
      link = body?.response?.payment?.url ?? null;
      if (link) newExtra.doku_invoice_number = invoiceNumber;
    }

    if (!link) return json({ error: "Gagal membuat link pembayaran baru" }, 502);

    await supabaseAdmin
      .from("registrations")
      .update({ payment_url: link, payment_status: "pending", extra: newExtra })
      .eq("id", reg.id);

    return json({ ok: true, payment_url: link, provider });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
