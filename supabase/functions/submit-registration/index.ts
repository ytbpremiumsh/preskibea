// supabase/functions/submit-registration/index.ts
// Insert registrasi pendaftar (sebelumnya TanStack server fn)
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
  kind: z.enum(["prestasi", "ekonomi", "umum"]),
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
  extra: z.record(z.string(), z.unknown()).optional().default({}),
});

const TOKEN_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateToken(kind: "prestasi" | "ekonomi" | "umum") {
  const prefix = kind === "prestasi" ? "KP-PRE-" : kind === "ekonomi" ? "KP-EKO-" : "KP-UMU-";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return `${prefix}${Array.from(bytes, (b) => TOKEN_CHARS[b % TOKEN_CHARS.length]).join("")}`;
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
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const token = generateToken(data.kind);
      const { data: inserted, error } = await supabaseAdmin
        .from("registrations")
        .insert({
          token,
          kind: data.kind,
          status: "approved",
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
        .select("token")
        .single();

      if (!error) {
        return new Response(
          JSON.stringify({ token: (inserted as { token?: string } | null)?.token ?? token }),
          { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
        );
      }
      lastError = error;
      if (error.code !== "23505") {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    }
    return new Response(
      JSON.stringify({ error: lastError?.message ?? "Gagal membuat kode pendaftar" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
