import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, MessageCircle, QrCode, Send, Save, CheckCircle2, PowerOff, RefreshCw, Wifi, WifiOff, FileText, RotateCcw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/whatsapp")({
  component: AdminWhatsApp,
});

type WaTemplates = {
  pendaftaran_user: string;
  pendaftaran_admin: string;
  berkas_user: string;
  berkas_admin: string;
  status_user: string;
};

type WaConfig = {
  enabled: boolean;
  api_key: string;
  device: string;
  admin_number: string;
  send_endpoint: string;
  qr_endpoint: string;
  notify_user: boolean;
  notify_admin: boolean;
  templates: WaTemplates;
};

const DEFAULT_TEMPLATES: WaTemplates = {
  pendaftaran_user: `*Prestasi Kita*\n\nHalo {nama}, pendaftaran {jenis} Anda telah kami terima.\n\n🔑 *KODE PENDAFTAR ANDA:*\n*{token}*\n\n_Simpan kode ini baik-baik. Kode wajib digunakan saat:_\n• Mengirim berkas pendukung\n• Mengecek status pendaftaran\n\nLangkah berikutnya: silakan kirim berkas pendukung melalui menu *Kirim Berkas* di website dan masukkan kode di atas.\n\nTerima kasih.`,
  pendaftaran_admin: `*Pendaftar Baru — Prestasi Kita*\n\nNama: {nama}\nJenis: {jenis}\nKode: {token}\nEmail: {email}\nWhatsApp: {whatsapp}`,
  berkas_user: `*Prestasi Kita*\n\nHalo {nama}, berkas {jenis} Anda ({jumlah_berkas} file) berhasil kami terima dan sedang dalam tahap verifikasi.\n\n🔑 Kode Pendaftar: *{token}*\nEmail: {email}\n\nGunakan kode di atas untuk *Cek Status* pendaftaran Anda di website. Kami akan menghubungi Anda kembali setelah proses verifikasi selesai.\n\nTerima kasih.`,
  berkas_admin: `*Berkas Masuk — Prestasi Kita*\n\nNama: {nama}\nJenis: {jenis}\nKode: {token}\nEmail: {email}\nJumlah file: {jumlah_berkas}`,
  status_user: `*Prestasi Kita*\n\nHalo {nama}, status pendaftaran {jenis} Anda saat ini: *{status}*.\n\n🔑 Kode Pendaftar: *{token}*\n\nTerima kasih.`,
};

const DEFAULT: WaConfig = {
  enabled: false,
  api_key: "",
  device: "",
  admin_number: "",
  send_endpoint: "https://app.ayopintar.com/send-message",
  qr_endpoint: "https://app.ayopintar.com/generate-qr",
  notify_user: true,
  notify_admin: true,
  templates: DEFAULT_TEMPLATES,
};

function AdminWhatsApp() {
  const [cfg, setCfg] = useState<WaConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [qrMsg, setQrMsg] = useState<string>("");
  const [qrLoading, setQrLoading] = useState(false);
  const [testNumber, setTestNumber] = useState("");
  const [testMsg, setTestMsg] = useState("Halo, ini pesan tes dari Prestasi Kita.");
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const checkStatus = useCallback(async (silent = false) => {
    if (!cfg.api_key || !cfg.device) return;
    setStatusLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("wa-device", {
        body: { action: "status", api_key: cfg.api_key, device: cfg.device },
      });
      if (error) throw error;
      const r = data as { connected?: boolean };
      setConnected(!!r.connected);
      if (r.connected) setQr(null);
    } catch (e: unknown) {
      if (!silent) toast.error(e instanceof Error ? e.message : "Gagal cek status");
    } finally {
      setStatusLoading(false);
    }
  }, [cfg.api_key, cfg.device]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "whatsapp").maybeSingle();
      if (data?.value) {
        const v = data.value as Partial<WaConfig>;
        setCfg({ ...DEFAULT, ...v, templates: { ...DEFAULT_TEMPLATES, ...(v.templates ?? {}) } });
      }
      setLoading(false);
    })();
  }, []);

  // Auto-check status when config ready
  useEffect(() => {
    if (!loading && cfg.api_key && cfg.device) checkStatus(true);
  }, [loading, cfg.api_key, cfg.device, checkStatus]);

  // Poll while QR shown
  useEffect(() => {
    if (!qr) return;
    const id = setInterval(() => checkStatus(true), 4000);
    return () => clearInterval(id);
  }, [qr, checkStatus]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert({ key: "whatsapp", value: cfg as never });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Pengaturan WhatsApp tersimpan");
  };

  const generateQr = async () => {
    if (!cfg.api_key || !cfg.device) return toast.error("Isi API Key & Device dulu, lalu Simpan.");
    setQrLoading(true);
    setQr(null);
    setQrMsg("");
    try {
      const { data, error } = await supabase.functions.invoke("wa-generate-qr", {
        body: { api_key: cfg.api_key, device: cfg.device },
      });
      if (error) throw error;
      const r = data as { status?: boolean; qrcode?: string; msg?: string };
      if (r.qrcode) setQr(r.qrcode);
      setQrMsg(r.msg ?? (r.qrcode ? "Scan QR dengan WhatsApp Anda" : "Tidak ada respons"));
      if (!r.qrcode && r.msg) toast.message(r.msg);
      checkStatus(true);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal generate QR");
    } finally {
      setQrLoading(false);
    }
  };

  const disconnect = async () => {
    if (!confirm("Putuskan koneksi device WhatsApp?")) return;
    setDisconnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("wa-device", {
        body: { action: "disconnect", api_key: cfg.api_key, device: cfg.device },
      });
      if (error) throw error;
      const r = data as { status?: boolean; message?: string };
      toast.success(r.message || "Device diputus");
      setConnected(false);
      setQr(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal disconnect");
    } finally {
      setDisconnecting(false);
    }
  };

  const sendTest = async () => {
    if (!testNumber) return toast.error("Masukkan nomor tujuan");
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: { type: "test", to: testNumber, message: testMsg },
      });
      if (error) throw error;
      const r = data as { ok?: boolean; error?: string; skipped?: string };
      if (r.skipped === "wa_disabled") return toast.error("WA dinonaktifkan. Aktifkan dulu lalu simpan.");
      if (!r.ok) return toast.error(r.error || "Gagal kirim");
      toast.success("Pesan test terkirim (cek log device)");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal kirim");
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-primary" /> WhatsApp Notifikasi (MPWA)
        </h1>
        <p className="text-sm text-muted-foreground">Kirim notifikasi otomatis saat pendaftaran & pengiriman berkas via gateway app.ayopintar.com.</p>
      </div>

      {/* Status Card */}
      <Card className={`rounded-2xl p-6 shadow-soft border-2 transition-colors ${connected ? "border-emerald-500/40 bg-emerald-500/5" : connected === false ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${connected ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                {connected ? <Wifi className="h-7 w-7" /> : <WifiOff className="h-7 w-7" />}
              </div>
              {connected && (
                <>
                  <span className="absolute inset-0 rounded-2xl bg-emerald-500/30 animate-ping" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-background" />
                  </span>
                </>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status Device</p>
              <p className={`text-xl font-bold ${connected ? "text-emerald-600" : connected === false ? "text-destructive" : "text-foreground"}`}>
                {connected === null ? "Belum dicek" : connected ? "Terhubung" : "Tidak Terhubung"}
              </p>
              {cfg.device && <p className="text-xs text-muted-foreground mt-0.5">Device: {cfg.device}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => checkStatus()} disabled={statusLoading}>
              {statusLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Cek Status
            </Button>
            {connected && (
              <Button variant="destructive" size="sm" onClick={disconnect} disabled={disconnecting}>
                {disconnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PowerOff className="h-4 w-4 mr-2" />}
                Disconnect
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-semibold">Aktifkan Notifikasi WhatsApp</Label>
            <p className="text-xs text-muted-foreground">Saat OFF, semua pengiriman pesan dilewati.</p>
          </div>
          <Switch checked={cfg.enabled} onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>API Key</Label>
            <Input type="password" value={cfg.api_key} onChange={(e) => setCfg({ ...cfg, api_key: e.target.value })} placeholder="API Key MPWA" />
          </div>
          <div>
            <Label>Device / Sender</Label>
            <Input value={cfg.device} onChange={(e) => setCfg({ ...cfg, device: e.target.value })} placeholder="Nomor device, mis. 6281234567890" />
          </div>
          <div>
            <Label>Nomor Admin (penerima notifikasi)</Label>
            <Input value={cfg.admin_number} onChange={(e) => setCfg({ ...cfg, admin_number: e.target.value })} placeholder="6281234567890" />
          </div>
          <div>
            <Label>Endpoint Send Message</Label>
            <Input value={cfg.send_endpoint} onChange={(e) => setCfg({ ...cfg, send_endpoint: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Endpoint Generate QR</Label>
            <Input value={cfg.qr_endpoint} onChange={(e) => setCfg({ ...cfg, qr_endpoint: e.target.value })} />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 pt-2">
          <label className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm">Kirim ke pendaftar</span>
            <Switch checked={cfg.notify_user} onCheckedChange={(v) => setCfg({ ...cfg, notify_user: v })} />
          </label>
          <label className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm">Kirim ke admin</span>
            <Switch checked={cfg.notify_admin} onCheckedChange={(v) => setCfg({ ...cfg, notify_admin: v })} />
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Simpan
          </Button>
        </div>
      </Card>

      <Card className="rounded-2xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2"><QrCode className="h-5 w-5 text-primary" />Hubungkan Device</h2>
            <p className="text-xs text-muted-foreground">Klik Generate QR lalu scan di WhatsApp → Perangkat Tertaut.</p>
          </div>
          <Button onClick={generateQr} disabled={qrLoading || connected === true} variant="outline">
            {qrLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <QrCode className="h-4 w-4 mr-2" />}
            Generate QR
          </Button>
        </div>
        {connected && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 text-emerald-700 p-3 text-sm">
            <CheckCircle2 className="h-4 w-4" /> Device sudah terhubung. Tidak perlu generate QR lagi.
          </div>
        )}
        {qr && (
          <div className="flex flex-col items-center gap-2 rounded-xl bg-muted/30 p-4">
            <img src={qr} alt="QR WhatsApp" className="h-64 w-64 rounded-lg border bg-white p-2" />
            <p className="text-xs text-muted-foreground">{qrMsg}</p>
            <p className="text-[11px] text-muted-foreground">Mengecek status koneksi otomatis setiap 4 detik…</p>
          </div>
        )}
        {!qr && qrMsg && !connected && <p className="text-sm text-center text-muted-foreground">{qrMsg}</p>}
      </Card>

      <Card className="rounded-2xl p-6 shadow-soft space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Template Pesan WhatsApp</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Variabel: <code className="px-1 rounded bg-muted">{"{nama}"}</code> <code className="px-1 rounded bg-muted">{"{jenis}"}</code> <code className="px-1 rounded bg-muted">{"{token}"}</code> <code className="px-1 rounded bg-muted">{"{email}"}</code> <code className="px-1 rounded bg-muted">{"{whatsapp}"}</code> <code className="px-1 rounded bg-muted">{"{jumlah_berkas}"}</code> <code className="px-1 rounded bg-muted">{"{status}"}</code>
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCfg({ ...cfg, templates: DEFAULT_TEMPLATES })}>
            <RotateCcw className="h-4 w-4 mr-2" /> Reset Default
          </Button>
        </div>

        {([
          { key: "pendaftaran_user", label: "Pendaftaran — ke Pendaftar" },
          { key: "pendaftaran_admin", label: "Pendaftaran — ke Admin" },
          { key: "berkas_user", label: "Pengiriman Berkas — ke Pendaftar" },
          { key: "berkas_admin", label: "Pengiriman Berkas — ke Admin" },
          { key: "status_user", label: "Update Status — ke Pendaftar" },
        ] as const).map((t) => (
          <div key={t.key} className="space-y-1.5">
            <Label className="text-sm font-medium">{t.label}</Label>
            <Textarea
              rows={5}
              value={cfg.templates[t.key]}
              onChange={(e) => setCfg({ ...cfg, templates: { ...cfg.templates, [t.key]: e.target.value } })}
              className="font-mono text-xs"
            />
          </div>
        ))}

        <div className="flex justify-end pt-1">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Simpan Template
          </Button>
        </div>
      </Card>

      <Card className="rounded-2xl p-6 shadow-soft space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Send className="h-5 w-5 text-primary" />Tes Kirim Pesan</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Nomor Tujuan</Label>
            <Input value={testNumber} onChange={(e) => setTestNumber(e.target.value)} placeholder="6281234567890" />
          </div>
          <div>
            <Label>Pesan</Label>
            <Input value={testMsg} onChange={(e) => setTestMsg(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={sendTest} disabled={testing}>
            {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Kirim Tes
          </Button>
        </div>
      </Card>
    </div>
  );
}
