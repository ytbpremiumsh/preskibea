import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquare, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reportRequest, type ParticipantReport } from "@/lib/reports";
import { toast } from "sonner";
export const Route = createFileRoute("/admin/laporan-kendala")({ component: AdminReports });
function AdminReports() {
  const [reports, setReports] = useState<ParticipantReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const data = await reportRequest({ action: "admin-list" }); setReports(data.reports || []); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat laporan."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const visible = reports.filter((r) => (filter === "all" || r.status === filter) && `${r.subject} ${r.registrations?.full_name} ${r.registrations?.token}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">Laporan Kendala</h1><p className="mt-2 text-sm text-muted-foreground">{reports.filter((r) => r.status === "open").length} menunggu tindak lanjut · {reports.filter((r) => r.status === "resolved").length} selesai</p></div><Button variant="outline" disabled={loading} onClick={() => void load()}><RefreshCw />Muat ulang</Button></div>
    <div className="flex flex-wrap gap-3"><Input aria-label="Cari laporan" placeholder="Cari judul, nama, atau kode peserta…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" /><select aria-label="Filter status laporan" value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="all">Semua status</option><option value="open">Menunggu tindak lanjut</option><option value="resolved">Selesai</option></select></div>
    {loading ? <Loader2 className="animate-spin" /> : error ? <p role="alert" className="text-destructive">{error}</p> : !visible.length ? <p className="py-12 text-center text-muted-foreground">Tidak ada laporan kendala.</p> : <div className="grid items-start gap-5 xl:grid-cols-2">{visible.map((report) => <ReportEditor key={report.id} report={report} onSaved={load} />)}</div>}
    <p className="text-xs text-muted-foreground">Menampilkan maksimal 200 laporan terbaru.</p>
  </div>;
}
function ReportEditor({ report, onSaved }: { report: ParticipantReport; onSaved: () => Promise<void> }) {
  const [reply, setReply] = useState(report.admin_reply || "");
  const [status, setStatus] = useState(report.status);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try { await reportRequest({ action: "admin-update", id: report.id, status, admin_reply: reply }); toast.success("Tanggapan dan status tersimpan."); await onSaved(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Gagal menyimpan."); }
    finally { setSaving(false); }
  };
  return <article className="min-w-0 space-y-4 rounded-md border bg-card p-5">
    <div><div className="flex items-start gap-2"><MessageSquare className="mt-1 h-4 w-4 shrink-0 text-primary" /><h2 className="break-words text-lg font-bold">{report.subject}</h2></div><p className="mt-2 break-words text-sm">{report.registrations?.full_name} · <span className="font-mono">{report.registrations?.token}</span></p><p className="mt-1 text-xs text-muted-foreground">#{report.id.slice(0,8).toUpperCase()} · {new Date(report.created_at).toLocaleString("id-ID")}</p></div>
    <p className="whitespace-pre-wrap break-words text-sm leading-6">{report.message}</p>
    {report.image_url && <a href={report.image_url} target="_blank" rel="noopener noreferrer"><img src={report.image_url} alt={`Screenshot ${report.subject}`} className="max-h-64 max-w-full rounded-md border object-contain" /></a>}
    <label className="block space-y-2 text-sm font-medium">Tanggapan admin<textarea value={reply} maxLength={4000} onChange={(e) => setReply(e.target.value)} className="min-h-24 w-full rounded-md border bg-background p-3 font-normal" /></label>
    <div className="flex flex-wrap items-end justify-between gap-3"><label className="space-y-2 text-sm font-medium">Status<select className="block rounded-md border bg-background px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value === "resolved" ? "resolved" : "open")}><option value="open">Menunggu tindak lanjut</option><option value="resolved">Selesai</option></select></label><Button disabled={saving} onClick={() => void save()}>{saving ? <Loader2 className="animate-spin" /> : <Save />}Simpan tanggapan</Button></div>
  </article>;
}