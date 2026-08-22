import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Search, Download, RotateCcw, Trophy, RotateCw, X, FileText, ExternalLink, Eye, Users, Award, HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import { openStoredFile } from "@/lib/storage-url";
import { exportRowsToXlsx } from "@/lib/excel-export";

export const Route = createFileRoute("/admin/kandidat")({
  component: AdminKandidat,
});

type Registration = {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  gender: string;
  birth_place: string;
  birth_date: string;
  address: string;
  education_level: string;
  school_name: string;
  grade: string;
  kind: string;
  token: string | null;
  candidate_status: "pending" | "approved" | "rejected";
  candidate_reviewed_at: string | null;
};

type Document = {
  id: string;
  registration_id: string | null;
  email: string;
  doc_type: string;
  file_url: string;
  kind: string;
};

function AdminKandidat() {
  const [regs, setRegs] = useState<Registration[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterKind, setFilterKind] = useState<"all" | "prestasi" | "ekonomi" | "umum" | "yatim">("all");
  const [detail, setDetail] = useState<Registration | null>(null);

  const load = async () => {
    setLoading(true);
    const [r, d] = await Promise.all([
      supabase
        .from("registrations")
        .select("id, full_name, email, whatsapp, gender, birth_place, birth_date, address, education_level, school_name, grade, kind, token, candidate_status, candidate_reviewed_at")
        .eq("candidate_status", "approved")
        .order("candidate_reviewed_at", { ascending: false }),
      supabase.from("documents").select("id, registration_id, email, doc_type, file_url, kind"),
    ]);
    if (r.error) toast.error(r.error.message);
    if (d.error) toast.error(d.error.message);
    setRegs((r.data ?? []) as Registration[]);
    setDocs((d.data ?? []) as Document[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const docsFor = (reg: Registration) =>
    docs.filter(
      (x) =>
        x.registration_id === reg.id ||
        (x.email.toLowerCase() === reg.email.toLowerCase() && x.kind === reg.kind),
    );

  const filtered = useMemo(() => {
    return regs.filter((r) => {
      if (filterKind !== "all" && r.kind !== filterKind) return false;
      if (q) {
        const s = q.toLowerCase();
        return (
          r.full_name.toLowerCase().includes(s) ||
          r.email.toLowerCase().includes(s) ||
          (r.school_name?.toLowerCase().includes(s) ?? false) ||
          (r.token?.toLowerCase().includes(s) ?? false)
        );
      }
      return true;
    });
  }, [regs, q, filterKind]);

  const totals = useMemo(() => {
    const prestasi = regs.filter((r) => r.kind === "prestasi").length;
    const ekonomi = regs.filter((r) => r.kind === "ekonomi").length;
    const umum = regs.filter((r) => r.kind === "umum").length;
    const yatim = regs.filter((r) => r.kind === "yatim").length;
    return { prestasi, ekonomi, umum, yatim, total: regs.length };
  }, [regs]);

  const setStatus = async (id: string, status: "pending" | "rejected") => {
    const { error } = await supabase
      .from("registrations")
      .update({ candidate_status: status, candidate_reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "pending" ? "Dikembalikan ke review" : "Dipindahkan ke daftar ditolak");
    setRegs((prev) => prev.filter((r) => r.id !== id));
    setDetail(null);
  };

  const exportExcel = async () => {
    const data = filtered.map((r) => ({
      "Nama Lengkap": r.full_name,
      Email: r.email,
      WhatsApp: r.whatsapp,
      "Jenis Kelamin": r.gender,
      "Tempat Lahir": r.birth_place,
      "Tanggal Lahir": r.birth_date,
      Alamat: r.address,
      Jenjang: r.education_level,
      Sekolah: r.school_name,
      Kelas: r.grade,
      Kategori: r.kind,
      "Disetujui Pada": r.candidate_reviewed_at ? new Date(r.candidate_reviewed_at).toLocaleString("id-ID") : "",
      "Jumlah Berkas": docsFor(r).length,
    }));
    await exportRowsToXlsx(data, "Kandidat", `kandidat-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const detailDocs = detail ? docsFor(detail) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" /> Kandidat Lolos Berkas
          </h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} kandidat disetujui · siap untuk tahap berikutnya
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}><RotateCcw className="h-4 w-4 mr-1" />Refresh</Button>
          <Button onClick={exportExcel}><Download className="h-4 w-4 mr-1" />Export Excel</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="Total Kandidat"
          value={totals.total}
          icon={<Users className="h-5 w-5" />}
          gradient="from-primary/15 to-primary/5"
          iconBg="bg-primary/15 text-primary"
        />
        <StatCard
          label="Beasiswa Prestasi"
          value={totals.prestasi}
          icon={<Award className="h-5 w-5" />}
          gradient="from-amber-500/15 to-amber-500/5"
          iconBg="bg-amber-500/15 text-amber-600"
        />
        <StatCard
          label="Beasiswa Ekonomi"
          value={totals.ekonomi}
          icon={<HeartHandshake className="h-5 w-5" />}
          gradient="from-emerald-500/15 to-emerald-500/5"
          iconBg="bg-emerald-500/15 text-emerald-600"
        />
      </div>

      <Card className="rounded-2xl p-4 shadow-soft">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, email, atau sekolah..." className="pl-9" />
          </div>
          <select value={filterKind} onChange={(e) => setFilterKind(e.target.value as "all" | "prestasi" | "ekonomi" | "umum" | "yatim")} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="all">Semua Kategori</option>
            <option value="prestasi">Prestasi</option>
            <option value="ekonomi">Ekonomi</option>
            <option value="umum">Umum</option>
            <option value="yatim">Yatim</option>
          </select>
        </div>
      </Card>

      {loading ? (
        <Card className="rounded-2xl p-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></Card>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl p-16 text-center text-sm text-muted-foreground">
          Belum ada kandidat. Setujui pendaftar dari halaman Pengiriman Berkas.
        </Card>
      ) : (
        <Card className="rounded-2xl overflow-hidden shadow-soft">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>NAMA</TableHead>
                <TableHead>KATEGORI</TableHead>
                <TableHead>SEKOLAH</TableHead>
                <TableHead className="text-center">BERKAS</TableHead>
                <TableHead>DISETUJUI</TableHead>
                <TableHead className="text-right">AKSI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const files = docsFor(r);
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.full_name}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{r.kind}</Badge></TableCell>
                    <TableCell className="text-sm">
                      <div className="truncate max-w-[200px]">{r.school_name || "-"}</div>
                      <div className="text-xs text-muted-foreground">{r.education_level}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono">{files.length}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.candidate_reviewed_at ? new Date(r.candidate_reviewed_at).toLocaleDateString("id-ID") : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button size="sm" variant="outline" onClick={() => setDetail(r)} className="h-8">
                          <Eye className="h-3.5 w-3.5 mr-1" />Detail
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Detail Kandidat
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-5">
              <div>
                <div className="text-lg font-semibold">{detail.full_name}</div>
                <Badge variant="secondary" className="capitalize mt-1">{detail.kind}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <Field label="Email" value={detail.email} />
                <Field label="WhatsApp" value={detail.whatsapp} />
                <Field label="Jenis Kelamin" value={detail.gender} />
                <Field label="Tempat, Tanggal Lahir" value={`${detail.birth_place}, ${detail.birth_date}`} />
                <Field label="Jenjang" value={detail.education_level} />
                <Field label="Kelas" value={detail.grade || "-"} />
                <Field label="Sekolah" value={detail.school_name || "-"} className="col-span-2" />
                <Field label="Alamat" value={detail.address} className="col-span-2" />
                <Field
                  label="Disetujui Pada"
                  value={detail.candidate_reviewed_at ? new Date(detail.candidate_reviewed_at).toLocaleString("id-ID") : "-"}
                  className="col-span-2"
                />
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Berkas ({detailDocs.length})
                </div>
                <div className="space-y-1.5">
                  {detailDocs.length === 0 && <div className="text-sm text-muted-foreground">Tidak ada berkas.</div>}
                  {detailDocs.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() =>
                        openStoredFile(f.file_url).catch((e: unknown) =>
                          toast.error(e instanceof Error ? e.message : "Gagal membuka berkas"),
                        )
                      }
                      className="w-full text-left flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm hover:bg-muted/60 transition"
                    >
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="flex-1 truncate">{f.doc_type}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>

                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setStatus(detail.id, "pending")}>
                  <RotateCw className="h-4 w-4 mr-1" />Reset ke Review
                </Button>
                <Button variant="outline" onClick={() => setStatus(detail.id, "rejected")} className="border-red-500/40 text-red-700 hover:bg-red-500/10">
                  <X className="h-4 w-4 mr-1" />Tolak
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function StatCard({ label, value, icon, gradient, iconBg }: { label: string; value: number; icon: React.ReactNode; gradient: string; iconBg: string }) {
  return (
    <Card className={`rounded-2xl p-4 shadow-soft bg-gradient-to-br ${gradient} border-border/60`}>
      <div className="flex items-center gap-3">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className="text-2xl font-bold text-foreground leading-tight">{value}</div>
        </div>
      </div>
    </Card>
  );
}
