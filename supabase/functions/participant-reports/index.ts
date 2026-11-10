import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { REPORT_IMAGE_LIMIT, imageExtension, canAccessReport } from "../_shared/report-rules.ts";

const schema = z.object({
  action: z.enum(["list", "create", "reply", "admin-list", "admin-update"]),
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
  if (req.method !== "POST") return response({ error: "Metode tidak diizinkan." }, 405);
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
    const upload = async (name: string): Promise<string | null | Response> => {
      if (!body.image) return null;
      let bytes: Uint8Array;
      try { bytes = Uint8Array.from(atob(body.image), (c) => c.charCodeAt(0)); } catch { return response({ error: "Screenshot tidak valid." }, 400); }
      const ext = imageExtension(bytes);
      if (!ext || bytes.length > REPORT_IMAGE_LIMIT) return response({ error: "Gunakan JPG, PNG, atau WebP maksimal 5 MB." }, 400);
      const path = `${registrationId}/${name}.${ext}`;
      const { error } = await db.storage.from("peserta-kendala").upload(path, bytes, { contentType: ext === "jpg" ? "image/jpeg" : `image/${ext}`, upsert: false });
      if (error) throw error;
      return path;
    };
    if (body.action === "reply") {
      if (!registrationId || !body.id || !body.message) return response({ error: "Pesan wajib diisi." }, 400);
      const { data: rep } = await db.from("peserta_reports").select("id,status").eq("id", body.id).eq("registration_id", registrationId).maybeSingle();
      if (!rep) return response({ error: "Tiket tidak ditemukan." }, 404);
      if (rep.status === "resolved") return response({ error: "Tiket sudah selesai. Buat laporan baru bila masih ada kendala." }, 409);
      const up = await upload(crypto.randomUUID());
      if (up instanceof Response) return up;
      const { error } = await db.from("peserta_report_messages").insert({ report_id: rep.id, sender: "participant", message: body.message, image_path: up });
      if (error) throw error;
      return response({ ok: true });
    }
    if (body.action === "create") {
      if (!registrationId || !body.subject || !body.message) return response({ error: "Judul dan pesan wajib diisi." }, 400);
      const { data: active } = await db.from("peserta_reports").select("id").eq("registration_id", registrationId).eq("status", "open").limit(1).maybeSingle();
      if (active) return response({ error: "Masih ada tiket aktif. Silakan balas di tiket tersebut sampai selesai." }, 409);
      const id = crypto.randomUUID();
      const up = await upload(id);
      if (up instanceof Response) return up;
      const imagePath = up;
      const { error } = await db.from("peserta_reports").insert({ id, registration_id: registrationId, subject: body.subject, message: body.message, image_path: imagePath });
      if (error) {
        if (imagePath) await db.storage.from("peserta-kendala").remove([imagePath]);
        throw error;
      }
      return response({ ok: true, id });
    }
    if (body.action === "admin-update") {
      if (!body.id || !body.status || body.admin_reply === undefined) return response({ error: "Data tanggapan tidak lengkap." }, 400);
      const { data, error } = await db.from("peserta_reports").update(body.admin_reply ? { status: body.status, admin_reply: body.admin_reply } : { status: body.status }).eq("id", body.id).select("id,registration_id").maybeSingle();
      if (error) throw error;
      if (!data) return response({ error: "Tiket tidak ditemukan." }, 404);
      if (!body.admin_reply) return response({ ok: true });
      const { data: message, error: mErr } = await db.from("peserta_report_messages")
        .insert({ report_id: body.id, sender: "admin", message: body.admin_reply })
        .select("id").single();
      if (mErr || !message) throw mErr || new Error("message_not_saved");
      // The ticket reply is already saved; email failure must not lose the reply.
      try {
        const { data: participant, error: lookupError } = await db.from("registrations")
          .select("email").eq("id", data.registration_id).maybeSingle();
        if (lookupError || !participant?.email) throw new Error("recipient_unavailable");
        const { data: result, error: sendError } = await db.functions.invoke("send-app-email", {
          headers: { Authorization: `Bearer ${key}`, apikey: key! },
          body: {
            templateName: "ticket-reply",
            recipientEmail: participant.email,
            idempotencyKey: `ticket-reply-${message.id}`,
          },
        });
        if (sendError || !result?.sent) {
          let detail = "";
          try { detail = sendError && "context" in sendError ? String((sendError as { context: Response }).context.status) : String(result?.reason ?? ""); } catch { /* ignore */ }
          console.error(`Ticket reply email not sent: ${detail}`);
          throw new Error("email_not_sent");
        }
        return response({ ok: true, email_notification: "sent" });
      } catch {
        console.error("Ticket reply email could not be sent");
        return response({ ok: true, email_notification: "failed" });
      }
    }
    let query = db.from("peserta_reports").select(admin ? "*, registrations(full_name, token)" : "id,registration_id,subject,message,status,admin_reply,image_path,created_at").order("created_at", { ascending: false }).limit(200);
    if (!admin && registrationId) query = query.eq("registration_id", registrationId);
    const { data, error } = await query;
    if (error) throw error;
    const ids = (data || []).map((r) => r.id);
    const { data: msgs, error: msgErr } = ids.length ? await db.from("peserta_report_messages").select("id,report_id,sender,message,image_path,created_at").in("report_id", ids).order("created_at") : { data: [], error: null };
    if (msgErr) throw msgErr;
    const sign = async (p: string | null) => p ? (await db.storage.from("peserta-kendala").createSignedUrl(p, 600)).data?.signedUrl || null : null;
    const reports = await Promise.all((data || []).map(async (row) => {
      if (!canAccessReport(row.registration_id, registrationId, admin)) throw new Error("access_denied");
      const thread = (msgs || []).filter((m) => m.report_id === row.id);
      const messages = await Promise.all(thread.map(async ({ image_path, report_id: _r, ...m }) => ({ ...m, image_url: await sign(image_path) })));
      if (row.admin_reply && !thread.some((m) => m.sender === "admin")) messages.unshift({ id: `legacy-${row.id}`, sender: "admin", message: row.admin_reply, created_at: row.created_at, image_url: null });
      const { image_path: _path, registration_id: _owner, ...report } = row;
      return { ...report, image_url: await sign(row.image_path), messages };
    }));
    return response({ ok: true, reports });
  } catch {
    return response({ error: "Laporan belum dapat diproses. Silakan coba lagi." }, 500);
  }
});