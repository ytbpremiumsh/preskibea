import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { REPORT_IMAGE_LIMIT, imageExtension } from "../_shared/report-rules.ts";

const schema = z.object({
  action: z.enum(["list", "create", "admin-list", "admin-update"]),
  token: z.string().regex(/^(PK|KP)-(PRE|EKO|UMU|YAT)-[A-Z0-9]{4,10}$/).optional(),
  subject: z.string().trim().min(1).max(120).optional(),
  message: z.string().trim().min(1).max(4000).optional(),
  image: z.string().max(Math.ceil(REPORT_IMAGE_LIMIT / 3) * 4).optional(),
  id: z.string().uuid().optional(),
  status: z.enum(["open", "resolved"]).optional(),
  admin_reply: z.string().trim().max(4000).optional(),
});
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return response({ error: "Méthode non autorisée" }, 405);
  try {
    if (Number(req.headers.get("content-length") || 0) > 8 * 1024 * 1024) return response({ error: "Screenshot terlalu besar." }, 413);
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return response({ error: "Data laporan tidak valid." }, 400);
    const body = parsed.data;
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw new Error("configuration");
    const db = createClient(url, key);
    const admin = body.action.startsWith("admin-");
    let registrationId: string | null = null;
    if (admin) {
      const jwt = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      if (!jwt) return response({ error: "Silakan masuk sebagai admin." }, 401);
      const { data: user, error } = await db.auth.getUser(jwt);
      if (error || !user.user) return response({ error: "Silakan masuk sebagai admin." }, 401);
      const { data: role, error: roleError } = await db.from("user_roles").select("id").eq("user_id", user.user.id).eq("role", "admin").maybeSingle();
      if (roleError || !role) return response({ error: "Akses hanya untuk admin." }, 403);
    } else {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`reports:${ip}`));
      const hash = Array.from(new Uint8Array(digest), (v) => v.toString(16).padStart(2, "0")).join("");
      const { data: allowed, error: limitError } = await db.rpc("peserta_rate_limit", { p_key: hash });
      if (limitError || !allowed) return response({ error: "Terlalu banyak permintaan. Coba lagi sebentar." }, 429);
      if (!body.token) return response({ error: "Masuk dengan kode pendaftaran terlebih dahulu." }, 401);
      const { data: reg, error } = await db.from("registrations").select("id").eq("token", body.token).maybeSingle();
      if (error || !reg) return response({ error: "Kode pendaftaran tidak ditemukan." }, 401);
      registrationId = reg.id;
    }
    if (body.action === "create") {
      if (!registrationId || !body.subject || !body.message) return response({ error: "Judul dan pesan wajib diisi." }, 400);
      const id = crypto.randomUUID();
      let imagePath: string | null = null;
      if (body.image) {
        let bytes: Uint8Array;
        try { bytes = Uint8Array.from(atob(body.image), (c) => c.charCodeAt(0)); } catch { return response({ error: "Screenshot tidak valid." }, 400); }
        const ext = imageExtension(bytes);
        if (!ext || bytes.length > REPORT_IMAGE_LIMIT) return response({ error: "Gunakan JPG, PNG, atau WebP maksimal 5 MB." }, 400);
        imagePath = `${registrationId}/${id}.${ext}`;
        const { error } = await db.storage.from("peserta-kendala").upload(imagePath, bytes, { contentType: ext === "jpg" ? "image/jpeg" : `image/${ext}`, upsert: false });
        if (error) throw error;
      }
      const { error } = await db.from("peserta_reports").insert({ id, registration_id: registrationId, subject: body.subject, message: body.message, image_path: imagePath });
      if (error) {
        if (imagePath) await db.storage.from("peserta-kendala").remove([imagePath]);
        throw error;
      }
      return response({ ok: true, id });
    }
    if (body.action === "admin-update") {
      if (!body.id || !body.status || body.admin_reply === undefined) return response({ error: "Data tanggapan tidak lengkap." }, 400);
      const { data, error } = await db.from("peserta_reports").update({ status: body.status, admin_reply: body.admin_reply || null }).eq("id", body.id).select("id").maybeSingle();
      if (error) throw error;
      if (!data) return response({ error: "Tiket tidak ditemukan." }, 404);
      return response({ ok: true });
    }
    let query = db.from("peserta_reports").select(admin ? "*, registrations(full_name, token)" : "id,subject,message,status,admin_reply,image_path,created_at").order("created_at", { ascending: false }).limit(200);
    if (!admin && registrationId) query = query.eq("registration_id", registrationId);
    const { data, error } = await query;
    if (error) throw error;
    const reports = await Promise.all((data || []).map(async (row) => {
      const image = row.image_path ? await db.storage.from("peserta-kendala").createSignedUrl(row.image_path, 600) : null;
      const { image_path: _path, ...report } = row;
      return { ...report, image_url: image?.data?.signedUrl || null };
    }));
    return response({ ok: true, reports });
  } catch {
    return response({ error: "Laporan belum dapat diproses. Silakan coba lagi." }, 500);
  }
});