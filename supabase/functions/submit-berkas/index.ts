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
    .pipe(z.string().regex(/^KP-(PRE|EKO|UMU)-[A-Z0-9]{4,10}$/)),
  kind: z.enum(["prestasi", "ekonomi", "umum"]),
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

    const expectedPrefix = data.kind === "prestasi" ? "KP-PRE-" : data.kind === "ekonomi" ? "KP-EKO-" : "KP-UMU-";
    if (!data.token.startsWith(expectedPrefix)) {
      return new Response(JSON.stringify({ error: "Kode pendaftar tidak sesuai kategori." }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { data: reg, error: regErr } = await supabaseAdmin
      .from("registrations")
      .select("id, email, full_name")
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
