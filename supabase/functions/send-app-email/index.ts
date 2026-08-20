// supabase/functions/send-app-email/index.ts
// Mengirim email transaksional langsung melalui Lovable managed email API.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";
import { EmailAPIError, sendLovableEmail } from "npm:@lovable.dev/email-js@0.1.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const SITE_NAME = "Prestasi Kita";
const SENDER_DOMAIN = "notify.prestasikita.com";
const FROM_DOMAIN = "prestasikita.com";

const CUSTOMIZABLE: Record<string, string> = {
  "registration-confirmation": "email_template_registration",
  "berkas-confirmation": "email_template_berkas",
  "esai-confirmation": "email_template_esai",
};

const Input = z.object({
  templateName: z.string().min(1).max(100),
  recipientEmail: z.string().email(),
  idempotencyKey: z.string().min(1).max(200).optional(),
  templateData: z.record(z.string(), z.any()).optional(),
  // Mode test (dari halaman admin Email Template)
  _isTest: z.boolean().optional(),
  subject: z.string().optional(),
  html: z.string().optional(),
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
    const recipient = data.recipientEmail.toLowerCase();
    const props = data.templateData ?? {};

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
    console.error(`send-app-email failed [${err.code ?? "unknown"}]: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message, code: err.code ?? null }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
