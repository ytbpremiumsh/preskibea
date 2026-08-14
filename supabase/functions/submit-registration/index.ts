// supabase/functions/submit-registration/index.ts
// Insert registrasi pendaftar + Create Invoice (Mayar/Aulaa.co) for Fast Track
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const emptyToNull = (v: unknown) => {
  if (v == null) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  return v;
};

const urlOrNull = z.preprocess(
  emptyToNull,
  z.string().url().max(1000).nullable().optional(),
);

const Input = z.object({
  kind: z.enum(["prestasi", "ekonomi", "umum", "yatim"]),
  full_name: z.string().trim().min(2).max(200),
  birth_place: z.string().trim().min(1).max(120),
  birth_date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.string().trim().min(1).max(50),
  address: z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? v : "-"),
    z.string().trim().max(500),
  ),
  whatsapp: z.string().trim().regex(/^[+\d\s-]{6,25}$/),
  email: z.string().trim().toLowerCase().email().max(200),
  education_level: z.string().trim().min(1).max(80),
  school_name: z.string().trim().min(1).max(200),
  grade: z.string().trim().min(1).max(80),
  main_achievement: z.preprocess(emptyToNull, z.string().max(1000).nullable().optional()),
  parent_income: z.preprocess(emptyToNull, z.string().max(120).nullable().optional()),
  dependents: z.preprocess((v) => {
    const n = emptyToNull(v);
    return n == null ? null : Number(n);
  }, z.number().int().min(0).max(50).nullable().optional()),
  photo_url: urlOrNull,
  student_card_url: urlOrNull,
  fast_track: z.boolean().optional().default(false),
  extra: z.record(z.string(), z.unknown()).optional().default({}),
  payment_url: z.string().url().nullable().optional(),
});

const TOKEN_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateToken(kind: "prestasi" | "ekonomi" | "umum" | "yatim") {
  const prefix = kind === "prestasi" ? "PK-PRE-" : kind === "ekonomi" ? "PK-EKO-" : kind === "yatim" ? "PK-YAT-" : "PK-UMU-";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return `${prefix}${Array.from(bytes, (b) => TOKEN_CHARS[b % TOKEN_CHARS.length]).join("")}`;
}

function normalizeNumber(raw: string): string {
  let n = (raw || "").replace(/\D/g, "");
  if (!n) return "";
  if (n.startsWith("0")) n = "62" + n.slice(1);
  else if (n.startsWith("8")) n = "62" + n;
  return n;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405, headers: cors });

  try {
    const body = await req.json();
    const parsed = Input.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }
    const data = parsed.data;

    let lastError: { code?: string; message?: string } | null = null;
    let registrationId: string | null = null;
    let token: string | null = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      token = generateToken(data.kind);
      const { data: inserted, error } = await supabaseAdmin
        .from("registrations")
        .insert({
          token,
          kind: data.kind,
          fast_track: data.fast_track,
          status: data.fast_track ? "pending" : "approved",
          payment_status: data.fast_track ? "pending" : "paid",
          payment_url: data.payment_url ?? null,
          full_name: data.full_name,
          birth_place: data.birth_place,
          birth_date: data.birth_date,
          gender: data.gender,
          address: data.address,
          whatsapp: data.whatsapp,
          email: data.email,
          education_level: data.education_level,
          school_name: data.school_name,
          grade: data.grade,
          main_achievement: data.main_achievement ?? null,
          parent_income: data.parent_income ?? null,
          dependents: data.dependents ?? null,
          photo_url: data.photo_url ?? null,
          student_card_url: data.student_card_url ?? null,
          extra: data.extra,
        })
        .select("id, token")
        .single();

      if (!error) {
        registrationId = inserted.id;
        token = inserted.token;
        break;
      }
      lastError = error;
      if (error.code !== "23505") {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    }

    if (!registrationId || !token) {
      return new Response(
        JSON.stringify({ error: lastError?.message ?? "Gagal membuat kode pendaftar" }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    let finalInvoiceUrl = data.payment_url || null;
    let aulaaPaymentId: string | null = null;

    if (data.fast_track) {
      try {
        // Fetch configs
        const { data: settings } = await supabaseAdmin
          .from("site_settings")
          .select("key, value")
          .in("key", ["payment_provider", "mayar_config", "aulaa_config", "doku_config", "fast_track_fee"]);
        
        const provider = settings?.find(s => s.key === "payment_provider")?.value as string || "mayar";
        const feeSetting = settings?.find(s => s.key === "fast_track_fee")?.value;
        const amount = feeSetting ? Number(feeSetting) : 15000;
        const description = `Pendaftaran Fast Track — ${data.full_name}`;
        const origin = req.headers.get("origin") || req.headers.get("referer") || "";
        const redirectUrl = origin 
          ? `${origin.replace(/\/$/, "")}/pendaftaran/sukses?token=${token}&name=${encodeURIComponent(data.full_name)}&email=${encodeURIComponent(data.email)}&whatsapp=${encodeURIComponent(data.whatsapp)}&kind=${data.kind}`
          : "https://preskibea.lovable.app";

        if (provider === "mayar") {
          const mayarConfig = settings?.find(s => s.key === "mayar_config")?.value as { api_key?: string };
          if (mayarConfig?.api_key) {
            const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            const mayarBody = {
              name: data.full_name,
              email: data.email,
              mobile: normalizeNumber(data.whatsapp) || "62800000000",
              redirectUrl,
              description,
              expiredAt,
              items: [{ quantity: 1, rate: amount, description: "Biaya Pendaftaran Jalur Fast Track Batch #8" }],
              extraData: { noCustomer: token, idProd: "FAST_TRACK_BATCH_8" }
            };

            const mayarRes = await fetch("https://api.mayar.id/hl/v1/invoice/create", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${mayarConfig.api_key}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(mayarBody),
            });

            if (mayarRes.ok) {
              const resJson = await mayarRes.json();
              const link = resJson?.data?.link;
              if (link) {
                finalInvoiceUrl = link;
                await supabaseAdmin.from("registrations").update({ 
                  payment_url: link, 
                  extra: { ...data.extra, mayar_invoice_id: resJson?.data?.id } 
                }).eq("id", registrationId);
              }
            }
          }
        } else if (provider === "aulaa") {
          const aulaaConfig = settings?.find(s => s.key === "aulaa_config")?.value as any;
          if (aulaaConfig?.api_key) {
            const aulaaBody: any = {
              order_id: token,
              amount: amount,
            };

            // If QRIS only is enabled in config
            if (aulaaConfig?.qris_only) {
              aulaaBody.payment_method = "qris";
            }


            const aulaaRes = await fetch("https://api.aulaa.co/v1/payments", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${aulaaConfig.api_key}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(aulaaBody),
            });

            if (aulaaRes.ok) {
              const resJson = await aulaaRes.json();
              const paymentId = resJson?.id;
              if (paymentId) {
                const link = `https://payment.aulaa.co/pay/${paymentId}`;
                finalInvoiceUrl = link;
                await supabaseAdmin.from("registrations").update({ 
                  payment_url: link, 
                  extra: { ...data.extra, aulaa_payment_id: paymentId } 
                }).eq("id", registrationId);
                aulaaPaymentId = paymentId;
              }
            }
          }
        } else if (provider === "doku") {
          const dokuConfig = settings?.find(s => s.key === "doku_config")?.value as any;
          if (dokuConfig?.client_id && dokuConfig?.secret_key) {
            const requestId = crypto.randomUUID();
            const timestamp = new Date().toISOString().split('.')[0] + 'Z';
            const requestTarget = "/checkout/v1/payment";
            
            const dokuBody = {
              order: {
                amount: amount,
                invoice_number: token,
                currency: "IDR",
                callback_url: redirectUrl,
                line_items: [
                  {
                    name: "Biaya Pendaftaran Jalur Fast Track Batch #8",
                    price: amount,
                    quantity: 1
                  }
                ]
              },
              customer: {
                name: data.full_name,
                email: data.email,
                phone: normalizeNumber(data.whatsapp)
              }
            };

            const bodyString = JSON.stringify(dokuBody);
            
            // Doku Signature generation
            const digest = encodeBase64(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(bodyString)));
            const signaturePayload = `Client-Id:${dokuConfig.client_id}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`;
            
            const key = await crypto.subtle.importKey(
              "raw",
              new TextEncoder().encode(dokuConfig.secret_key),
              { name: "HMAC", hash: "SHA-256" },
              false,
              ["sign"]
            );
            const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signaturePayload));
            const signature = `HMACSHA256=${encodeBase64(new Uint8Array(sigBuffer))}`;

            const dokuUrl = dokuConfig.is_production 
              ? "https://api.doku.com/checkout/v1/payment" 
              : "https://api-sandbox.doku.com/checkout/v1/payment";

            const dokuRes = await fetch(dokuUrl, {
              method: "POST",
              headers: {
                "Client-Id": dokuConfig.client_id,
                "Request-Id": requestId,
                "Request-Timestamp": timestamp,
                "Signature": signature,
                "Content-Type": "application/json",
              },
              body: bodyString,
            });

            if (dokuRes.ok) {
              const resJson = await dokuRes.json();
              const link = resJson?.response?.payment?.url;
              if (link) {
                finalInvoiceUrl = link;
                await supabaseAdmin.from("registrations").update({ 
                  payment_url: link, 
                  extra: { ...data.extra, doku_request_id: requestId } 
                }).eq("id", registrationId);
              }
            } else {
              const errText = await dokuRes.text();
              console.error("Doku API Error:", errText);
            }
          }
        }

      } catch (invoiceErr) {
        console.error("Failed to generate fast track invoice:", invoiceErr);
      }
    }

    try {
      // Hanya kirim email jika BUKAN Fast Track (karena Fast Track dikirim setelah bayar di webhook)
      if (!data.fast_track) {
        await supabaseAdmin.functions.invoke("notify-user", {
          body: {
            type: "registration",
            full_name: data.full_name,
            email: data.email,
            token,
            kind: data.kind,
            status: "approved"
          },
        });
      }
    } catch (emailErr) {
      console.error("Failed to trigger registration email:", emailErr.message);
    }

    return new Response(
      JSON.stringify({ 
        token, 
        invoice_url: finalInvoiceUrl,
        aulaa_payment_id: aulaaPaymentId
      }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
    );

  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});