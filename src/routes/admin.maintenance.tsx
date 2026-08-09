import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Eye, Wrench } from "lucide-react";
import { toast } from "sonner";
import { MaintenancePage, type MaintenanceConfig } from "@/components/MaintenancePage";

export const Route = createFileRoute("/admin/maintenance")({
  component: AdminMaintenance,
});

function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AdminMaintenance() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [cfg, setCfg] = useState<MaintenanceConfig & { etaLocal?: string }>({
    enabled: false,
    title: "Sedang Dalam Pemeliharaan",
    message:
      "Kami sedang melakukan pembaruan untuk memberikan pengalaman yang lebih baik. Mohon kembali sebentar lagi 🙏",
    contact_email: "",
    contact_whatsapp: "",
    etaLocal: "",
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "maintenance")
        .maybeSingle();
      const v = (data?.value as MaintenanceConfig) || {};
      setCfg({
        enabled: !!v.enabled,
        title: v.title || "Sedang Dalam Pemeliharaan",
        message:
          v.message ||
          "Kami sedang melakukan pembaruan untuk memberikan pengalaman yang lebih baik. Mohon kembali sebentar lagi 🙏",
        contact_email: v.contact_email || "",
        contact_whatsapp: v.contact_whatsapp || "",
        eta: v.eta,
        etaLocal: toLocalInput(v.eta),
      });
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload: MaintenanceConfig = {
        enabled: !!cfg.enabled,
        title: cfg.title,
        message: cfg.message,
        contact_email: cfg.contact_email,
        contact_whatsapp: cfg.contact_whatsapp,
        eta: cfg.etaLocal ? new Date(cfg.etaLocal).toISOString() : undefined,
      };
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: "maintenance", value: payload }, { onConflict: "key" });
      if (error) throw error;
      toast.success(
        payload.enabled ? "Mode Maintenance AKTIF" : "Mode Maintenance dimatikan",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan");
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

  if (preview) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Preview Halaman Maintenance</p>
          <Button size="sm" variant="outline" onClick={() => setPreview(false)}>
            Tutup Preview
          </Button>
        </div>
        <div className="overflow-hidden rounded-xl border">
          <MaintenancePage
            config={{
              ...cfg,
              eta: cfg.etaLocal ? new Date(cfg.etaLocal).toISOString() : undefined,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" /> Mode Maintenance
          </h1>
          <p className="text-sm text-muted-foreground">
            Aktifkan untuk menampilkan halaman pemeliharaan kepada semua pengunjung.
            Admin tetap dapat mengakses situs.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreview(true)}>
            <Eye className="h-4 w-4 mr-2" /> Preview
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Simpan
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4">
          <div>
            <p className="font-semibold text-foreground">Aktifkan Mode Maintenance</p>
            <p className="text-sm text-muted-foreground">
              Semua halaman publik akan menampilkan halaman pemeliharaan.
            </p>
          </div>
          <Switch
            checked={!!cfg.enabled}
            onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })}
          />
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Konten Halaman</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Judul</Label>
            <Input
              value={cfg.title || ""}
              onChange={(e) => setCfg({ ...cfg, title: e.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Pesan</Label>
            <Textarea
              rows={4}
              value={cfg.message || ""}
              onChange={(e) => setCfg({ ...cfg, message: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Estimasi Kembali Online (opsional)</Label>
            <Input
              type="datetime-local"
              value={cfg.etaLocal || ""}
              onChange={(e) => setCfg({ ...cfg, etaLocal: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Akan ditampilkan sebagai countdown.
            </p>
          </div>
          <div className="space-y-2">
            <Label>WhatsApp Kontak (opsional)</Label>
            <Input
              placeholder="0878-7834-4426"
              value={cfg.contact_whatsapp || ""}
              onChange={(e) => setCfg({ ...cfg, contact_whatsapp: e.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Email Kontak (opsional)</Label>
            <Input
              type="email"
              placeholder="info@prestasikita.com"
              value={cfg.contact_email || ""}
              onChange={(e) => setCfg({ ...cfg, contact_email: e.target.value })}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
