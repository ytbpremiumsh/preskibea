import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, Save, Megaphone } from "lucide-react";
import { toast } from "sonner";
import type { AdPosition, AdSlotConfig } from "@/components/ads/AdSettings";

export const Route = createFileRoute("/admin/adsense")({
  component: AdminAdsense,
});

type AdSenseConfig = {
  enabled: boolean;
  publisher_id: string;
  ads_txt: string;
  header_code?: string;
  footer_code?: string;
};

const POSITIONS: { value: AdPosition; label: string }[] = [
  { value: "top_of_page", label: "Atas halaman (semua halaman)" },
  { value: "bottom_of_page", label: "Bawah halaman (semua halaman)" },
  { value: "after_first_section", label: "Setelah section pertama (CPC tinggi)" },
  { value: "sticky_bottom", label: "Anchor melayang bawah layar (CPC tertinggi)" },
  { value: "before_each_image", label: "Sebelum setiap gambar" },
  { value: "after_each_image", label: "Sesudah setiap gambar" },
  { value: "before_each_heading", label: "Sebelum setiap judul (H2/H3)" },
  { value: "after_each_heading", label: "Sesudah setiap judul (H2/H3)" },
  { value: "after_each_paragraph", label: "Sesudah setiap paragraf" },
  { value: "between_sections", label: "Di antara setiap section" },
  { value: "before_timeline_button", label: "Sebelum tombol Timeline (tertarget)" },
  { value: "before_each_button", label: "Sebelum setiap tombol/CTA" },
  { value: "before_each_nav_link", label: "Sebelum tombol navigasi (menuju halaman lain)" },
  { value: "after_each_nav_link", label: "Sesudah tombol navigasi (menuju halaman lain)" },
  { value: "before_each_card", label: "Sebelum setiap card" },
  { value: "after_each_card", label: "Sesudah setiap card" },
];

function newSlot(): AdSlotConfig {
  return {
    id: crypto.randomUUID(),
    name: "Slot Baru",
    code: "",
    position: "after_each_paragraph",
    every_nth: 3,
    max_per_page: 3,
    enabled: true,
  };
}

function AdminAdsense() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adsense, setAdsense] = useState<AdSenseConfig>({
    enabled: false,
    publisher_id: "",
    ads_txt: "",
  });
  const [slots, setSlots] = useState<AdSlotConfig[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key,value")
        .in("key", ["adsense", "ad_slots"]);
      const a = data?.find((d) => d.key === "adsense")?.value as AdSenseConfig | undefined;
      const s = data?.find((d) => d.key === "ad_slots")?.value as AdSlotConfig[] | undefined;
      if (a) setAdsense(a);
      if (Array.isArray(s)) {
        setSlots(
          s.map((x) => ({
            id: x.id || crypto.randomUUID(),
            name: x.name || "Slot",
            code: x.code || "",
            position: (x.position as AdPosition) || "after_each_paragraph",
            every_nth: x.every_nth ?? 3,
            max_per_page: x.max_per_page ?? 3,
            enabled: x.enabled ?? true,
          })),
        );
      }
      setLoading(false);
    };
    load();
  }, []);

  const updateSlot = (i: number, patch: Partial<AdSlotConfig>) =>
    setSlots((arr) => arr.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const removeSlot = (i: number) => setSlots((arr) => arr.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    try {
      const pid = adsense.publisher_id.trim();
      if (adsense.enabled && pid && !pid.startsWith("ca-pub-")) {
        toast.error("Publisher ID harus berformat ca-pub-XXXXXXXXXXXXXXXX");
        setSaving(false);
        return;
      }
      const { error: e1 } = await supabase
        .from("site_settings")
        .upsert(
          { key: "adsense", value: { ...adsense, publisher_id: pid } },
          { onConflict: "key" },
        );
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("site_settings")
        .upsert({ key: "ad_slots", value: slots }, { onConflict: "key" });
      if (e2) throw e2;
      toast.success("Pengaturan AdSense disimpan");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal menyimpan";
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
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" /> Quick AdSense
          </h1>
          <p className="text-sm text-muted-foreground">
            Aktifkan Google AdSense, kelola publisher ID, ads.txt, dan slot iklan otomatis ke seluruh halaman.
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Simpan
        </Button>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Konfigurasi AdSense</h2>
            <p className="text-xs text-muted-foreground">
              Skrip AdSense hanya dimuat jika status Aktif &amp; Publisher ID terisi.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="ads-enabled" className="text-sm">Aktif</Label>
            <Switch
              id="ads-enabled"
              checked={adsense.enabled}
              onCheckedChange={(v) => setAdsense({ ...adsense, enabled: v })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Publisher ID (Client ID)</Label>
          <Input
            placeholder="ca-pub-XXXXXXXXXXXXXXXX"
            value={adsense.publisher_id}
            onChange={(e) => setAdsense({ ...adsense, publisher_id: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Konten ads.txt (akan disajikan di /ads.txt)</Label>
          <Textarea
            rows={4}
            placeholder="google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0"
            value={adsense.ads_txt}
            onChange={(e) => setAdsense({ ...adsense, ads_txt: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Salin baris yang Google AdSense berikan. URL publik:&nbsp;
            <code className="rounded bg-muted px-1 py-0.5">/ads.txt</code>
          </p>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Slot Iklan Otomatis</h2>
            <p className="text-xs text-muted-foreground">
              Tempel kode iklan lengkap dari AdSense (tag <code>&lt;ins&gt;</code> + <code>&lt;script&gt;</code>),
              pilih posisi otomatisnya, dan iklan akan tampil di seluruh halaman publik.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSlots((s) => [...s, newSlot()])}>
            <Plus className="h-4 w-4 mr-1" /> Tambah Slot
          </Button>
        </div>

        {slots.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Belum ada slot iklan. Klik <span className="font-medium">Tambah Slot</span> untuk membuat.
          </div>
        )}

        <div className="space-y-4">
          {slots.map((s, i) => (
            <div key={s.id} className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Slot {i + 1}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`en-${s.id}`} className="text-xs">Aktif</Label>
                    <Switch
                      id={`en-${s.id}`}
                      checked={s.enabled}
                      onCheckedChange={(v) => updateSlot(i, { enabled: v })}
                    />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeSlot(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nama (untuk admin)</Label>
                  <Input value={s.name} onChange={(e) => updateSlot(i, { name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Posisi otomatis</Label>
                  <Select
                    value={s.position}
                    onValueChange={(v) => updateSlot(i, { position: v as AdPosition })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Setiap ke-berapa? (untuk posisi berulang)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={s.every_nth ?? 1}
                    onChange={(e) => updateSlot(i, { every_nth: Math.max(1, Number(e.target.value) || 1) })}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Contoh: 3 = setiap paragraf/gambar/heading ke-3.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Maksimal per halaman</Label>
                  <Input
                    type="number"
                    min={1}
                    value={s.max_per_page ?? 3}
                    onChange={(e) => updateSlot(i, { max_per_page: Math.max(1, Number(e.target.value) || 1) })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Kode iklan lengkap (HTML + script)</Label>
                <Textarea
                  rows={6}
                  className="font-mono text-xs"
                  placeholder={`<ins class="adsbygoogle"\n     style="display:block"\n     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"\n     data-ad-slot="1234567890"\n     data-ad-format="auto"\n     data-full-width-responsive="true"></ins>\n<script>\n     (adsbygoogle = window.adsbygoogle || []).push({});\n</script>`}
                  value={s.code}
                  onChange={(e) => updateSlot(i, { code: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground">
                  Tempel persis seperti yang diberikan AdSense. Tag <code>&lt;script&gt;</code> akan dieksekusi otomatis.
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
