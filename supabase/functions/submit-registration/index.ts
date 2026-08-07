// supabase/functions/submit-registration/index.ts
// Insert registrasi pendaftar + Create Mayar Invoice for Fast Track
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

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
  address: z.string().trim().min(5).max(500),
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

    // IF FAST TRACK, create Mayar Invoice
    let finalInvoiceUrl = data.payment_url || null;

    if (data.fast_track) {
      try {
        const { data: mayarRow } = await supabaseAdmin
          .from("site_settings")
          .select("value")
          .eq("key", "mayar_config")
          .maybeSingle();
        
        const mayar = (mayarRow?.value ?? {}) as { api_key?: string };
        
        if (mayar.api_key) {
          const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          const description = `Pendaftaran Fast Track — ${data.full_name}`;
          const amount = 15000;
          
          const origin = req.headers.get("origin") || req.headers.get("referer") || "";
          const redirectUrl = origin 
            ? `${origin.replace(/\/$/, "")}/pendaftaran/sukses?token=${token}&name=${encodeURIComponent(data.full_name)}&email=${encodeURIComponent(data.email)}&whatsapp=${encodeURIComponent(data.whatsapp)}&kind=${data.kind}`
            : "https://prestasikita.com";

          const mayarBody = {
            name: data.full_name,
            email: data.email,
            mobile: normalizeNumber(data.whatsapp) || "62800000000",
            redirectUrl,
            description,
            expiredAt,
            items: [
              {
                quantity: 1,
                rate: amount,
                description: "Biaya Pendaftaran Jalur Fast Track Batch #8",
              },
            ],
            extraData: {
              noCustomer: token,
              idProd: "FAST_TRACK_BATCH_8"
            }
          };

          const mayarRes = await fetch("https://api.mayar.id/hl/v1/invoice/create", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${mayar.api_key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(mayarBody),
          });

          if (mayarRes.ok) {
            const resJson = await mayarRes.json();
            const link = resJson?.data?.link;
            const invoiceId = resJson?.data?.id;
            
            if (link) {
              finalInvoiceUrl = link;
              // Update registration with invoice info
              await supabaseAdmin
                .from("registrations")
                .update({ 
                  payment_url: link,
                  extra: { ...data.extra, mayar_invoice_id: invoiceId } 
                })
                .eq("id", registrationId);
            }
          } else {
            const errJson = await mayarRes.json();
            console.error("Mayar Invoice Error:", errJson);
          }
        }
      } catch (invoiceErr) {
        console.error("Failed to generate fast track invoice:", invoiceErr);
      }
    }

    return new Response(
      JSON.stringify({ 
        token, 
        invoice_url: finalInvoiceUrl 
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
