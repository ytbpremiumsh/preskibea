// Send WhatsApp notification via MPWA (app.ayopintar.com) gateway
// Public endpoint - called from registration & document submit flows
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Payload = {
  type: "pendaftaran" | "berkas" | "status" | "test";
  full_name?: string;
  email?: string;
  whatsapp?: string; // recipient WA number (pendaftar)
  kind?: "prestasi" | "ekonomi" | "umum";
  doc_count?: number;
  status?: string;
  token?: string;
  to?: string; // override recipient (admin test)
  message?: string; // override message (admin test)
};

function normalizeNumber(raw: string): string {
  let n = (raw || "").replace(/\D/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  if (n.startsWith("8")) n = "62" + n;
  return n;
}

const DEFAULT_TEMPLATES = {
  pendaftaran_user: `*Prestasi Kita*\n\nHalo {nama}, pendaftaran {jenis} Anda telah kami terima.\n\n🔑 *KODE PENDAFTAR ANDA:*\n*{token}*\n\n_Simpan kode ini baik-baik. Kode wajib digunakan saat:_\n• Mengirim berkas pendukung\n• Mengecek status pendaftaran\n\nLangkah berikutnya: silakan kirim berkas pendukung melalui menu *Kirim Berkas* di website dan masukkan kode di atas.\n\nTerima kasih.`,
  pendaftaran_admin: `*Pendaftar Baru — Prestasi Kita*\n\nNama: {nama}\nJenis: {jenis}\nKode: {token}\nEmail: {email}\nWhatsApp: {whatsapp}`,
  berkas_user: `*Prestasi Kita*\n\nBerkas {jenis} dari email {email} ({jumlah_berkas} file) berhasil kami terima dan sedang dalam tahap verifikasi.\n\nKami akan menghubungi Anda kembali setelah proses selesai.`,
  berkas_admin: `*Berkas Masuk — Prestasi Kita*\n\nJenis: {jenis}\nEmail: {email}\nJumlah file: {jumlah_berkas}`,
  status_user: `*Prestasi Kita*\n\nHalo {nama}, status pendaftaran {jenis} Anda saat ini: *{status}*.`,
};

function fillTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "-");
}

type Templates = Partial<typeof DEFAULT_TEMPLATES>;

function buildMessage(p: Payload, tpls: Templates, audience: "user" | "admin"): string {
  if (p.message) return p.message;
  const jenis = p.kind === "prestasi" ? "Beasiswa Prestasi" : p.kind === "ekonomi" ? "Beasiswa Ekonomi" : p.kind === "umum" ? "Beasiswa Umum" : "Beasiswa";
  const vars = {
    nama: p.full_name ?? "Pendaftar",
    jenis,
    email: p.email ?? "-",
    whatsapp: p.whatsapp ?? "-",
    jumlah_berkas: String(p.doc_count ?? 0),
    status: p.status ?? "-",
    token: p.token ?? "-",
  };
  let key: keyof typeof DEFAULT_TEMPLATES | null = null;
  if (p.type === "pendaftaran") key = audience === "admin" ? "pendaftaran_admin" : "pendaftaran_user";
  else if (p.type === "berkas") key = audience === "admin" ? "berkas_admin" : "berkas_user";
  else if (p.type === "status") key = "status_user";
  if (!key) return "Test pesan dari Prestasi Kita.";
  const tpl = tpls[key] || DEFAULT_TEMPLATES[key];
  return fillTemplate(tpl, vars);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = (await req.json()) as Payload;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: row } = await supabase.from("site_settings").select("value").eq("key", "whatsapp").maybeSingle();
    const cfg = (row?.value ?? {}) as {
      enabled?: boolean;
      api_key?: string;
      device?: string;
      admin_number?: string;
      send_endpoint?: string;
      notify_user?: boolean;
      notify_admin?: boolean;
    };

    if (!cfg.enabled) {
      return new Response(JSON.stringify({ ok: false, skipped: "wa_disabled" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!cfg.api_key || !cfg.device) {
      return new Response(JSON.stringify({ ok: false, error: "missing_config" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const endpoint = cfg.send_endpoint || "https://app.ayopintar.com/send-message";
    const tpls = ((cfg as { templates?: Templates }).templates) || {};

    // Lookup nomor WA + nama + token dari registrations jika tidak diberikan / kosong
    if (!body.to && (!body.whatsapp || !body.full_name || !body.token) && body.email && body.kind) {
      const { data: reg } = await supabase
        .from("registrations")
        .select("full_name, whatsapp, token")
        .ilike("email", body.email)
        .eq("kind", body.kind)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (reg) {
        if (!body.whatsapp) body.whatsapp = reg.whatsapp ?? "";
        if (!body.full_name) body.full_name = reg.full_name ?? "";
        if (!body.token) body.token = (reg as { token?: string }).token ?? "";
      }
    }

    const targets: Array<{ to: string; audience: "user" | "admin" }> = [];
    if (body.to) targets.push({ to: body.to, audience: "user" });
    else {
      if (cfg.notify_user !== false && body.whatsapp) targets.push({ to: body.whatsapp, audience: "user" });
      if (cfg.notify_admin !== false && cfg.admin_number) targets.push({ to: cfg.admin_number, audience: "admin" });
    }
    console.log("send-whatsapp targets", { type: body.type, kind: body.kind, email: body.email, count: targets.length });

    const results: Array<{ to: string; ok: boolean; resp?: unknown }> = [];
    for (const t of targets) {
      const number = normalizeNumber(t.to);
      if (!number) continue;
      const message = buildMessage(body, tpls, t.audience);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: cfg.api_key,
          sender: cfg.device,
          number,
          message,
        }),
      });
      let json: unknown = null;
      try { json = await res.json(); } catch { /* ignore */ }
      results.push({ to: number, ok: res.ok, resp: json });
    }
    return new Response(JSON.stringify({ ok: true, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
