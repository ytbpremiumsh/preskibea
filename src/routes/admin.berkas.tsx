import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Loader2,
  Search,
  Download,
  FileText,
  ExternalLink,
  RotateCcw,
  Trash2,
  User,
  Check,
  X,
  Eye,
  Users,
  Award,
  HeartHandshake,
} from "lucide-react";
import { toast } from "sonner";
import { exportRowsToXlsx } from "@/lib/excel-export";
import { TokenBadge } from "@/components/admin/TokenBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { uniqueLatestDocuments } from "@/lib/document-utils";

export const Route = createFileRoute("/admin/berkas")({
  component: AdminBerkas,
});

type CandidateStatus = "pending" | "approved" | "rejected";

type Document = {
  id: string;
  registration_id: string | null;
  email: string;
  doc_type: string;
  file_url: string;
  kind: string;
  created_at: string;
};

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
  candidate_status: CandidateStatus;
};

type Group = {
  key: string;
  reg?: Registration;
  email: string;
  kind: string;
  items: Document[];
  latest: string;
  status: CandidateStatus;
};

function AdminBerkas() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterKind, setFilterKind] = useState<"all" | "prestasi" | "ekonomi" | "umum" | "yatim">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | CandidateStatus>("all");
  const [detail, setDetail] = useState<Group | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    const [d, r] = await Promise.all([
      supabase.from("documents").select("*").order("created_at", { ascending: false }),
      supabase
        .from("registrations")
        .select(
          "id, full_name, email, whatsapp, gender, birth_place, birth_date, address, education_level, school_name, grade, kind, token, candidate_status",
        ),
    ]);
    if (d.error) toast.error(d.error.message);
    if (r.error) toast.error(r.error.message);
    setDocs((d.data ?? []) as Document[]);
    setRegs((r.data ?? []) as Registration[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const findReg = (
    doc: Pick<Document, "registration_id" | "email" | "kind">,
  ): Registration | undefined => {
    if (doc.registration_id) {
      const byId = regs.find((r) => r.id === doc.registration_id);
      if (byId) return byId;
    }
    return regs.find(
      (r) => r.email.toLowerCase() === doc.email.toLowerCase() && r.kind === doc.kind,
    );
  };

  const grouped = useMemo<Group[]>(() => {
    const map = new Map<string, Document[]>();
    for (const d of docs) {
      const key = `${d.email.toLowerCase()}__${d.kind}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    let rows: Group[] = Array.from(map.entries()).map(([key, items]) => {
      const reg = findReg(items[0]);
      const uniqueItems = uniqueLatestDocuments(items);
      return {
        key,
        reg,
        email: items[0].email,
        kind: items[0].kind,
        items: uniqueItems,
        latest: uniqueItems[0]?.created_at,
        status: (reg?.candidate_status ?? "pending") as CandidateStatus,
      };
    });
    if (filterKind !== "all") rows = rows.filter((r) => r.kind === filterKind);
    if (filterStatus !== "all") rows = rows.filter((r) => r.status === filterStatus);
    if (q) {
      const s = q.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.email.toLowerCase().includes(s) ||
          (r.reg?.full_name.toLowerCase().includes(s) ?? false) ||
          (r.reg?.school_name.toLowerCase().includes(s) ?? false) ||
          (r.reg?.token?.toLowerCase().includes(s) ?? false) ||
          r.items.some((i) => i.doc_type.toLowerCase().includes(s)),
      );
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs, regs, filterKind, filterStatus, q]);

  const exportExcel = async () => {
    const data = docs.map((d) => {
      const r = findReg(d);
      return {
        Kode: r?.token ?? "",
        "Nama Lengkap": r?.full_name ?? "",
        Email: d.email,
        WhatsApp: r?.whatsapp ?? "",
        "Jenis Kelamin": r?.gender ?? "",
        "Tempat Lahir": r?.birth_place ?? "",
        "Tanggal Lahir": r?.birth_date ?? "",
        Alamat: r?.address ?? "",
        Jenjang: r?.education_level ?? "",
        Sekolah: r?.school_name ?? "",
        Kelas: r?.grade ?? "",
        Kategori: d.kind,
        "Jenis Berkas": d.doc_type,
        "Status Kandidat": r?.candidate_status ?? "pending",
        "Link File": d.file_url,
        "Tanggal Kirim": new Date(d.created_at).toLocaleString("id-ID"),
      };
    });
    await exportRowsToXlsx(data, "Berkas", `pengiriman-berkas-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const updateCandidate = async (
    regId: string | undefined,
    status: CandidateStatus,
    fallback?: { email: string; kind: string },
  ) => {
    let id = regId;
    if (!id && fallback) {
      const r = regs.find(
        (x) => x.email.toLowerCase() === fallback.email.toLowerCase() && x.kind === fallback.kind,
      );
      id = r?.id;
    }
    if (!id) return toast.error("Pendaftar tidak ditemukan di database");
    const { error } = await supabase
      .from("registrations")
      .update({ candidate_status: status, candidate_reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(
      status === "approved"
        ? "Disetujui & dipindah ke halaman Kandidat"
        : status === "rejected"
          ? "Pendaftar ditolak"
          : "Status direset",
    );
    setRegs((prev) => prev.map((r) => (r.id === id ? { ...r, candidate_status: status } : r)));
    setDetail((prev) => (prev ? { ...prev, status } : prev));
  };

  const removeDoc = async (id: string) => {
    if (!confirm("Hapus berkas ini?")) return;
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Berkas dihapus");
    setDocs((prev) => prev.filter((d) => d.id !== id));
    setDetail((prev) => (prev ? { ...prev, items: prev.items.filter((x) => x.id !== id) } : prev));
  };

  const toggleOne = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === grouped.length) setSelected(new Set());
    else setSelected(new Set(grouped.map((g) => g.key)));
  };
  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Hapus ${selected.size} pengirim beserta semua berkasnya?`)) return;
    const ids = grouped.filter((g) => selected.has(g.key)).flatMap((g) => g.items.map((i) => i.id));
    const { error } = await supabase.from("documents").delete().in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`${ids.length} berkas dihapus`);
    setDocs((prev) => prev.filter((d) => !ids.includes(d.id)));
    setSelected(new Set());
  };

  const statusBadge = (s: CandidateStatus) => {
    if (s === "approved")
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20">
          ✓ Kandidat
        </Badge>
      );
    if (s === "rejected")
      return (
        <Badge className="bg-red-500/15 text-red-700 border-red-500/30 hover:bg-red-500/20">
          ✕ Ditolak
        </Badge>
      );
    return (
      <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 hover:bg-amber-500/20">
        ⏳ Menunggu
      </Badge>
    );
  };

  const totals = useMemo(() => {
    const all = Array.from(
      new Map(docs.map((d) => [`${d.email.toLowerCase()}__${d.kind}`, d])).values(),
    );
    const prestasi = all.filter((d) => d.kind === "prestasi").length;
    const ekonomi = all.filter((d) => d.kind === "ekonomi").length;
    return { prestasi, ekonomi, total: all.length };
  }, [docs]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pengiriman Berkas</h1>
          <p className="text-sm text-muted-foreground">
            {grouped.length} pengirim · {docs.length} berkas total
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          {selected.size > 0 && (
            <Button variant="destructive" onClick={bulkDelete}>
              <Trash2 className="h-4 w-4 mr-1" />
              Hapus ({selected.size})
            </Button>
          )}
          <Button onClick={exportExcel}>
            <Download className="h-4 w-4 mr-1" />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="Total Pengirim Berkas"
          value={totals.total}
          icon={<Users className="h-5 w-5" />}
          gradient="from-primary/15 to-primary/5"
          iconBg="bg-primary/15 text-primary"
        />
        <StatCard
          label="Berkas Prestasi"
          value={totals.prestasi}
          icon={<Award className="h-5 w-5" />}
          gradient="from-amber-500/15 to-amber-500/5"
          iconBg="bg-amber-500/15 text-amber-600"
        />
        <StatCard
          label="Berkas Ekonomi"
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
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama, email, sekolah, kode token, atau jenis berkas..."
              className="pl-9"
            />
          </div>
          <select
            value={filterKind}
            onChange={(e) => setFilterKind(e.target.value as "all" | "prestasi" | "ekonomi" | "umum" | "yatim")}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">Semua Kategori</option>
            <option value="prestasi">Prestasi</option>
            <option value="ekonomi">Ekonomi</option>
            <option value="umum">Umum</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as "all" | CandidateStatus)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu Review</option>
            <option value="approved">Disetujui (Kandidat)</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>
      </Card>

      {loading ? (
        <Card className="rounded-2xl p-16 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </Card>
      ) : grouped.length === 0 ? (
        <Card className="rounded-2xl p-16 text-center text-sm text-muted-foreground">
          Belum ada berkas terkirim.
        </Card>
      ) : (
        <Card className="rounded-2xl overflow-hidden shadow-soft">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-10">
                  <Checkbox
                    checked={grouped.length > 0 && selected.size === grouped.length}
                    onCheckedChange={toggleAll}
                    aria-label="Pilih semua"
                  />
                </TableHead>
                <TableHead>NAMA</TableHead>
                <TableHead>KODE TOKEN</TableHead>
                <TableHead>KATEGORI</TableHead>
                <TableHead>SEKOLAH</TableHead>
                <TableHead>BERKAS</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead className="text-right">AKSI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grouped.map((g) => (
                <TableRow
                  key={g.key}
                  className="align-top"
                  data-state={selected.has(g.key) ? "selected" : undefined}
                >
                  <TableCell>
                    <Checkbox
                      checked={selected.has(g.key)}
                      onCheckedChange={() => toggleOne(g.key)}
                      aria-label="Pilih baris"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      <User className="h-4 w-4 text-primary shrink-0" />
                      {g.reg?.full_name ?? (
                        <span className="text-muted-foreground italic">Tidak terdaftar</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{g.email}</div>
                  </TableCell>
                  <TableCell>
                    <TokenBadge token={g.reg?.token} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {g.kind}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {g.reg ? (
                      <>
                        <div>{g.reg.school_name || "-"}</div>
                        <div className="text-xs text-muted-foreground">
                          {g.reg.education_level} {g.reg.grade && `· ${g.reg.grade}`}
                        </div>
                      </>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{g.items.length} file</Badge>
                  </TableCell>
                  <TableCell>{statusBadge(g.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDetail(g)}
                      className="h-8"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {detail?.reg?.full_name ?? detail?.email}
            </DialogTitle>
          </DialogHeader>

          {detail && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {statusBadge(detail.status)}
                <Badge variant="secondary" className="capitalize">
                  {detail.kind}
                </Badge>
                <Badge variant="outline">{detail.items.length} file</Badge>
                <TokenBadge token={detail.reg?.token} size="md" />
              </div>

              {detail.reg ? (
                <div className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-lg border border-border bg-muted/20 p-3 text-sm sm:grid-cols-2">
                  <Info label="Email" value={detail.reg.email} />
                  <Info label="WhatsApp" value={detail.reg.whatsapp} />
                  <Info label="Jenis Kelamin" value={detail.reg.gender} />
                  <Info
                    label="Tempat / Tgl Lahir"
                    value={`${detail.reg.birth_place}, ${detail.reg.birth_date}`}
                  />
                  <Info label="Jenjang" value={detail.reg.education_level} />
                  <Info label="Kelas" value={detail.reg.grade} />
                  <Info label="Sekolah" value={detail.reg.school_name} className="sm:col-span-2" />
                  <Info label="Alamat" value={detail.reg.address} className="sm:col-span-2" />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                  Pengirim tidak ditemukan di data pendaftar. Email: {detail.email}
                </div>
              )}

              <div>
                <div className="mb-2 text-sm font-semibold">Berkas Terkirim</div>
                <div className="grid gap-2">
                  {detail.items.map((d) => (
                    <div
                      key={d.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
                    >
                      <a
                        href={d.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-start gap-2 text-sm flex-1 min-w-0"
                      >
                        <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="font-medium break-words">{d.doc_type}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      </a>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Hapus"
                        onClick={() => removeDoc(d.id)}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                <Button
                  variant="outline"
                  disabled={!detail.reg || detail.status === "rejected"}
                  onClick={() =>
                    updateCandidate(detail.reg?.id, "rejected", {
                      email: detail.email,
                      kind: detail.kind,
                    })
                  }
                  className="border-red-500/40 text-red-700 hover:bg-red-500/10"
                >
                  <X className="h-4 w-4 mr-1" />
                  Tolak
                </Button>
                <Button
                  disabled={!detail.reg || detail.status === "approved"}
                  onClick={() =>
                    updateCandidate(detail.reg?.id, "approved", {
                      email: detail.email,
                      kind: detail.kind,
                    })
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Setujui
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <span className="text-muted-foreground">{label}: </span>
      <span className="text-foreground break-words">{value || "-"}</span>
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
