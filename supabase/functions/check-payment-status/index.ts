import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

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

async function hmacBase64(secret: string, payload: string) {
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

async function sendTelegramPaymentNotification(
  registration: {
    full_name: string;
    email: string;
    whatsapp: string;
    token: string;
  },
  amount: number,
) {
  const { data: setting, error: settingError } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "telegram_config")
    .maybeSingle();

  if (settingError) throw new Error(`Gagal membaca pengaturan Telegram: ${settingError.message}`);

  const config = setting?.value as {
    enabled?: boolean;
    bot_token?: string;
    chat_id?: string;
    template?: string;
  } | null;

  if (!config?.enabled) {
    console.log("Telegram notification skipped: integration disabled");
    return;
  }
  if (!config.bot_token || !config.chat_id) {
    throw new Error("Konfigurasi Telegram belum lengkap");
  }

  const variables: Record<string, string> = {
    nama: registration.full_name || "-",
    email: registration.email || "-",
    whatsapp: registration.whatsapp || "-",
    token: registration.token || "-",
    nominal: new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount),
    provider: "DOKU",
    tanggal: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
  };

  let message = config.template || "Pembayaran Masuk: {nama} - {nominal}";
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }

  const response = await fetch(
    `https://api.telegram.org/bot${config.bot_token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: config.chat_id, text: message }),
    },
  );
  const responseBody = await response.text();
  if (!response.ok) {
    throw new Error(`Telegram API gagal [${response.status}]: ${responseBody}`);
  }
  console.log(`Telegram payment notification sent for ${registration.token}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { token } = await req.json();
    if (!token) return json({ error: "token required" }, 400);

    const { data: reg } = await supabaseAdmin
      .from("registrations")
      .select("id, token, full_name, email, whatsapp, kind, payment_status, fast_track, extra")
      .eq("token", token)
      .maybeSingle();

    if (!reg) return json({ status: "not_found" }, 404);
    const alreadyNotified = (reg.extra as any)?.telegram_notified === true;
    if (reg.payment_status === "paid" && alreadyNotified) return json({ status: "paid" });


    // Ask Doku directly (fallback when webhook is delayed / not delivered)
    const { data: settings } = await supabaseAdmin
      .from("site_settings")
      .select("key, value")
      .in("key", ["doku_config"]);

    const cfg = settings?.find((s) => s.key === "doku_config")?.value as any;
    if (!cfg?.client_id || !cfg?.secret_key) return json({ status: reg.payment_status || "pending" });

    const baseUrl = cfg.is_production ? "https://api.doku.com" : "https://api-sandbox.doku.com";
    const target = `/orders/v1/status/${token}`;
    const requestId = crypto.randomUUID();
    const timestamp = new Date().toISOString().slice(0, 19) + "Z";
    const signaturePayload =
      `Client-Id:${cfg.client_id}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${target}`;
    const signature = `HMACSHA256=${await hmacBase64(cfg.secret_key, signaturePayload)}`;

    const res = await fetch(`${baseUrl}${target}`, {
      method: "GET",
      headers: {
        "Client-Id": cfg.client_id,
        "Request-Id": requestId,
        "Request-Timestamp": timestamp,
        "Signature": signature,
      },
    });

    if (!res.ok) {
      console.log("Doku status check failed:", res.status, await res.text());
      return json({ status: reg.payment_status || "pending" });
    }

    const body = await res.json();
    const txStatus = String(
      body?.transaction?.status ?? body?.order?.status ?? body?.status ?? "",
    ).toUpperCase();

    if (txStatus !== "SUCCESS" && txStatus !== "PAID" && txStatus !== "SETTLEMENT") {
      return json({ status: "pending", doku_status: txStatus });
    }

    const isPremium = (reg.extra as any)?.fast_track_type === "premium";
    const updates: Record<string, any> = { payment_status: "paid", status: "approved" };
    if (isPremium) {
      updates.candidate_status = "approved";
    }

    const { data: paidRegistration, error: updateError } = await supabaseAdmin
      .from("registrations")
      .update(updates)
      .eq("id", reg.id)
      .eq("payment_status", "pending")
      .select("id")
      .maybeSingle();

    if (updateError) throw new Error(`Gagal memperbarui pembayaran: ${updateError.message}`);
    const firstTransition = Boolean(paidRegistration);

    if (firstTransition) {
      try {
        await supabaseAdmin.from("payments").insert({
          registration_id: reg.id,
          amount: Number(body?.order?.amount) || 0,
          status: "paid",
          external_id: token,
          provider: "doku",
        });
      } catch (e) {
        console.error("payment insert failed", (e as Error).message);
      }
    }

    if (!alreadyNotified) {
      // Atomic claim: cegah notifikasi Telegram ganda (webhook vs polling)
      const { data: claimed } = await supabaseAdmin
        .from("registrations")
        .update({ extra: { ...((reg.extra as Record<string, unknown>) || {}), telegram_notified: true } })
        .eq("id", reg.id)
        .or("extra->>telegram_notified.is.null,extra->>telegram_notified.neq.true")
        .select("id")
        .maybeSingle();

      if (claimed) {
        try {
          await sendTelegramPaymentNotification(
            {
              full_name: reg.full_name,
              email: reg.email,
              whatsapp: reg.whatsapp,
              token: reg.token,
            },
            Number(body?.order?.amount) || 0,
          );
        } catch (e) {
          console.error("Telegram notification failed:", (e as Error).message);
          await supabaseAdmin
            .from("registrations")
            .update({ extra: { ...((reg.extra as Record<string, unknown>) || {}), telegram_notified: false } })
            .eq("id", reg.id);
        }
      }
    }


    if (!firstTransition) return json({ status: "paid" });


    try {
      await supabaseAdmin.functions.invoke("send-whatsapp", {
        body: {
          type: "pendaftaran_sukses",
          full_name: reg.full_name,
          email: reg.email,
          whatsapp: reg.whatsapp,
          kind: reg.kind,
          token: reg.token,
        },
      });
      await supabaseAdmin.functions.invoke("notify-user", {
        body: {
          type: "registration",
          full_name: reg.full_name,
          email: reg.email,
          token: reg.token,
          kind: reg.kind,
          status: "approved",
        },
      });
    } catch (e) {
      console.error("notify failed", (e as Error).message);
    }

    return json({ status: "paid" });
  } catch (e) {
    console.error("check-payment-status error", (e as Error).message);
    return json({ error: (e as Error).message }, 500);
  }
});
