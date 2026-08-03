import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Heart, KeyRound, Webhook } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/donasi")({
  component: AdminDonasi,
});

type DonationCfg = {
  enabled: boolean;
  title: string;
  subtitle: string;
  description: string;
  presets: number[];
  min_amount: number;
  max_amount: number;
  thank_you_message: string;
};

type MayarCfg = {
  api_key: string;
  mode: "live" | "sandbox";
  webhook_token: string;
  redirect_url: string;
};

const DEF_DON: DonationCfg = {
  enabled: false,
  title: "Dukung Program Ini",
  subtitle: "Opsional. Tidak memengaruhi seleksi.",
  description:
    "Program Beasiswa Prestasi Kita berjalan berkat dukungan banyak orang baik.",
  presets: [10000, 25000, 50000, 100000],
  min_amount: 10000,
  max_amount: 10000000,
  thank_you_message: "Terima kasih atas dukunganmu!",
};

const DEF_MAYAR: MayarCfg = { api_key: "", mode: "live", webhook_token: "", redirect_url: "" };

type DonationRow = {
  id: string;
  name: string;
  email: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "expired";
  mayar_link: string | null;
  created_at: string;
  paid_at: string | null;
};

function AdminDonasi() {
  const [don, setDon] = useState<DonationCfg>(DEF_DON);
  const [mayar, setMayar] = useState<MayarCfg>(DEF_MAYAR);
  const [presetsStr, setPresetsStr] = useState("10000,25000,50000,100000");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<DonationRow[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: d }, { data: m }, { data: list }] = await Promise.all([
        supabase.from("site_settings").select("value").eq("key", "donation").maybeSingle(),
        supabase.from("site_settings").select("value").eq("key", "mayar_config").maybeSingle(),
        supabase.from("donations").select("id,name,email,amount,status,mayar_link,created_at,paid_at").order("created_at", { ascending: false }).limit(50),
      ]);
      if (d?.value) {
        const v = { ...DEF_DON, ...(d.value as Partial<DonationCfg>) };
        setDon(v);
        setPresetsStr((v.presets ?? DEF_DON.presets).join(","));
      }
      if (m?.value) setMayar({ ...DEF_MAYAR, ...(m.value as Partial<MayarCfg>) });
      setRows((list ?? []) as DonationRow[]);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const presets = presetsStr
      .split(",")
      .map((s) => Math.floor(Number(s.trim())))
      .filter((n) => Number.isFinite(n) && n > 0);
    const donVal = { ...don, presets };
    const [r1, r2] = await Promise.all([
      supabase.from("site_settings").upsert({ key: "donation", value: donVal as never }),
      supabase.from("site_settings").upsert({ key: "mayar_config", value: mayar as never }),
    ]);
    setSaving(false);
    if (r1.error || r2.error) return toast.error(r1.error?.message || r2.error?.message || "Gagal menyimpan");
    toast.success("Pengaturan donasi tersimpan");
  };

  const projectId = (import.meta.env.VITE_SUPABASE_PROJECT_ID as string) || "";
  const webhookUrl = projectId
    ? `https://${projectId}.supabase.co/functions/v1/mayar-webhook${mayar.webhook_token ? `?token=${encodeURIComponent(mayar.webhook_token)}` : ""}`
    : "";

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" /> Donasi Sukarela
        </h1>
        <p className="text-sm text-muted-foreground">
          Aktifkan donasi opsional pasca-pendaftaran. Pembayaran diproses lewat Mayar.
        </p>
      </div>

      <Card className="rounded-2xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-semibold">Aktifkan Donasi</Label>
            <p className="text-xs text-muted-foreground">Kartu donasi muncul di halaman sukses pendaftaran.</p>
          </div>
          <Switch checked={don.enabled} onCheckedChange={(v) => setDon({ ...don, enabled: v })} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Judul</Label>
            <Input value={don.title} onChange={(e) => setDon({ ...don, title: e.target.value })} />
          </div>
          <div>
            <Label>Subjudul</Label>
            <Input value={don.subtitle} onChange={(e) => setDon({ ...don, subtitle: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Deskripsi</Label>
            <Textarea rows={3} value={don.description} onChange={(e) => setDon({ ...don, description: e.target.value })} />
          </div>
          <div>
            <Label>Preset Nominal (pisah dengan koma)</Label>
            <Input value={presetsStr} onChange={(e) => setPresetsStr(e.target.value)} placeholder="10000,25000,50000,100000" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Min Donasi</Label>
              <Input type="number" value={don.min_amount} onChange={(e) => setDon({ ...don, min_amount: Number(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Max Donasi</Label>
              <Input type="number" value={don.max_amount} onChange={(e) => setDon({ ...don, max_amount: Number(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="md:col-span-2">
            <Label>Pesan Terima Kasih</Label>
            <Textarea rows={2} value={don.thank_you_message} onChange={(e) => setDon({ ...don, thank_you_message: e.target.value })} />
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Integrasi Mayar</h2>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Dapatkan API key di dashboard Mayar → Integration → API Key. Disimpan dengan akses admin-only.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>API Key Mayar</Label>
            <Input
              type="password"
              value={mayar.api_key}
              onChange={(e) => setMayar({ ...mayar, api_key: e.target.value })}
              placeholder="mayar-..."
            />
          </div>
          <div>
            <Label>Mode</Label>
            <select
              value={mayar.mode}
              onChange={(e) => setMayar({ ...mayar, mode: e.target.value as "live" | "sandbox" })}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="live">Live</option>
              <option value="sandbox">Sandbox</option>
            </select>
          </div>
          <div>
            <Label>Redirect URL setelah bayar (opsional)</Label>
            <Input
              value={mayar.redirect_url}
              onChange={(e) => setMayar({ ...mayar, redirect_url: e.target.value })}
              placeholder="https://situs-anda.com/donasi/terima-kasih"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Webhook Token (opsional, untuk verifikasi)</Label>
            <Input
              value={mayar.webhook_token}
              onChange={(e) => setMayar({ ...mayar, webhook_token: e.target.value })}
              placeholder="string acak rahasia"
            />
          </div>
        </div>

        {webhookUrl && (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Webhook className="h-4 w-4 text-primary" /> URL Webhook Mayar
            </div>
            <code className="mt-1 block break-all text-[11px] text-muted-foreground">{webhookUrl}</code>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Salin URL ini ke dashboard Mayar → Webhook untuk update status pembayaran otomatis.
            </p>
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Simpan Pengaturan
        </Button>
      </div>

      <Card className="rounded-2xl p-6 shadow-soft">
        <h2 className="text-lg font-semibold">Riwayat Donasi (50 terbaru)</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                <th className="py-2 pr-3">Tanggal</th>
                <th className="py-2 pr-3">Nama</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Jumlah</th>
                <th className="py-2 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Belum ada donasi.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 whitespace-nowrap text-xs">{new Date(r.created_at).toLocaleString("id-ID")}</td>
                  <td className="py-2 pr-3">{r.name}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{r.email}</td>
                  <td className="py-2 pr-3 font-semibold">Rp{r.amount.toLocaleString("id-ID")}</td>
                  <td className="py-2 pr-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      r.status === "paid" ? "bg-emerald-500/15 text-emerald-700"
                        : r.status === "pending" ? "bg-amber-500/15 text-amber-700"
                        : "bg-destructive/15 text-destructive"
                    }`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
