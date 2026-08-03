import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, RotateCcw, Send, Eye } from "lucide-react";
import { toast } from "sonner";
import { sendTestEmail } from "@/lib/api";

export const Route = createFileRoute("/admin/email-template")({
  component: AdminEmailTemplate,
});

type TplValue = { enabled: boolean; subject: string; html: string };

const TABS: { key: string; settingKey: string; label: string; templateName: "registration-confirmation" | "berkas-confirmation" }[] = [
  {
    key: "registration",
    settingKey: "email_template_registration",
    label: "Email Pendaftaran",
    templateName: "registration-confirmation",
  },
  {
    key: "berkas",
    settingKey: "email_template_berkas",
    label: "Email Pengiriman Berkas",
    templateName: "berkas-confirmation",
  },
];

const PLACEHOLDERS = [
  { k: "full_name", desc: "Nama pendaftar" },
  { k: "token", desc: "Kode pendaftar" },
  { k: "kind", desc: "prestasi / ekonomi" },
  { k: "kind_label", desc: "Beasiswa Prestasi / Ekonomi" },
  { k: "whatsapp", desc: "Nomor WA" },
  { k: "count", desc: "Jumlah berkas" },
  { k: "year", desc: "Tahun saat ini" },
  { k: "site_name", desc: "Prestasi Kita" },
];

const DEFAULT_REGISTRATION: TplValue = {
  enabled: false,
  subject: "Pendaftaran {{kind_label}} Berhasil — Kode Token Anda",
  html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff;color:#1a1530">
  <h1 style="color:#5B2A9E;margin:0 0 8px">{{site_name}}</h1>
  <p style="color:#7c7c87;margin:0 0 24px;font-size:12px;letter-spacing:1px;text-transform:uppercase">Beasiswa Section #3</p>
  <div style="border:1px solid #ece9f5;border-radius:16px;padding:28px">
    <h2>Halo, {{full_name}}!</h2>
    <p>Terima kasih telah mendaftar pada program <strong>{{kind_label}}</strong>. Pendaftaran Anda telah kami terima.</p>
    <div style="background:#f5f0ff;border:1px dashed #5B2A9E;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
      <p style="font-size:11px;color:#5B2A9E;letter-spacing:1.5px;margin:0 0 8px;text-transform:uppercase"><strong>Kode Token Pendaftar</strong></p>
      <p style="font-size:26px;font-weight:800;color:#3d1c6b;letter-spacing:2px;font-family:monospace;margin:0">{{token}}</p>
      <p style="font-size:12px;color:#6b5b8a;margin:10px 0 0">Simpan kode ini untuk pengiriman berkas & cek status.</p>
    </div>
    <p><strong>Langkah Selanjutnya</strong></p>
    <p>1. Lengkapi pengiriman berkas pendukung di halaman <em>Kirim Berkas</em> menggunakan kode token di atas.</p>
    <p>2. Tim kami akan memverifikasi data &amp; berkas Anda.</p>
    <p>3. Pengumuman dikirim via email &amp; WhatsApp ke {{whatsapp}}.</p>
    <hr style="border:none;border-top:1px solid #ece9f5;margin:20px 0">
    <p style="font-size:11px;color:#a09bb0">© {{year}} {{site_name}}</p>
  </div>
</div>`,
};

const DEFAULT_BERKAS: TplValue = {
  enabled: false,
  subject: "Berkas {{kind_label}} Berhasil Diterima",
  html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff;color:#1a1530">
  <h1 style="color:#5B2A9E;margin:0 0 8px">{{site_name}}</h1>
  <p style="color:#7c7c87;margin:0 0 24px;font-size:12px;letter-spacing:1px;text-transform:uppercase">Beasiswa Section #3</p>
  <div style="border:1px solid #ece9f5;border-radius:16px;padding:28px">
    <div style="display:inline-block;background:#e8f5ed;border-radius:20px;padding:6px 14px;margin-bottom:16px">
      <span style="font-size:11px;font-weight:800;color:#0e7c4a;letter-spacing:1px">✓ BERKAS DITERIMA</span>
    </div>
    <h2>Terima kasih, {{full_name}}!</h2>
    <p>Pengiriman berkas pendukung untuk <strong>{{kind_label}}</strong> telah berhasil kami terima.</p>
    <div style="background:#faf8ff;border:1px solid #ece9f5;border-radius:12px;padding:16px 20px;margin:20px 0">
      <p style="margin:6px 0"><span style="color:#7c7c87">Kode Pendaftar</span> &nbsp; <strong style="font-family:monospace">{{token}}</strong></p>
      <p style="margin:6px 0"><span style="color:#7c7c87">Jumlah Dokumen</span> &nbsp; <strong>{{count}} berkas</strong></p>
      <p style="margin:6px 0"><span style="color:#7c7c87">Status</span> &nbsp; <strong style="color:#b35900">Menunggu Verifikasi</strong></p>
    </div>
    <p><strong>Apa Selanjutnya?</strong></p>
    <p>Tim verifikasi akan meninjau setiap dokumen. Pastikan tautan berkas dapat diakses publik. Hasil seleksi diumumkan via email & WhatsApp.</p>
    <hr style="border:none;border-top:1px solid #ece9f5;margin:20px 0">
    <p style="font-size:11px;color:#a09bb0">© {{year}} {{site_name}}</p>
  </div>
</div>`,
};

const DEFAULTS: Record<string, TplValue> = {
  email_template_registration: DEFAULT_REGISTRATION,
  email_template_berkas: DEFAULT_BERKAS,
};

const SAMPLE_VALUES: Record<string, string> = {
  full_name: "Andi Pratama",
  token: "KP-PRE-A1B2C3",
  kind: "prestasi",
  kind_label: "Beasiswa Prestasi",
  whatsapp: "08123456789",
  count: "5",
  year: String(new Date().getFullYear()),
  site_name: "Prestasi Kita",
};

function applySample(str: string) {
  return str.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => SAMPLE_VALUES[k] ?? "");
}

function AdminEmailTemplate() {
  const [activeKey, setActiveKey] = useState(TABS[0].key);
  const tab = TABS.find((t) => t.key === activeKey)!;
  const [value, setValue] = useState<TplValue>(DEFAULTS[tab.settingKey]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const htmlRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const sendTest = sendTestEmail;

  useEffect(() => {
    setLoading(true);
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", tab.settingKey)
      .maybeSingle()
      .then(({ data }) => {
        const v = (data?.value as TplValue | null) ?? DEFAULTS[tab.settingKey];
        setValue({
          enabled: !!v.enabled,
          subject: v.subject || DEFAULTS[tab.settingKey].subject,
          html: v.html || DEFAULTS[tab.settingKey].html,
        });
        setLoading(false);
      });
  }, [tab.settingKey]);

  const previewHtml = useMemo(() => applySample(value.html), [value.html]);
  const previewSubject = useMemo(() => applySample(value.subject), [value.subject]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: tab.settingKey, value: value as never }, { onConflict: "key" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Template email disimpan");
  };

  const reset = async () => {
    if (!confirm("Reset template ke bawaan? Perubahan saat ini akan dihapus.")) return;
    const def = DEFAULTS[tab.settingKey];
    setValue(def);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: tab.settingKey, value: def as never }, { onConflict: "key" });
    if (error) toast.error(error.message);
    else toast.success("Direset ke default");
  };

  const insertPlaceholder = (k: string) => {
    const token = `{{${k}}}`;
    const ta = htmlRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? value.html.length;
    const end = ta.selectionEnd ?? value.html.length;
    const next = value.html.slice(0, start) + token + value.html.slice(end);
    setValue((s) => ({ ...s, html: next }));
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const insertPlaceholderSubject = (k: string) => {
    const token = `{{${k}}}`;
    const ta = subjectRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? value.subject.length;
    const end = ta.selectionEnd ?? value.subject.length;
    const next = value.subject.slice(0, start) + token + value.subject.slice(end);
    setValue((s) => ({ ...s, subject: next }));
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const sendTestNow = async () => {
    if (!testEmail) {
      toast.error("Isi email tujuan dulu");
      return;
    }
    setSendingTest(true);
    try {
      await sendTest({
        data: {
          templateName: tab.templateName,
          recipientEmail: testEmail,
          subject: value.subject,
          html: value.html,
        },
      });
      toast.success(`Email test dikirim ke ${testEmail}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Gagal mengirim email test");
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Template Email</h1>
        <p className="text-sm text-muted-foreground">
          Atur isi email yang otomatis dikirim saat pendaftaran & pengiriman berkas berhasil. Gunakan placeholder <code>{`{{full_name}}`}</code>, <code>{`{{token}}`}</code>, dst.
        </p>
      </div>

      <Card className="rounded-2xl p-2 shadow-soft">
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveKey(t.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${activeKey === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-2xl p-4 md:p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div>
                <Label className="text-sm font-semibold">Aktifkan template kustom</Label>
                <p className="text-xs text-muted-foreground">Jika nonaktif, sistem memakai template bawaan.</p>
              </div>
              <Switch
                checked={value.enabled}
                onCheckedChange={(c) => setValue((s) => ({ ...s, enabled: c }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                ref={subjectRef}
                value={value.subject}
                onChange={(e) => setValue((s) => ({ ...s, subject: e.target.value }))}
                placeholder="Subject email"
              />
              <div className="flex flex-wrap gap-1">
                {PLACEHOLDERS.map((p) => (
                  <button
                    key={p.k}
                    type="button"
                    onClick={() => insertPlaceholderSubject(p.k)}
                    className="rounded-full border bg-background px-2 py-0.5 text-[11px] hover:bg-muted"
                    title={p.desc}
                  >
                    {`{{${p.k}}}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>HTML Body</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview((s) => !s)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {showPreview ? "Sembunyikan Preview" : "Tampilkan Preview"}
                </Button>
              </div>
              <Textarea
                ref={htmlRef}
                value={value.html}
                onChange={(e) => setValue((s) => ({ ...s, html: e.target.value }))}
                className="min-h-[360px] font-mono text-xs"
              />
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Sisipkan placeholder:</p>
                <div className="flex flex-wrap gap-1">
                  {PLACEHOLDERS.map((p) => (
                    <button
                      key={p.k}
                      type="button"
                      onClick={() => insertPlaceholder(p.k)}
                      className="rounded-full border bg-background px-2 py-0.5 text-[11px] hover:bg-muted"
                      title={p.desc}
                    >
                      {`{{${p.k}}}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
              <Label className="text-sm font-semibold">Kirim Email Test</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="email@tujuan.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <Button onClick={sendTestNow} disabled={sendingTest}>
                  {sendingTest ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      Kirim
                    </>
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Email test memakai data sampel: {SAMPLE_VALUES.full_name}, token {SAMPLE_VALUES.token}.
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={reset}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset ke Default
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Simpan
              </Button>
            </div>
          </Card>

          {showPreview && (
            <Card className="rounded-2xl p-4 md:p-6 shadow-soft space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview Subject</p>
                <p className="mt-1 text-sm font-semibold">{previewSubject}</p>
              </div>
              <div className="rounded-lg border bg-white">
                <iframe
                  title="email-preview"
                  srcDoc={previewHtml}
                  className="h-[600px] w-full rounded-lg"
                  sandbox=""
                />
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
