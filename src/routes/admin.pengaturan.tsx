import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Save, Award } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";

export const Route = createFileRoute("/admin/pengaturan")({
  component: AdminSettings,
});

type CountdownSetting = { deadline: string; title: string; subtitle: string };
type Stage = { title: string; desc: string; date: string; startDate?: string };

// Convert ISO/timestamp from DB into value compatible with <input type="datetime-local">
function toLocalInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [countdown, setCountdown] = useState<CountdownSetting>({
    deadline: "",
    title: "Pendaftaran Ditutup Dalam",
    subtitle: "",
  });
  const [stages, setStages] = useState<Stage[]>([]);
  const [certConfig, setCertConfig] = useState<{ enabled: boolean; releaseDate: string }>({ 
    enabled: true, 
    releaseDate: "" 
  });
  const [branding, setBranding] = useState<{ 
    header_logo_url: string; 
    footer_logo_url: string;
    hero_image_url: string;
    alumni_images: string[];
  }>({
    header_logo_url: "",
    footer_logo_url: "",
    hero_image_url: "",
    alumni_images: ["", "", ""],
  });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("site_settings").select("key,value");
      const cd = data?.find((d) => d.key === "countdown")?.value as CountdownSetting | undefined;
      const tl = data?.find((d) => d.key === "timeline")?.value as Stage[] | undefined;
      const cc = data?.find((d) => d.key === "certificate_config")?.value as { enabled: boolean; releaseDate?: string } | undefined;
      const br = data?.find((d) => d.key === "branding")?.value as { 
        header_logo_url?: string; 
        footer_logo_url?: string; 
        hero_image_url?: string;
        alumni_images?: string[];
      } | undefined;
      
      if (cd) setCountdown({ ...cd, deadline: toLocalInput(cd.deadline) });
      if (Array.isArray(tl))
        setStages(tl.map((s) => ({ ...s, date: s.date ? s.date.slice(0, 10) : "", startDate: s.startDate ? s.startDate.slice(0, 10) : "" })));
      if (cc) setCertConfig({ 
        enabled: cc.enabled, 
        releaseDate: cc.releaseDate ? toLocalInput(cc.releaseDate) : "" 
      });
      if (br) setBranding({
        header_logo_url: br.header_logo_url || "",
        footer_logo_url: br.footer_logo_url || "",
        hero_image_url: br.hero_image_url || "",
        alumni_images: br.alumni_images?.length ? br.alumni_images : ["", "", ""],
      });
      setLoading(false);
    };
    load();
  }, []);

  const updateStage = (i: number, patch: Partial<Stage>) =>
    setStages((s) => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const addStage = () =>
    setStages((s) => [...s, { title: "Tahap Baru", desc: "", date: "" }]);

  const removeStage = (i: number) => setStages((s) => s.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    try {
      const deadlineISO = countdown.deadline ? new Date(countdown.deadline).toISOString() : "";
      const cdPayload = { ...countdown, deadline: deadlineISO };

      const releaseDateISO = certConfig.releaseDate ? new Date(certConfig.releaseDate).toISOString() : "";
      const ccPayload = { ...certConfig, releaseDate: releaseDateISO };

      const { error: e1 } = await supabase
        .from("site_settings")
        .upsert({ key: "countdown", value: cdPayload }, { onConflict: "key" });
      if (e1) throw e1;

      const { error: e2 } = await supabase
        .from("site_settings")
        .upsert({ key: "timeline", value: stages }, { onConflict: "key" });
      if (e2) throw e2;

      const { error: e3 } = await supabase
        .from("site_settings")
        .upsert({ key: "certificate_config", value: ccPayload }, { onConflict: "key" });
      if (e3) throw e3;

      const { error: e4 } = await supabase
        .from("site_settings")
        .upsert({ key: "branding", value: branding }, { onConflict: "key" });
      if (e4) throw e4;

      toast.success("Pengaturan berhasil disimpan");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal menyimpan pengaturan";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pengaturan Halaman</h1>
          <p className="text-sm text-muted-foreground">
            Atur countdown pendaftaran dan tanggal tahapan seleksi yang tampil di halaman utama.
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Simpan Perubahan
        </Button>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Countdown Pendaftaran</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tanggal &amp; Jam Berakhir</Label>
            <Input
              type="datetime-local"
              value={countdown.deadline}
              onChange={(e) => setCountdown({ ...countdown, deadline: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Judul</Label>
            <Input
              value={countdown.title}
              onChange={(e) => setCountdown({ ...countdown, title: e.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Subtitle</Label>
            <Textarea
              rows={2}
              value={countdown.subtitle}
              onChange={(e) => setCountdown({ ...countdown, subtitle: e.target.value })}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <ImagePlus className="h-5 w-5" />
          <h2 className="text-lg font-semibold text-foreground">Branding (Logo & Gambar)</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Masukkan URL gambar yang dihosting di VPS atau server eksternal Anda untuk mengganti gambar default.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>URL Logo Header</Label>
            <Input
              placeholder="https://vps-anda.com/logo-header.png"
              value={branding.header_logo_url}
              onChange={(e) => setBranding({ ...branding, header_logo_url: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>URL Logo Footer</Label>
            <Input
              placeholder="https://vps-anda.com/logo-footer.png"
              value={branding.footer_logo_url}
              onChange={(e) => setBranding({ ...branding, footer_logo_url: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>URL Hero Image (Landing Page)</Label>
            <Input
              placeholder="https://vps-anda.com/hero-students.png"
              value={branding.hero_image_url}
              onChange={(e) => setBranding({ ...branding, hero_image_url: e.target.value })}
            />
          </div>
        </div>

        <div className="pt-4 space-y-4 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground">Foto Peraih Beasiswa (Alumni Section)</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {branding.alumni_images.map((url, i) => (
              <div key={i} className="space-y-2">
                <Label className="text-xs">Foto Alumni #{i + 1}</Label>
                <Input
                  placeholder={`URL Foto Alumni ${i + 1}`}
                  value={url}
                  onChange={(e) => {
                    const newUrls = [...branding.alumni_images];
                    newUrls[i] = e.target.value;
                    setBranding({ ...branding, alumni_images: newUrls });
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Pengaturan Sertifikat</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold">Aktifkan E-Sertifikat</Label>
              <p className="text-xs text-muted-foreground">
                Izinkan pendaftar mengunduh sertifikat dari halaman Cek Status.
              </p>
            </div>
            <Switch
              checked={certConfig.enabled}
              onCheckedChange={(v) => setCertConfig({ ...certConfig, enabled: v })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Tanggal & Jam Rilis Unduhan</Label>
            <Input
              type="datetime-local"
              value={certConfig.releaseDate}
              onChange={(e) => setCertConfig({ ...certConfig, releaseDate: e.target.value })}
            />
            <p className="text-[11px] text-muted-foreground">
              Tentukan kapan tombol unduh sertifikat akan muncul bagi peserta yang sudah terverifikasi.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-foreground">Tahapan Seleksi</h2>
          <Button variant="outline" size="sm" onClick={addStage}>
            <Plus className="h-4 w-4 mr-1" /> Tambah Tahap
          </Button>
        </div>
        <div className="space-y-4">
          {stages.map((s, i) => (
            <div key={i} className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Tahap {i + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => removeStage(i)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Judul</Label>
                  <Input value={s.title} onChange={(e) => updateStage(i, { title: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tanggal Mulai (Dibuka)</Label>
                  <Input
                    type="date"
                    value={s.startDate || ""}
                    onChange={(e) => updateStage(i, { startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tanggal Selesai / Batas</Label>
                  <Input
                    type="date"
                    value={s.date}
                    onChange={(e) => updateStage(i, { date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Deskripsi</Label>
                  <Input value={s.desc} onChange={(e) => updateStage(i, { desc: e.target.value })} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
