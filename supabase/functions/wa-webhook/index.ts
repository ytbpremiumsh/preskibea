// WhatsApp Inbound Webhook -> AI Reply
// Public endpoint. Configure your WA gateway (MPWA / app.ayopintar.com) to POST
// incoming chat messages to:
//   https://<project-ref>.functions.supabase.co/wa-webhook?token=<wa_webhook_token>
//
// The token is generated per AI behavior row and shown in the admin Balasan AI page.
//
// Behavior:
// 1. Validates ?token= matches ai_behavior.wa_webhook_token
// 2. Extracts sender phone + message text from common MPWA payload shapes
// 3. Logs incoming message to wa_chat_messages (direction='in')
// 4. If wa_auto_reply + enabled => calls Lovable AI Gateway with KB context
// 5. Sends reply via existing send-whatsapp function and logs (direction='out')

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Behavior = {
  id: string;
  enabled: boolean;
  wa_auto_reply: boolean;
  wa_webhook_token: string | null;
  persona_name: string;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  fallback_message: string;
};

type Provider = {
  vendor?: "lovable_ai" | "openrouter";
  api_key?: string | null;
  base_url?: string | null;
  model?: string | null;
  enabled?: boolean;
};

type Kb = { id: string; question: string; answer: string; category: string | null };

function getPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current == null) return undefined;
    if (Array.isArray(current)) return current[Number(key)];
    if (typeof current === "object") return (current as Record<string, unknown>)[key];
    return undefined;
  }, source);
}

function firstString(p: Record<string, unknown>, paths: string[]): string | null {
  for (const path of paths) {
    const value = getPath(p, path);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function normalizePhone(raw: string): string {
  const withoutJid = raw.split("@")[0];
  const match = withoutJid.match(/(?:62|0|8)\d{7,15}/);
  let phone = (match?.[0] ?? withoutJid).replace(/\D/g, "");
  if (phone.startsWith("0")) phone = `62${phone.slice(1)}`;
  if (phone.startsWith("8")) phone = `62${phone}`;
  return phone;
}

function pickRawPhone(p: Record<string, unknown>): string | null {
  return firstString(p, [
    "from", "sender", "number", "phone", "wa_number", "remoteJid", "jid", "chatId", "participant", "author",
    "data.from", "data.sender", "data.number", "data.phone", "data.remoteJid", "data.chatId", "data.jid", "data.participant", "data.author", "data.key.remoteJid", "data.key.participant",
    "message.from", "message.sender", "message.key.remoteJid", "message.key.participant", "payload.from", "payload.sender", "payload.phone", "payload.number",
    "entry.0.changes.0.value.messages.0.from",
    "messages.0.from", "messages.0.sender", "messages.0.key.remoteJid", "messages.0.remoteJid",
  ]);
}

function pickPhone(p: Record<string, unknown>): string | null {
  const raw = pickRawPhone(p);
  return raw ? normalizePhone(raw) : null;
}

function pickText(p: Record<string, unknown>): string | null {
  return firstString(p, [
    "text", "body", "msg", "pesan", "caption", "message", "conversation", "content",
    "data.text", "data.body", "data.message", "data.msg", "data.caption", "data.content", "data.message.conversation",
    "data.message.extendedTextMessage.text", "data.message.imageMessage.caption", "data.message.videoMessage.caption",
    "message.text", "message.body", "message.conversation", "message.extendedTextMessage.text", "message.imageMessage.caption", "message.videoMessage.caption",
    "payload.text", "payload.body", "payload.message", "payload.caption",
    "entry.0.changes.0.value.messages.0.text.body",
    "messages.0.text", "messages.0.body", "messages.0.message.conversation", "messages.0.message.extendedTextMessage.text",
  ]);
}

function mediaFallbackText(p: Record<string, unknown>): string | null {
  if (!hasMediaPayload(p)) return null;
  return "Peserta mengirim gambar/screenshot bukti share poster Beasiswa Prestasi Kita melalui WhatsApp/Instagram/Grup WA. Balas dengan ucapan terima kasih karena bukti share poster sudah dikirim, lalu arahkan peserta untuk lanjut ke tahapan Pengiriman Berkas di www.kejarprestasi.id dengan Kode Token dan format PDF atau JPG.";
}

const SHARE_POSTER_KEYWORDS = [
  "bukti bagikan poster",
  "bukti share poster",
  "kirim bukti poster",
  "kirim poster",
  "bagikan poster",
  "share poster",
  "bukti share",
  "bukti bagikan",
  "sudah bagikan poster",
  "sudah share poster",
  "poster beasiswa",
  "bukti poster beasiswa",
];

function isSharePosterText(text: string): boolean {
  const t = text.toLowerCase();
  return SHARE_POSTER_KEYWORDS.some((kw) => t.includes(kw));
}

function sharePosterReply(): string {
  return `Terima kasih Kak, bukti share poster sudah kami terima. 🙏

Kakak bisa langsung melanjutkan ke tahapan berikutnya yaitu *Pengiriman Berkas* melalui www.kejarprestasi.id.

Silakan pilih menu *Kirim Berkas*, lalu masukkan *Kode Token* yang Kakak terima saat pendaftaran. Format file yang diterima hanya *PDF* atau *JPG* ya Kak.`;
}

function mediaDirectReply(): string {
  return "Terima kasih Kak, bukti share poster sudah kami terima. 🙏\n\nKakak bisa langsung melanjutkan ke tahapan berikutnya yaitu Pengiriman Berkas melalui www.kejarprestasi.id.\n\nSilakan pilih menu Kirim Berkas, lalu masukkan Kode Token yang Kakak terima saat pendaftaran. Format file yang diterima hanya PDF atau JPG ya Kak.";
}

function hasMediaPayload(p: Record<string, unknown>): boolean {
  const mediaPaths = [
    "bufferImage", "image", "imageUrl", "media", "mediaUrl", "file", "attachment", "attachments.0", "mimetype", "mimeType",
    "data.bufferImage", "data.image", "data.imageUrl", "data.media", "data.mediaUrl", "data.file", "data.attachment", "data.attachments.0", "data.mimetype", "data.mimeType",
    "data.message.imageMessage", "data.message.videoMessage", "data.message.documentMessage",
    "message.imageMessage", "message.videoMessage", "message.documentMessage",
    "payload.image", "payload.imageUrl", "payload.media", "payload.mediaUrl", "payload.file", "payload.attachment", "payload.mimetype", "payload.mimeType",
    "messages.0.image", "messages.0.media", "messages.0.file", "messages.0.attachment", "messages.0.message.imageMessage", "messages.0.message.videoMessage", "messages.0.message.documentMessage",
    "entry.0.changes.0.value.messages.0.image", "entry.0.changes.0.value.messages.0.document", "entry.0.changes.0.value.messages.0.video",
  ];

  return mediaPaths.some((path) => {
    const value = getPath(p, path);
    if (value == null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "object") return true;
    return Boolean(value);
  }) || Object.keys(p).some((key) => /image|media|file|attachment|buffer/i.test(key) && p[key] != null && p[key] !== "");
}

function pickName(p: Record<string, unknown>): string | null {
  return firstString(p, [
    "pushname", "pushName", "name", "sender_name", "contact_name",
    "data.pushname", "data.pushName", "data.name", "data.sender_name",
    "message.pushName", "messages.0.pushName", "messages.0.pushname",
  ]);
}

async function callAI(behavior: Behavior, provider: Provider | null, kb: Kb[], userMessage: string, contactName: string | null): Promise<string> {
  const kbText = kb
    .map((k, i) => `${i + 1}. [${k.category ?? "Umum"}] Q: ${k.question}\n   A: ${k.answer}`)
    .join("\n\n");

  const sys = `${behavior.system_prompt}\n\nNAMA PENGGUNA SAAT INI: ${contactName ?? "(tidak diketahui, sapa dengan 'Kak')"}\n\nBASIS PENGETAHUAN (gunakan HANYA info di sini, jangan mengarang):\n${kbText}\n\nAturan balasan: gunakan panggilan Kak/Kakak, boleh menyebut nama peserta jika tersedia, jawab ringkas dan jelas. Jika tidak ada jawaban yang cocok, balas dengan: "${behavior.fallback_message}"`;
  const vendor = provider?.enabled === false ? "lovable_ai" : provider?.vendor ?? "lovable_ai";
  const endpoint = vendor === "openrouter" ? (provider?.base_url?.trim() || "https://openrouter.ai/api/v1/chat/completions") : "https://ai.gateway.lovable.dev/v1/chat/completions";
  const apiKey = vendor === "openrouter" ? (provider?.api_key?.trim() || Deno.env.get("OPENROUTER_API_KEY")) : Deno.env.get("LOVABLE_API_KEY");
  const model = provider?.model?.trim() || behavior.model || "google/gemini-3-flash-preview";
  if (!apiKey) return behavior.fallback_message;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(vendor === "openrouter" ? { "HTTP-Referer": "https://prestasi-emas.lovable.app", "X-Title": "Prestasi Kita AI" } : {}),
    },
    body: JSON.stringify({
      model,
      temperature: behavior.temperature ?? 0.5,
      max_tokens: behavior.max_tokens ?? 600,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (res.status === 429) return behavior.fallback_message + "\n\n_(AI sedang sibuk, coba beberapa saat lagi ya Kak 🙏)_";
  if (res.status === 402) return behavior.fallback_message;
  if (!res.ok) {
    console.error("AI provider error", res.status, await res.text());
    return behavior.fallback_message;
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  return (typeof content === "string" && content.trim()) ? content.trim() : behavior.fallback_message;
}

async function sendWA(supabase: ReturnType<typeof createClient>, to: string, message: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("send-whatsapp", {
      body: { type: "test", to, message },
    });
    if (error) return { ok: false, error: error.message };
    const r = data as { ok?: boolean; error?: string };
    return { ok: !!r.ok, error: r.error };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // Verify token
    const url = new URL(req.url);
    const queryPayload = Object.fromEntries(url.searchParams.entries()) as Record<string, unknown>;

    const { data: bhvRow } = await supabase
      .from("ai_behavior")
      .select("*")
      .limit(1)
      .maybeSingle();

    const behavior = bhvRow as Behavior | null;
    if (!behavior) {
      return new Response(JSON.stringify({ ok: false, error: "ai_behavior_not_configured" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Parse payload (support JSON, form-encoded, and GET query payloads)
    let payload: Record<string, unknown> = { ...queryPayload };
    const ct = req.headers.get("content-type") || "";
    if (req.method === "GET" || req.method === "HEAD") {
      payload = queryPayload;
    } else if (ct.includes("application/json")) {
      payload = { ...queryPayload, ...await req.json().catch(() => ({})) };
    } else if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      fd.forEach((v, k) => { payload[k] = typeof v === "string" ? v : "(file)"; });
    } else {
      const txt = await req.text();
      if (txt.trim()) {
        try { payload = { ...queryPayload, ...JSON.parse(txt) }; } catch { payload = { ...queryPayload, raw: txt }; }
      }
    }

    const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    const token = url.searchParams.get("token") || req.headers.get("x-webhook-token") || bearer || firstString(payload, ["token", "webhook_token", "secret", "data.token", "payload.token"]);
    if (!behavior.wa_webhook_token || token !== behavior.wa_webhook_token) {
      return new Response(JSON.stringify({ ok: false, error: "invalid_token" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const rawPhone = pickRawPhone(payload);
    const phone = rawPhone ? normalizePhone(rawPhone) : null;
    const mediaText = mediaFallbackText(payload);
    const text = pickText(payload) ?? mediaText;
    const contactName = pickName(payload);

    // Skip echo of own outgoing messages if gateway sends them
    const isFromMe = (payload as { fromMe?: boolean }).fromMe === true ||
      (payload as { is_from_me?: boolean }).is_from_me === true ||
      getPath(payload, "data.key.fromMe") === true ||
      getPath(payload, "messages.0.key.fromMe") === true;
    if (isFromMe) {
      return new Response(JSON.stringify({ ok: true, ignored: "from_me" }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if ((rawPhone?.includes("@g.us") ?? false) || (payload as { isGroup?: boolean }).isGroup === true || getPath(payload, "data.isGroup") === true) {
      return new Response(JSON.stringify({ ok: true, ignored: "group_message" }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (!phone || !text) {
      await supabase.from("wa_chat_messages").insert({
        phone: phone || "unknown", contact_name: contactName, direction: "in",
        message: text || "[Webhook diterima, tetapi nomor atau isi pesan belum terbaca]",
        raw: payload, status: "ignored_no_phone_or_text",
      });
      return new Response(JSON.stringify({ ok: true, ignored: "no_phone_or_text", parsed: { phone, text }, payload }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Log incoming message
    await supabase.from("wa_chat_messages").insert({
      phone, contact_name: contactName, direction: "in",
      message: text, raw: payload, status: "received",
    });

    if (!behavior.enabled || !behavior.wa_auto_reply) {
      return new Response(JSON.stringify({ ok: true, replied: false, reason: "auto_reply_off" }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (mediaText) {
      const reply = mediaDirectReply();
      const sendRes = await sendWA(supabase, phone, reply);

      await supabase.from("wa_chat_messages").insert({
        phone, contact_name: contactName, direction: "out",
        message: reply, ai_used: false,
        status: sendRes.ok ? "sent" : "failed",
        raw: { send_result: sendRes, media_auto_reply: true },
      });

      return new Response(JSON.stringify({ ok: true, replied: true, sent: sendRes.ok, media_auto_reply: true }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (text && isSharePosterText(text)) {
      const reply = sharePosterReply();
      const sendRes = await sendWA(supabase, phone, reply);

      await supabase.from("wa_chat_messages").insert({
        phone, contact_name: contactName, direction: "out",
        message: reply, ai_used: false,
        status: sendRes.ok ? "sent" : "failed",
        raw: { send_result: sendRes, share_poster_auto_reply: true },
      });

      return new Response(JSON.stringify({ ok: true, replied: true, sent: sendRes.ok, share_poster_auto_reply: true }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Load enabled KB
    const [{ data: kbRows }, { data: providerRow }] = await Promise.all([
      supabase
      .from("ai_knowledge_base")
      .select("id, question, answer, category")
      .eq("enabled", true)
      .order("sort_order"),
      supabase
        .from("ai_provider_settings")
        .select("*")
        .eq("enabled", true)
        .limit(1)
        .maybeSingle(),
    ]);
    const kb = (kbRows ?? []) as Kb[];
    const provider = (providerRow ?? null) as Provider | null;

    // Generate AI reply
    const reply = await callAI(behavior, provider, kb, text, contactName);

    // Send via WA
    const sendRes = await sendWA(supabase, phone, reply);

    // Log outgoing
    await supabase.from("wa_chat_messages").insert({
      phone, contact_name: contactName, direction: "out",
      message: reply, ai_used: true,
      status: sendRes.ok ? "sent" : "failed",
      raw: { send_result: sendRes },
    });

    return new Response(JSON.stringify({ ok: true, replied: true, sent: sendRes.ok }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("wa-webhook error", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
