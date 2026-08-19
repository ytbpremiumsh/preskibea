// supabase/functions/submit-esai/index.ts
// Simpan jawaban esai singkat pendaftar (halaman khusus, sebelum berkas administrasi)
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
  essays: z
    .array(
      z.object({
        question: z.string().min(1).max(300),
        answer: z.string().trim().min(1).max(3000),
      }),
    )
    .min(1)
    .max(10),
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405, headers: cors });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  try {
    const parsed = Input.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Data tidak valid" }, 400);
    const data = parsed.data;

    const kindCode =
      data.kind === "prestasi" ? "PRE" : data.kind === "ekonomi" ? "EKO" : data.kind === "yatim" ? "YAT" : "UMU";
    if (!new RegExp(`^(PK|KP)-${kindCode}-`).test(data.token)) {
      return json({ error: "Kode pendaftar tidak sesuai kategori." }, 400);
    }

    const { data: reg, error: regErr } = await supabaseAdmin
      .from("registrations")
      .select("id, extra, fast_track, email, full_name, whatsapp")
      .eq("token", data.token)
      .eq("kind", data.kind)
      .maybeSingle();

    if (regErr) throw new Error(regErr.message);
    if (!reg) return json({ error: "Data pendaftar tidak ditemukan." }, 404);

    const prevExtra = (reg as { extra?: Record<string, unknown> }).extra ?? {};
    const { error } = await supabaseAdmin
      .from("registrations")
      .update({
        extra: {
          ...prevExtra,
          essay_answers: data.essays,
          essay_submitted_at: new Date().toISOString(),
        },
      })
      .eq("id", reg.id);

    if (error) throw new Error(error.message);

    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
