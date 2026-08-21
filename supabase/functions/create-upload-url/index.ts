// supabase/functions/create-upload-url/index.ts
// Menerbitkan signed upload URL dengan path yang ditentukan server,
// sehingga pengunjung tidak bisa menulis ke folder pendaftar lain.
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

const BUCKET = "kp-uploads";
const MAX_SIZE = 15 * 1024 * 1024; // 15 MB

const Input = z.object({
  kind: z.enum(["prestasi", "ekonomi", "umum", "yatim"]),
  field: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-zA-Z0-9_-]+$/),
  ext: z
    .string()
    .trim()
    .toLowerCase()
    .max(10)
    .regex(/^[a-z0-9]+$/)
    .optional(),
  size: z.number().int().positive().max(MAX_SIZE).optional(),
});

const ALLOWED_EXT = new Set([
  "jpg", "jpeg", "png", "webp", "heic", "gif", "pdf", "doc", "docx",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405, headers: cors });

  try {
    const parsed = Input.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Permintaan tidak valid" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const { kind, field, ext, size } = parsed.data;
    if (size && size > MAX_SIZE) {
      return new Response(JSON.stringify({ error: "Ukuran berkas maksimal 15 MB" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const safeExt = ext && ALLOWED_EXT.has(ext) ? ext : "bin";
    if (ext && !ALLOWED_EXT.has(ext)) {
      return new Response(JSON.stringify({ error: "Jenis berkas tidak diizinkan" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Path sepenuhnya ditentukan server: unik & tidak bisa menimpa milik orang lain.
    const path = `${kind}/${field}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data) throw new Error(error?.message ?? "Gagal membuat URL unggah");

    const publicUrl = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

    return new Response(
      JSON.stringify({ path, token: data.token, url: publicUrl }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (_e) {
    return new Response(JSON.stringify({ error: "Gagal membuat URL unggah" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
