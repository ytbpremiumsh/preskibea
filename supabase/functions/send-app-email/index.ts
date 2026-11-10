// supabase/functions/send-app-email/index.ts
// Mengirim email transaksional langsung melalui Lovable managed email API.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";
import { EmailAPIError, sendLovableEmail } from "npm:@lovable.dev/email-js@0.1.0";
import { corsHeaders as cors } from "npm:@supabase/supabase-js@2/cors";
import { canSendEmail, safeEmailFailure } from "../_shared/email-safety.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const SITE_NAME = "Prestasi Kita";
const SENDER_DOMAIN = "notify.mailing.prestasikita.com";
const FROM_DOMAIN = "notify.mailing.prestasikita.com";

const CUSTOMIZABLE: Record<string, string> = {
  "registration-confirmation": "email_template_registration",
  "berkas-confirmation": "email_template_berkas",
  "esai-confirmation": "email_template_esai",
  "ticket-reply": "email_template_ticket_reply",
};

const TICKET_REPLY_HTML = `<div style="background:#f4f1fb;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;color:#1a1530">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 32px rgba(61,28,107,0.12)">
    <div style="background:linear-gradient(135deg,#3d1c6b 0%,#5B2A9E 60%,#7c4dcc 100%);background-color:#5B2A9E;padding:32px 32px 28px;text-align:left">
      <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:0.5px">{{site_name}}</p>
      <p style="margin:6px 0 0;font-size:11px;color:#e8dcff;letter-spacing:2px;text-transform:uppercase">Pusat Bantuan Peserta</p>
    </div>
    <div style="padding:32px">
      <div style="display:inline-block;background:#fff4d6;border-radius:999px;padding:6px 14px;margin-bottom:18px">
        <span style="font-size:11px;font-weight:800;color:#8a5a00;letter-spacing:1px">💬 BALASAN BARU DARI ADMIN</span>
      </div>
      <h2 style="margin:0 0 12px;font-size:22px;color:#1a1530">Halo, {{full_name}}!</h2>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4a4560">Tim {{site_name}} telah menanggapi laporan kendala Anda. Berikut isi balasannya:</p>
      <div style="background:#faf8ff;border-left:4px solid #5B2A9E;border-radius:12px;padding:18px 20px;margin:0 0 20px">
        <p style="margin:0 0 8px;font-size:11px;font-weight:800;color:#5B2A9E;letter-spacing:1.5px;text-transform:uppercase">Pesan Admin</p>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#1a1530;white-space:pre-line">{{reply_message}}</p>
      </div>
      <table role="presentation" width="100%" style="border-collapse:collapse;margin:0 0 24px;font-size:13px">
        <tr><td style="padding:8px 0;color:#7c7c87">Kode Pendaftar</td><td style="padding:8px 0;text-align:right;font-family:monospace;font-weight:800;color:#3d1c6b">{{token}}</td></tr>
      </table>
      <div style="text-align:center;margin:28px 0 8px">
        <a href="https://www.prestasikita.com/peserta" style="display:inline-block;background:#5B2A9E;color:#ffffff;text-decoration:none;font-weight:800;font-size:15px;padding:14px 30px;border-radius:12px">Lihat &amp; Balas di Dashboard</a>
      </div>
      <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#7c7c87;text-align:center">Masuk dengan kode pendaftar Anda, lalu buka tab <strong>Laporan Kendala</strong>.</p>
    </div>
    <div style="background:#faf8ff;border-top:1px solid #ece9f5;padding:18px 32px;text-align:center">
      <p style="margin:0;font-size:11px;color:#a09bb0">© {{year}} {{site_name}} · Email ini dikirim otomatis, mohon tidak membalas email ini.</p>
    </div>
  </div>
</div>`;

const Input = z.object({
  templateName: z.enum(["registration-confirmation", "berkas-confirmation", "esai-confirmation", "ticket-reply"]),
  recipientEmail: z.string().email(),
  idempotencyKey: z.string().min(1).max(200).optional(),
  templateData: z.record(z.string(), z.unknown()).optional(),
  // Mode test (dari halaman admin Email Template)
  _isTest: z.boolean().optional(),
  subject: z.string().max(500).optional(),
  html: z.string().max(100000).optional(),
});

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function kindLabel(k?: string) {
  return k === "prestasi"
    ? "Beasiswa Prestasi"
      : k === "ekonomi"
        ? "Beasiswa Ekonomi"
        : k === "umum"
          ? "Beasiswa Umum"
          : k === "yatim"
            ? "Beasiswa Yatim"
            : "Beasiswa";
}

function buildPlaceholders(props: Record<string, unknown>) {
  return {
    full_name: String((props.fullName ?? props.full_name ?? props.name ?? "") as string),
    token: String((props.token ?? "") as string),
    kind: String((props.kind ?? "") as string),
    kind_label: kindLabel(props.kind as string | undefined),
    whatsapp: String((props.whatsapp ?? "") as string),
    count: String((props.count ?? "") as string | number),
    site_name: String((props.site_name ?? "Prestasi Kita") as string),
    year: String(new Date().getFullYear()),
    reply_message: String((props.reply_message ?? "") as string),
  };
}

function applyPlaceholders(tpl: string, props: Record<string, unknown>) {
  const values = buildPlaceholders(props);
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const v = values[key as keyof typeof values];
    return v == null ? "" : escapeHtml(String(v));
  });
}

function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function loadCustomTemplate(templateName: string) {
  const key = CUSTOMIZABLE[templateName];
  if (!key) return null;
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  const v = data?.value as { enabled?: boolean; subject?: string; html?: string } | null;
  if (!v || !v.enabled || !v.html || !v.subject) return null;
  return { subject: v.subject, html: v.html };
}

function defaultBody(templateName: string, props: Record<string, unknown>) {
  const p = buildPlaceholders(props);
  if (templateName === "ticket-reply") {
    return {
      subject: "Ada balasan untuk laporan kendala Anda — Prestasi Kita",
      html: applyPlaceholders(TICKET_REPLY_HTML, { ...props, fullName: p.full_name || "Peserta" }),
    };
  }
  if (templateName === "berkas-confirmation") {
    return {
      subject: `Berkas ${p.kind_label} Berhasil Diterima`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <h2>Berkas diterima, ${escapeHtml(p.full_name)}</h2>
  <p>Berkas <strong>${escapeHtml(p.kind_label)}</strong> Anda dengan kode <code>${escapeHtml(p.token)}</code> telah masuk antrian verifikasi.</p>
  <p>Jumlah dokumen: ${escapeHtml(p.count)}</p>
  <p>© ${p.year} ${p.site_name}</p>
</div>`,
    };
  }
  if (templateName === "esai-confirmation") {
    return {
      subject: `Esai ${p.kind_label} Berhasil Dikirim`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <h2>Esai diterima, ${escapeHtml(p.full_name)}</h2>
  <p>Jawaban esai singkat Anda untuk <strong>${escapeHtml(p.kind_label)}</strong> dengan kode <code>${escapeHtml(p.token)}</code> telah kami terima.</p>
  <p>Silakan lanjutkan ke tahap pengiriman berkas administrasi.</p>
  <p>© ${p.year} ${p.site_name}</p>
</div>`,
    };
  }
  // default = registration-confirmation
  return {
    subject: `Pendaftaran ${p.kind_label} Berhasil — Kode Anda`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <h2>Halo, ${escapeHtml(p.full_name)}!</h2>
  <p>Terima kasih telah mendaftar <strong>${escapeHtml(p.kind_label)}</strong>.</p>
  <p>Kode pendaftar Anda: <strong style="font-size:20px;letter-spacing:2px">${escapeHtml(p.token)}</strong></p>
  <p>Simpan kode ini untuk pengiriman berkas &amp; cek status.</p>
  <p>© ${p.year} ${p.site_name}</p>
</div>`,
  };
}

async function deliver(args: {
  recipient: string;
  templateName: string;
  idempotencyKey: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  try {
    await sendLovableEmail(
      {
        to: args.recipient,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: args.subject,
        html: args.html,
        text: args.text,
        purpose: "transactional",
        label: args.templateName,
        idempotency_key: args.idempotencyKey,
      },
      { apiKey, sendUrl: Deno.env.get("LOVABLE_SEND_URL") },
    );
  } catch (error) {
    if (error instanceof EmailAPIError && error.code === "recipient_suppressed") {
      return { sent: false, reason: "recipient_suppressed" as const };
    }
    throw error;
  }
  return { sent: true as const };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405, headers: cors });

  let logId: string | undefined;
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
    // Internal service calls can send transactional mail; signed-in admins can send tests only.
    const bearer = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const apiKeyHeader = req.headers.get("apikey") ?? "";
    const internal = Boolean(serviceKey && (bearer === serviceKey || apiKeyHeader === serviceKey));
    let authenticatedAdmin = false;
    if (!internal || data._isTest) {
      const { data: auth, error: authError } = await supabaseAdmin.auth.getUser(bearer);
      if (authError || !auth.user || !data._isTest) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
      }
      const { data: role, error: roleError } = await supabaseAdmin.from("user_roles").select("user_id").eq("user_id", auth.user.id).eq("role", "admin").maybeSingle();
      if (roleError || !role) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
      }
      authenticatedAdmin = true;
    }
    if (!canSendEmail(internal, Boolean(data._isTest), authenticatedAdmin)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const recipient = data.recipientEmail.toLowerCase();
    const props = data.templateData ?? {};
    const { data: log, error: logError } = await supabaseAdmin.from("email_send_log").insert({
      template_name: data.templateName, recipient_email: recipient, status: "pending",
      metadata: { is_test: Boolean(data._isTest), idempotency_key: data.idempotencyKey ?? null },
    }).select("id").single();
    if (logError) throw Object.assign(new Error("Log unavailable"), { code: "log_unavailable" });
    logId = log?.id;
    if (data._isTest && (!data.subject?.trim() || !data.html?.trim())) {
      throw Object.assign(new Error("Invalid test content"), { code: "invalid_test_content", status: 400 });
    }

    // Test mode: pakai subject & html dari body
    let subject: string;
    let html: string;
    if (data._isTest && data.subject && data.html) {
      const sampleProps = {
        fullName: "Andi Pratama",
        token: "PK-PRE-A1B2C3",
        kind: "prestasi",
        whatsapp: "08123456789",
        count: 5,
        reply_message: "Terima kasih atas laporannya. Kendala sudah kami perbaiki, silakan coba kembali.",
        ...props,
      };
      subject = applyPlaceholders(data.subject, sampleProps);
      html = applyPlaceholders(data.html, sampleProps);
    } else {
      const custom = await loadCustomTemplate(data.templateName);
      if (custom) {
        subject = applyPlaceholders(custom.subject, props);
        html = applyPlaceholders(custom.html, props);
      } else {
        const def = defaultBody(data.templateName, props);
        subject = def.subject;
        html = def.html;
      }
    }
    const text = htmlToText(html);

    const result = await deliver({
      recipient,
      templateName: data.templateName,
      idempotencyKey: data.idempotencyKey ?? `${data.templateName}-${crypto.randomUUID()}`,
      subject,
      html,
      text,
    });

    if (logId) {
      const { error } = await supabaseAdmin.from("email_send_log")
        .update({ status: result.sent ? "sent" : "suppressed", error_message: result.sent ? null : safeEmailFailure(result.reason).message })
        .eq("id", logId);
      if (error) console.error("Unable to update email log:", error.message);
    }
    if (!result.sent) {
      console.log(`Email skipped for label=${data.templateName}: ${result.reason}`);
      return new Response(JSON.stringify({ ok: true, skipped: result.reason }), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    console.log(`Email sent: label=${data.templateName}`);
    return new Response(JSON.stringify({ ok: true, sent: true }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    const err = e as Error & { code?: string; status?: number };
    const failure = safeEmailFailure(err.code, err.status);
    console.error(`send-app-email failed [${failure.code}] raw_code=${err.code ?? "none"} status=${err.status ?? "none"} name=${err.name} msg=${String(err.message).slice(0, 300)}`);
    if (logId) {
      const { error } = await supabaseAdmin.from("email_send_log")
        .update({ status: "failed", error_message: failure.message })
        .eq("id", logId);
      if (error) console.error("Unable to update email log:", error.message);
    }
    if (err.code === "domain_not_verified") {
      return new Response(
        JSON.stringify({ ok: true, sent: false, pending: "domain_verification" }),
        {
          status: 202,
          headers: { ...cors, "Content-Type": "application/json" },
        },
      );
    }
    return new Response(JSON.stringify({ error: failure.message, code: failure.code }), {
      status: err.status === 400 ? 400 : 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
