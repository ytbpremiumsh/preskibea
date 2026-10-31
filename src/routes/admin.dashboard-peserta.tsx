import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_PESERTA_SETTINGS,
  normalizePesertaSettings,
  whatsappChannelUrl,
  type PesertaSettings,
} from "@/lib/peserta-settings";

export const Route = createFileRoute("/admin/dashboard-peserta")({
  component: DashboardPesertaAdmin,
});
function DashboardPesertaAdmin() {
  const [settings, setSettings] = useState<PesertaSettings>(DEFAULT_PESERTA_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "peserta_dashboard")
          .maybeSingle();
        if (error) throw error;
        if (active) setSettings(normalizePesertaSettings(data?.value));
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  const set = <K extends keyof PesertaSettings>(key: K, value: PesertaSettings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));
  const save = async () => {
    if (saving || loadError) return;
    if (
      settings.whatsapp_channel_url.trim() &&
      !whatsappChannelUrl(settings.whatsapp_channel_url)
    ) {
      toast.error(
        "Masukkan tautan channel WhatsApp yang valid, misalnya https://whatsapp.com/channel/…",
      );
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "peserta_dashboard", value: settings });
    setSaving(false);
    if (error) toast.error("Pengaturan gagal disimpan: " + error.message);
    else toast.success("Pengaturan dashboard peserta disimpan");
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Peserta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atur judul, menu, dan konten benefit untuk peserta.
        </p>
      </div>
      <section className="max-w-3xl space-y-5 rounded-2xl border bg-card p-6">
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : loadError ? (
          <p role="alert" className="text-sm text-destructive">
            Pengaturan belum dapat dimuat. Silakan muat ulang halaman.
          </p>
        ) : (
          <>
            <h2 className="text-lg font-bold">Konten dashboard</h2>
            <label className="block space-y-2 text-sm font-semibold">
              Judul dashboard
              <Input
                value={settings.title}
                maxLength={80}
                onChange={(e) => set("title", e.target.value)}
              />
            </label>
            <label className="block space-y-2 text-sm font-semibold">
              Pesan selamat datang
              <textarea
                className="min-h-20 w-full rounded-lg border bg-background p-3 font-normal"
                maxLength={500}
                value={settings.welcome}
                onChange={(e) => set("welcome", e.target.value)}
              />
            </label>
            <div className="space-y-4 border-y py-5">
              <h3 className="font-semibold">Aktifkan menu</h3>
              {(
                [
                  ["status_enabled", "Tahapan Saya"],
                  ["benefits_enabled", "Benefit"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <label htmlFor={key} className="text-sm">
                    {label}
                  </label>
                  <Switch id={key} checked={settings[key]} onCheckedChange={(v) => set(key, v)} />
                </div>
              ))}
            </div>
            <label className="block space-y-2 text-sm font-semibold">
              Judul benefit
              <Input
                value={settings.benefits_title}
                maxLength={100}
                onChange={(e) => set("benefits_title", e.target.value)}
              />
            </label>
            <label className="block space-y-2 text-sm font-semibold">
              Isi benefit
              <textarea
                className="min-h-40 w-full rounded-lg border bg-background p-3 font-normal"
                maxLength={5000}
                value={settings.benefits_text}
                onChange={(e) => set("benefits_text", e.target.value)}
                placeholder="Masukkan rincian benefit peserta"
              />
            </label>
            <label className="block space-y-2 text-sm font-semibold">
              URL Channel WhatsApp
              <Input
                type="url"
                placeholder="https://whatsapp.com/channel/..."
                value={settings.whatsapp_channel_url}
                maxLength={2048}
                onChange={(e) => set("whatsapp_channel_url", e.target.value)}
              />
              <span className="block text-xs font-normal text-muted-foreground">
                Kosongkan jika belum ada channel. Tautan akan muncul pada menu Benefit.
              </span>
            </label>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Simpan Pengaturan
            </Button>
          </>
        )}
      </section>
    </div>
  );
}
