import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/log-email")({ component: EmailLog });
type Row = { id: string; created_at: string; recipient_email: string; template_name: string; status: string; error_message: string | null };
const statuses: Record<string, string> = { pending: "Diproses", sent: "Diterima penyedia", failed: "Gagal", suppressed: "Diblokir penyedia", bounced: "Ditolak penerima", complained: "Dilaporkan spam", dlq: "Gagal diproses" };
const templates: Record<string, string> = { "registration-confirmation": "Pendaftaran", "berkas-confirmation": "Berkas", "esai-confirmation": "Esai" };
function EmailLog() {
  const [rows, setRows] = useState<Row[]>([]);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    let query = supabase.from("email_send_log").select("id,created_at,recipient_email,template_name,status,error_message").order("created_at", { ascending: false }).range(page * 50, page * 50 + 49);
    if (email.trim()) query = query.ilike("recipient_email", `%${email.trim().replace(/[%_,()]/g, "")}%`);
    if (status !== "all") query = query.eq("status", status);
    const { data, error: queryError } = await query;
    if (queryError) setError("Log tidak dapat dimuat. Periksa koneksi dan izin akun admin.");
    else setRows(data ?? []);
    setLoading(false);
  }, [email, status, page]);
  useEffect(() => { void load(); }, [load]);
  return <div className="space-y-5 p-4 md:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">Log Pengiriman Email</h1><p className="mt-1 text-sm text-muted-foreground">Pantau hasil permintaan pengiriman email peserta.</p></div><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Muat ulang</Button></div>
    <Card className="p-4 text-sm text-muted-foreground">“Diterima penyedia” berarti permintaan diterima layanan email, bukan jaminan email masuk ke kotak masuk. Riwayat hanya tersedia sejak pencatatan log diaktifkan.</Card>
    <div className="flex flex-wrap gap-3"><Input aria-label="Cari alamat email" placeholder="Cari alamat email" value={email} onChange={e => { setPage(0); setEmail(e.target.value); }} className="max-w-sm" /><select aria-label="Filter status" value={status} onChange={e => { setPage(0); setStatus(e.target.value); }} className="rounded-md border bg-background px-3 text-sm"><option value="all">Semua status</option>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    <Card className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b bg-muted/50"><tr>{["Waktu (WIB)", "Penerima", "Jenis email", "Status", "Keterangan"].map(x => <th key={x} className="p-3 font-semibold">{x}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-b last:border-0"><td className="p-3 whitespace-nowrap">{new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "short", timeStyle: "short" }).format(new Date(row.created_at))}</td><td className="p-3">{row.recipient_email}</td><td className="p-3">{templates[row.template_name] ?? row.template_name}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${row.status === "sent" ? "bg-green-100 text-green-800" : row.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>{statuses[row.status] ?? row.status}</span></td><td className="p-3">{row.error_message ?? "—"}</td></tr>)}</tbody></table>{(loading || error || !rows.length) && <p className="p-6 text-center text-sm text-muted-foreground">{loading ? "Memuat log..." : error || "Belum ada log untuk filter ini."}</p>}</Card>
    <div className="flex items-center justify-between text-sm"><span>Halaman {page + 1}</span><div className="flex gap-2"><Button variant="outline" disabled={page === 0 || loading} onClick={() => setPage(p => p - 1)}>Sebelumnya</Button><Button variant="outline" disabled={rows.length < 50 || loading} onClick={() => setPage(p => p + 1)}>Berikutnya</Button></div></div>
  </div>;
}
