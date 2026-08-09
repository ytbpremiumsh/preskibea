import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BarChart3, ExternalLink, Loader2, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});

type AnalyticsSettings = {
  ga_measurement_id?: string;
  enabled?: boolean;
};

function AdminAnalytics() {
  const [id, setId] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "analytics")
        .maybeSingle();
      const v = (data?.value ?? {}) as AnalyticsSettings;
      setId(v.ga_measurement_id ?? "");
      setEnabled(v.enabled !== false);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    const trimmed = id.trim();
    if (trimmed && !/^G-[A-Z0-9]{6,}$/i.test(trimmed)) {
      toast.error("Format Measurement ID tidak valid. Contoh: G-XXXXXXXXXX");
      return;
    }
    setSaving(true);
    const value: AnalyticsSettings = { ga_measurement_id: trimmed, enabled };
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "analytics", value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Pengaturan Google Analytics tersimpan");
  };

  if (loading) {
    return (
      <Card className="rounded-2xl p-16 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </Card>
    );
  }

  const active = enabled && id.trim().length > 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Google Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Pantau statistik pengunjung website dengan Google Analytics 4 (GA4).
          </p>
        </div>
      </div>

      <Card className="rounded-2xl p-6 shadow-soft space-y-5">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
              <p className="text-sm font-semibold text-foreground">
                Status: {active ? "Aktif" : "Nonaktif"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Aktifkan untuk mulai melacak kunjungan halaman secara otomatis.
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ga-id">Measurement ID</Label>
          <Input
            id="ga-id"
            placeholder="G-XXXXXXXXXX"
            value={id}
            onChange={(e) => setId(e.target.value.trim())}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Diawali dengan <span className="font-mono">G-</span>. Dapatkan dari Google Analytics → Admin → Aliran Data.
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Simpan
          </Button>
        </div>
      </Card>

      <Card className="rounded-2xl p-6 shadow-soft space-y-3">
        <h2 className="text-base font-bold text-foreground">Cara Mendapatkan Measurement ID</h2>
        <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground/85">
          <li>Buka <a href="https://analytics.google.com" target="_blank" rel="noreferrer" className="text-primary font-medium inline-flex items-center gap-1 hover:underline">analytics.google.com <ExternalLink className="h-3 w-3" /></a> dan login.</li>
          <li>Klik <b>Admin</b> (ikon roda gigi di kiri bawah).</li>
          <li>Buat <b>Akun</b> baru jika belum ada, lalu buat <b>Properti</b> untuk website prestasikita.com.</li>
          <li>Pada properti, pilih <b>Aliran Data → Web</b>, lalu masukkan URL situs.</li>
          <li>Salin <b>Measurement ID</b> (format <span className="font-mono">G-XXXXXXXXXX</span>) dan tempel di form di atas.</li>
          <li>Klik <b>Simpan</b>. Statistik akan mulai tercatat dalam beberapa menit.</li>
        </ol>
        <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Pelacakan kunjungan halaman otomatis aktif untuk semua halaman, termasuk navigasi antar halaman SPA.</span>
        </div>
      </Card>
    </div>
  );
}
