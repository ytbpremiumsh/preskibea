// supabase/functions/submit-berkas/index.ts
// Upsert dokumen berkas pendaftar
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

const Input = z.object({
  token: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .pipe(z.string().regex(/^(PK|KP)-(PRE|EKO|UMU|YAT)-[A-Z0-9]{4,10}$/)),
  kind: z.enum(["prestasi", "ekonomi", "umum", "yatim"]),
  documents: z
    .array(
      z.object({
        key: z.string().min(1).max(80),
        label: z.string().min(1).max(180),
        url: z.string().url().max(1000),
      }),
    )
    .min(1)
    .max(20),
  essays: z
    .array(
      z.object({
        question: z.string().min(1).max(300),
        answer: z.string().trim().min(1).max(3000),
      }),
    )
    .max(10)
    .optional(),
  registration_updates: z.record(z.any()).optional(),
});

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

    const kindCode = data.kind === "prestasi" ? "PRE" : data.kind === "ekonomi" ? "EKO" : data.kind === "yatim" ? "YAT" : "UMU";
    if (!new RegExp(`^(PK|KP)-${kindCode}-`).test(data.token)) {
      return new Response(JSON.stringify({ error: "Kode pendaftar tidak sesuai kategori." }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { data: reg, error: regErr } = await supabaseAdmin
      .from("registrations")
      .select("id, email, full_name, extra, fast_track, payment_status, payment_url")
      .eq("token", data.token)
      .eq("kind", data.kind)
      .maybeSingle();

    if (regErr) throw new Error(regErr.message);
    if (!reg?.email) {
      return new Response(JSON.stringify({ error: "Data pendaftar tidak ditemukan." }), {
        status: 404,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const regPay = reg as unknown as { fast_track?: boolean; payment_status?: string | null; payment_url?: string | null };
    if (regPay.fast_track && regPay.payment_status !== "paid") {
      return new Response(JSON.stringify({
        error: "Pembayaran Fast Track belum lunas. Selesaikan pembayaran terlebih dahulu untuk melanjutkan.",
        code: "payment_required",
        payment_url: regPay.payment_url ?? null,
      }), { status: 402, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const submittedAt = new Date().toISOString();
    const rows = data.documents.map((d) => ({
      email: reg.email,
      kind: data.kind,
      doc_type: d.label,
      file_url: d.url,
      registration_id: reg.id,
      created_at: submittedAt,
      review_status: "pending" as const,
      reviewed_at: null,
    }));

    const { error } = await supabaseAdmin
      .from("documents")
      .upsert(rows, { onConflict: "email_key,kind,doc_key" });

    if (error) throw new Error(error.message);

    if (data.essays && data.essays.length > 0) {
      const prevExtra = (reg as { extra?: Record<string, unknown> }).extra ?? {};
      await supabaseAdmin
        .from("registrations")
        .update({
          extra: {
            ...prevExtra,
            essay_answers: data.essays,
            essay_submitted_at: submittedAt,
          },
        })
        .eq("id", reg.id);
    }
    
    if (data.registration_updates && Object.keys(data.registration_updates).length > 0) {
      const { status: newStatus, ...otherUpdates } = data.registration_updates;
      
      // If setting status to verified, only do it if not already approved/paid
      const updates = { ...otherUpdates };
      if (newStatus === "verified" && reg.status !== "approved") {
        updates.status = "verified";
      }

      await supabaseAdmin
        .from("registrations")
        .update(updates)
        .eq("id", reg.id);
    }

    try {
      await supabaseAdmin.functions.invoke("notify-user", {
        body: {
          type: "berkas",
          full_name: reg.full_name,
          email: reg.email,
          token: data.token,
          kind: data.kind,
          count: rows.length
        },
      });
    } catch (emailErr) {
      console.error("Failed to trigger berkas email:", emailErr.message);
    }

    return new Response(JSON.stringify({ count: rows.length }), {

      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
