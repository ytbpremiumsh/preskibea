import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Save, Settings, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_PESERTA_SETTINGS,
  normalizePesertaSettings,
  type PesertaSettings,
} from "@/lib/peserta-settings";

export const Route = createFileRoute("/admin/dashboard-peserta")({
  component: DashboardPesertaAdmin,
});
type Report = {
  id: string;
  registration_id: string;
  subject: string;
  message: string;
  status: string;
  admin_reply: string | null;
  image_path: string | null;
  created_at: string;
  registrations: { full_name: string; token: string } | null;
};
function DashboardPesertaAdmin() {
  const [settings, setSettings] = useState<PesertaSettings>(DEFAULT_PESERTA_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportError, setReportError] = useState<string | null>(null);
  const [active, setActive] = useState<"settings" | "reports">("settings");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [savingReport, setSavingReport] = useState<string | null>(null);
  const db = supabase as any;
  const loadReports = useCallback(async () => {
    const all: Report[] = [];
    for (let from = 0; ; from += 500) {
      const { data, error } = await db
        .from("peserta_reports")
        .select(
          "id,registration_id,subject,message,status,admin_reply,image_path,created_at,registrations(full_name,token)",
        )
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, from + 499);
      if (error) {
        setReportError(
          "Laporan belum dapat dimuat. Pastikan layanan dashboard peserta sudah disiapkan.",
        );
        return;
      }
      all.push(...(data ?? []));
      if (!data || data.length < 500) break;
    }
    setReportError(null);
    setReports(all);
  }, []);
  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "peserta_dashboard")
        .maybeSingle();
      if (error) toast.error("Pengaturan gagal dimuat");
      else setSettings(normalizePesertaSettings(data?.value));
      setLoading(false);
    })();
    void loadReports();
  }, [loadReports]);
  const set = <K extends keyof PesertaSettings>(key: K, value: PesertaSettings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));
  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "peserta_dashboard", value: settings });
    setSaving(false);
    if (error) toast.error("Pengaturan gagal disimpan: " + error.message);
    else toast.success("Pengaturan dashboard peserta disimpan");
  };
  const updateReport = async (report: Report, status: string) => {
    setSavingReport(report.id);
    const reply = (editing[report.id] ?? report.admin_reply ?? "").trim();
    const { error } = await db
      .from("peserta_reports")
      .update({ status, admin_reply: reply || null })
      .eq("id", report.id);
    setSavingReport(null);
    if (error) toast.error("Laporan gagal diperbarui");
    else {
      toast.success("Laporan diperbarui");
      await loadReports();
    }
  };
  const viewImage = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("peserta-kendala")
      .createSignedUrl(path, 60);
    if (error || !data?.signedUrl) return toast.error("Lampiran tidak dapat dibuka");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };
  const shown = reports.filter((r) => filter === "all" || r.status === filter);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Peserta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atur menu, konten benefit, dan tanggapi laporan kendala peserta.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant={active === "settings" ? "default" : "outline"}
          onClick={() => setActive("settings")}
        >
          <Settings className="mr-2 h-4 w-4" />
          Pengaturan
        </Button>
        <Button
          variant={active === "reports" ? "default" : "outline"}
          onClick={() => setActive("reports")}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Laporan Kendala
        </Button>
      </div>
      {active === "settings" && (
        <section className="max-w-3xl space-y-5 rounded-2xl border bg-card p-6">
          {loading ? (
            <Loader2 className="animate-spin" />
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
                <h3 className="font-semibold">Aktifkan tab</h3>
                {(
                  [
                    ["status_enabled", "Tahapan Saya"],
                    ["reports_enabled", "Laporan Kendala"],
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
      )}
      {active === "reports" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Filter status laporan"
              className="rounded-lg border bg-background p-2 text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Semua laporan</option>
              <option value="open">Menunggu</option>
              <option value="resolved">Selesai</option>
            </select>
            <Button variant="outline" onClick={() => void loadReports()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Segarkan
            </Button>
            <span className="text-xs text-muted-foreground">
              Menampilkan {shown.length} laporan
            </span>
          </div>
          {reportError && (
            <p role="alert" className="text-sm text-destructive">
              {reportError}
            </p>
          )}
          {!shown.length && !reportError && (
            <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
              Belum ada laporan.
            </p>
          )}
          {shown.map((r) => (
            <article key={r.id} className="space-y-3 rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{r.subject}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.registrations?.full_name ?? "Peserta"} · {r.registrations?.token ?? "—"} ·{" "}
                    {new Date(r.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}{" "}
                    WIB
                  </p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs">
                  {r.status === "resolved" ? "Selesai" : "Menunggu"}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{r.message}</p>
              {r.image_path && (
                <button
                  className="text-sm font-semibold text-primary"
                  onClick={() => void viewImage(r.image_path!)}
                >
                  Buka lampiran gambar
                </button>
              )}
              <label className="block text-sm font-semibold">
                Balasan untuk peserta
                <textarea
                  className="mt-2 min-h-20 w-full rounded-lg border bg-background p-3 font-normal"
                  maxLength={4000}
                  value={editing[r.id] ?? r.admin_reply ?? ""}
                  onChange={(e) => setEditing((x) => ({ ...x, [r.id]: e.target.value }))}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={savingReport === r.id}
                  onClick={() => void updateReport(r, r.status)}
                >
                  Simpan Balasan
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={savingReport === r.id}
                  onClick={() =>
                    void updateReport(r, r.status === "resolved" ? "open" : "resolved")
                  }
                >
                  {r.status === "resolved" ? "Tandai menunggu" : "Tandai selesai"}
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
