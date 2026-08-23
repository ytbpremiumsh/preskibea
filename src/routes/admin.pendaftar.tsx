import { createFileRoute, useNavigate } from "@tanstack/react-router";
/**
 * Perbaikan: Menambahkan sistem paginasi (20/50 per halaman) pada daftar pendaftar admin agar lebih rapi dan ringan saat di-scroll.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, Download, FileText, ExternalLink, RotateCcw, Trash2, Users, Award, HeartHandshake, FileCheck, Zap, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { openStoredFile } from "@/lib/storage-url";
import { exportRowsToXlsx, exportRowsToCsv } from "@/lib/excel-export";
import { TokenBadge } from "@/components/admin/TokenBadge";
import { uniqueLatestDocuments } from "@/lib/document-utils";

export const Route = createFileRoute("/admin/pendaftar")({
  component: AdminPendaftar,
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
  kind: "prestasi" | "ekonomi" | "umum" | "yatim";
  khs_url?: string | null;
  transcript_custom_url?: string | null;
  additional_docs_url?: string | null;
  tiktok_video_url?: string | null;
  status: "pending" | "verified" | "approved" | "rejected";
  token?: string | null;
  fast_track?: boolean | null;
  payment_status?: string | null;
  extra?: Record<string, unknown> | null;
  parent_income: string | null;
  dependents: number | null;
  main_achievement: string | null;
  photo_url: string | null;
  student_card_url: string | null;
  created_at: string;
};

type Document = {
  id: string;
  registration_id: string | null;
  email: string;
  doc_type: string;
  file_url: string;
  kind: string;
  created_at: string;
};

function AdminPendaftar() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Registration[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterKind, setFilterKind] = useState<"all" | "prestasi" | "ekonomi" | "umum" | "yatim">("all");
  const [filterBerkas, setFilterBerkas] = useState<"all" | "submitted" | "pending">("all");
  const [filterJalur, setFilterJalur] = useState<"all" | "fast" | "premium" | "reguler">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedRow, setSelectedRow] = useState<Registration | null>(null);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Handle URL params for filtering from Dashboard
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const kind = searchParams.get("kind");
    if (kind && ["prestasi", "ekonomi", "umum", "yatim"].includes(kind)) {
      setFilterKind(kind as any);
    }
  }, []);

  const load = async () => {
    setLoading(true);
    const [r, d] = await Promise.all([
      supabase.from("registrations").select("*").order("created_at", { ascending: false }),
      supabase.from("documents").select("*").order("created_at", { ascending: false }),
    ]);
    if (r.error) toast.error(r.error.message);
    setRows((r.data ?? []) as Registration[]);
    setDocs((d.data ?? []) as Document[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Realtime: refresh saat ada perubahan pendaftar / berkas / status pembayaran
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refresh = async () => {
      const [r, d] = await Promise.all([
        supabase.from("registrations").select("*").order("created_at", { ascending: false }),
        supabase.from("documents").select("*").order("created_at", { ascending: false }),
      ]);
      setRows((r.data ?? []) as Registration[]);
      setDocs((d.data ?? []) as Document[]);
    };
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(refresh, 500);
    };
    const channel = supabase
      .channel("admin-pendaftar-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "registrations" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "documents" }, schedule)
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  const docsForRow = (r: Registration) => {
    const matched = docs.filter(
      (d) =>
        d.registration_id === r.id ||
        (d.email.toLowerCase() === r.email.toLowerCase() && d.kind === r.kind),
    );
    return uniqueLatestDocuments(matched);
  };

  // Fast Track Premium yang sudah lunas otomatis dianggap lolos Esai & Berkas
  const isAutoPremium = (r: Registration) =>
    !!r.fast_track &&
    (r.extra as any)?.fast_track_type === "premium" &&
    (r as any).payment_status === "paid";

  const berkasDone = (r: Registration) => isAutoPremium(r) || docsForRow(r).length > 0;

  const counts = useMemo(() => {
    let submitted = 0;
    let pending = 0;
    for (const r of rows) {
      if (berkasDone(r)) submitted++;
      else pending++;
    }
    return { submitted, pending };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, docs]);

  const totals = useMemo(() => {
    const byKind = (k: string) => rows.filter((r) => r.kind === k).length;
    const fast = rows.filter((r) => !!r.fast_track).length;
    const premium = rows.filter((r) => !!r.fast_track && (r.extra as any)?.fast_track_type === "premium").length;
    return {
      prestasi: byKind("prestasi"),
      ekonomi: byKind("ekonomi"),
      umum: byKind("umum"),
      yatim: byKind("yatim"),
      fast,
      premium,
      total: rows.length,
    };
  }, [rows]);


  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filterKind !== "all" && r.kind !== filterKind) return false;
      const isPremium = !!r.fast_track && (r.extra as any)?.fast_track_type === "premium";
      if (filterJalur === "fast" && !r.fast_track) return false;
      if (filterJalur === "premium" && !isPremium) return false;
      if (filterJalur === "reguler" && r.fast_track) return false;
      const hasDocs = docsForRow(r).length > 0;
      if (filterBerkas === "submitted" && !hasDocs) return false;
      if (filterBerkas === "pending" && hasDocs) return false;

      if (q) {
        const s = q.toLowerCase();
        return (
          r.full_name.toLowerCase().includes(s) ||
          r.email.toLowerCase().includes(s) ||
          (r.token?.toLowerCase().includes(s) ?? false) ||
          r.school_name.toLowerCase().includes(s)
        );
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, filterKind, filterBerkas, filterJalur, docs]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [q, filterKind, filterBerkas, filterJalur, pageSize]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  const setPayment = async (r: Registration, next: "paid" | "pending") => {
    if (next === "paid") {
      if (!confirm(`Validasi manual pembayaran Fast Track untuk "${r.full_name}"?`)) return;
    } else {
      if (!confirm(`PERINGATAN: Batalkan validasi pembayaran Fast Track untuk "${r.full_name}"?\nStatus akan kembali menjadi pending.`)) return;
    }

    const { error } = await supabase
      .from("registrations")
      .update({ payment_status: next, status: next === "paid" ? "verified" : "pending" })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, payment_status: next, status: (next === "paid" ? "verified" : "pending") as Registration["status"] } : x)));
    toast.success(next === "paid" ? "Fast Track tervalidasi" : "Validasi dibatalkan");
  };

  const exportExcel = async () => {
    const data = filtered.map((r) => ({
      Kode: r.token ?? "",
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
      Status: r.status,
      "Penghasilan Ortu": r.parent_income ?? "",
      Tanggungan: r.dependents ?? "",
      Prestasi: r.main_achievement ?? "",
      "Tanggal Daftar": new Date(r.created_at).toLocaleString("id-ID"),
    }));
    await exportRowsToXlsx(data, "Pendaftar", `pendaftar-beasiswa-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportCSV = () => {
    const data = filtered.map((r) => ({
      Kode: r.token ?? "",
      "Nama Lengkap": r.full_name,
      Email: r.email,
      WhatsApp: r.whatsapp,
      "Jenis Kelamin": r.gender,
      "Tempat Lahir": r.birth_place,
      "Tanggal Lahir": r.birth_date,
      Alamat: r.address?.replace(/\n/g, " "),
      Jenjang: r.education_level,
      Sekolah: r.school_name,
      Kelas: r.grade,
      Kategori: r.kind,
      Status: r.status,
      "Penghasilan Ortu": r.parent_income ?? "",
      Tanggungan: r.dependents ?? "",
      Prestasi: r.main_achievement?.replace(/\n/g, " ") ?? "",
      "Tanggal Daftar": new Date(r.created_at).toLocaleString("id-ID"),
    }));
    exportRowsToCsv(data, `pendaftar-beasiswa-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  };
  const deleteIds = async (ids: string[]) => {
    if (ids.length === 0) return;
    const deletedRows = rows.filter((r) => ids.includes(r.id));
    const { error } = await supabase.from("registrations").delete().in("id", ids);
    if (error) return toast.error(error.message);
    for (const row of deletedRows) {
      await supabase.from("documents").delete().eq("email", row.email).eq("kind", row.kind);
    }
    toast.success(`${ids.length} pendaftar dihapus`);
    setRows((prev) => prev.filter((r) => !ids.includes(r.id)));
    setDocs((prev) =>
      prev.filter(
        (d) =>
          !ids.includes(d.registration_id ?? "") &&
          !deletedRows.some((r) => r.email === d.email && r.kind === d.kind),
      ),
    );
    setSelected(new Set());
  };
  const bulkDelete = () => {
    if (selected.size === 0) return;
    if (!confirm(`Hapus ${selected.size} pendaftar beserta berkasnya?`)) return;
    deleteIds(Array.from(selected));
  };
  const deleteOne = (r: Registration) => {
    if (!confirm(`Hapus pendaftar "${r.full_name}"?`)) return;
    deleteIds([r.id]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pendaftar</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} dari {rows.length} pendaftar
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
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
          <Button onClick={exportExcel}>
            <Download className="h-4 w-4 mr-1" />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Main Stats Row */}
        <StatCard
          label="Total Pendaftar"
          value={totals.total}
          icon={<Users className="h-6 w-6" />}
          gradient="bg-white"
          iconBg="bg-primary/10 text-primary border border-primary/20"
          className="border-2 border-primary/20 shadow-soft p-5"
        />
        <StatCard
          label="Sudah Kirim Berkas"
          value={counts.submitted}
          icon={<FileCheck className="h-6 w-6" />}
          gradient="bg-white"
          iconBg="bg-sky-500/10 text-sky-600 border border-sky-500/20"
          className="border-2 border-sky-500/20 shadow-soft p-5"
        />
        <StatCard
          label="Fast Track"
          value={totals.fast}
          icon={<Zap className="h-6 w-6" />}
          gradient="bg-white"
          iconBg="bg-amber-500/10 text-amber-600 border border-amber-500/20"
          className="border-2 border-amber-500/20 shadow-soft p-5"
        />
        <StatCard
          label="Belum Kirim"
          value={counts.pending}
          icon={<Clock className="h-6 w-6" />}
          gradient="bg-white"
          iconBg="bg-slate-500/10 text-slate-600 border border-slate-500/20"
          className="border-2 border-slate-500/20 shadow-soft p-5"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Category Stats Row */}
        <StatCard
          label="Beasiswa Prestasi"
          value={totals.prestasi}
          icon={<Award className="h-5 w-5" />}
          gradient="bg-white"
          iconBg="bg-indigo-500/10 text-indigo-600 border border-indigo-500/20"
          className="border-2 border-muted hover:border-primary/20 shadow-sm p-5 transition-colors"
          isSmall
        />
        <StatCard
          label="Beasiswa Ekonomi"
          value={totals.ekonomi}
          icon={<HeartHandshake className="h-5 w-5" />}
          gradient="bg-white"
          iconBg="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
          className="border-2 border-muted hover:border-primary/20 shadow-sm p-5 transition-colors"
          isSmall
        />
        <StatCard
          label="Beasiswa Umum"
          value={totals.umum}
          icon={<Users className="h-5 w-5" />}
          gradient="bg-white"
          iconBg="bg-teal-500/10 text-teal-600 border border-teal-500/20"
          className="border-2 border-muted hover:border-primary/20 shadow-sm p-5 transition-colors"
          isSmall
        />
        <StatCard
          label="Beasiswa Yatim"
          value={totals.yatim}
          icon={<HeartHandshake className="h-5 w-5" />}
          gradient="bg-white"
          iconBg="bg-fuchsia-500/10 text-fuchsia-600 border border-fuchsia-500/20"
          className="border-2 border-muted hover:border-primary/20 shadow-sm p-5 transition-colors"
          isSmall
        />
      </div>


      <Card className="rounded-2xl p-4 shadow-soft">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama, email, sekolah, kode token..."
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
            <option value="yatim">Yatim</option>
          </select>
          <select
            value={filterJalur}
            onChange={(e) => setFilterJalur(e.target.value as "all" | "fast" | "premium" | "reguler")}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">Semua Jalur</option>
            <option value="fast">Fast Track ({totals.fast})</option>
            <option value="premium">Fast Track Premium ({totals.premium})</option>
            <option value="reguler">Reguler ({rows.length - totals.fast})</option>
          </select>
          <select
            value={filterBerkas}
            onChange={(e) => setFilterBerkas(e.target.value as "all" | "submitted" | "pending")}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">Semua Berkas ({rows.length})</option>
            <option value="submitted">Sudah Kirim Berkas ({counts.submitted})</option>
            <option value="pending">Belum Kirim Berkas ({counts.pending})</option>
          </select>
          <div className="flex items-center gap-2 text-sm ml-auto">
            <span className="text-muted-foreground whitespace-nowrap">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:ring-1 focus:ring-primary"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl shadow-soft overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Belum ada pendaftar.
          </div>
        ) : (
          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">

              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <Checkbox
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      onCheckedChange={toggleAll}
                      aria-label="Pilih semua"
                    />
                  </th>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Kode Token</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Jalur</th>
                  <th className="px-4 py-3">Tipe Fast Track</th>
                  <th className="px-4 py-3">Sekolah</th>
                  <th className="px-4 py-3">Kontak</th>
                  <th className="px-4 py-3">Berkas</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-t hover:bg-muted/30 ${selected.has(r.id) ? "bg-muted/40" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selected.has(r.id)}
                        onCheckedChange={() => toggleOne(r.id)}
                        aria-label="Pilih baris"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{r.full_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("id-ID")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <TokenBadge token={r.token} />
                    </td>
                    <td className="px-4 py-3 capitalize">{r.kind}</td>
                    <td className="px-4 py-3">
                      <JalurBadge row={r} />
                    </td>
                    <td className="px-4 py-3">
                      {r.fast_track ? (
                        <Badge variant="outline" className={(r.extra as any)?.fast_track_type === 'premium' ? 'border-amber-500 text-amber-600 font-bold' : ''}>
                          {(r.extra as any)?.fast_track_type === 'premium' ? 'Premium' : 'Standard'}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>{r.school_name}</div>
                      <div className="text-xs text-muted-foreground uppercase">
                        {r.education_level} · {r.grade}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{r.email}</div>
                      <div className="text-xs text-muted-foreground">{r.whatsapp}</div>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const isPremium =
                          !!r.fast_track && (r.extra as any)?.fast_track_type === "premium";
                        const paid = (r.payment_status || "").toLowerCase() === "paid";
                        const count = docsForRow(r).length;
                        if (isPremium && paid) {
                          return (
                            <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 border border-amber-500/40 font-bold">
                              ✓ Lolos Otomatis{count > 0 ? ` · ${count} berkas` : ""}
                            </Badge>
                          );
                        }
                        if (isPremium && !paid) {
                          return (
                            <Badge variant="outline" className="border-amber-500/40 text-amber-600">
                              Menunggu pembayaran
                            </Badge>
                          );
                        }
                        return count > 0 ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 border border-emerald-500/30">
                            ✓ {count} berkas
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Belum kirim
                          </Badge>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => setSelectedRow(r)}>
                          Detail
                        </Button>
                        {r.fast_track && r.payment_status !== "paid" && (
                          <Button
                            size="sm"
                            className="bg-amber-500 text-white hover:bg-amber-600"
                            onClick={() => setPayment(r, "paid")}
                            title="Validasi manual Fast Track"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Validasi
                          </Button>
                        )}
                        {r.fast_track && r.payment_status === "paid" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => setPayment(r, "pending")}
                            title="Batalkan validasi"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" /> Batal Validasi
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteOne(r)}
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-muted/50 px-4 py-3 bg-muted/20">
            <div className="text-xs text-muted-foreground">
              Menampilkan {(currentPage - 1) * pageSize + 1} sampai {Math.min(currentPage * pageSize, filtered.length)} dari {filtered.length} pendaftar
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Sebelumnya
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, i, arr) => (
                    <div key={p} className="flex items-center">
                      {i > 0 && arr[i-1] !== p - 1 && <span className="px-1 text-muted-foreground">...</span>}
                      <Button
                        variant={currentPage === p ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </Button>
                    </div>
                  ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </Card>

      {selectedRow && (
        <DetailDialog
          row={selectedRow}
          docs={docsForRow(selectedRow)}
          onClose={() => setSelectedRow(null)}
        />
      )}
    </div>
  );
}

function DetailDialog({
  row,
  docs,
  onClose,
}: {
  row: Registration;
  docs: Document[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-background p-6 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">{row.full_name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {row.kind}
              </Badge>
              <TokenBadge token={row.token} size="md" />
              <span className="text-xs text-muted-foreground">
                Daftar {new Date(row.created_at).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 text-sm">
          <Field label="Email" value={row.email} />
          <Field label="WhatsApp" value={row.whatsapp} />
          <Field label="Jenis Kelamin" value={row.gender} />
          <Field label="Tempat / Tanggal Lahir" value={`${row.birth_place}, ${row.birth_date}`} />
          <Field label="Jenjang" value={`${row.education_level} · ${row.grade}`} />
          <Field label="Sekolah / Kampus" value={row.school_name} />
          <Field label="Alamat" value={row.address} />
          {row.parent_income && <Field label="Penghasilan Ortu" value={row.parent_income} />}
          {row.dependents != null && <Field label="Tanggungan" value={String(row.dependents)} />}
          {row.main_achievement && <Field label="Prestasi Utama" value={row.main_achievement} />}
          {row.khs_url && <Field label="KHS (URL)" value={row.khs_url} />}
          {row.transcript_custom_url && <Field label="Transkrip (URL)" value={row.transcript_custom_url} />}
          {row.additional_docs_url && <Field label="Berkas Pendukung (URL)" value={row.additional_docs_url} />}
          {row.tiktok_video_url && <Field label="Video Tiktok (URL)" value={row.tiktok_video_url} />}
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Berkas ({docs.length + (row.photo_url ? 1 : 0) + (row.student_card_url ? 1 : 0)})
          </h3>
          <div className="space-y-2">
            {row.photo_url && <DocLink type="Foto" url={row.photo_url} />}
            {row.student_card_url && (
              <DocLink type="Kartu Identitas (Identity)" url={row.student_card_url} />
            )}
            {row.khs_url && <DocLink type="Kartu Hasil Studi (KHS)" url={row.khs_url} />}
            {row.transcript_custom_url && <DocLink type="Transkrip Nilai (Custom)" url={row.transcript_custom_url} />}
            {row.tiktok_video_url && <DocLink type="Video Tiktok 1 Menit" url={row.tiktok_video_url} />}
            {row.additional_docs_url && <DocLink type="Berkas Pendukung Lainnya" url={row.additional_docs_url} />}
            {docs.map((d) => (
              <DocLink key={d.id} type={d.doc_type} url={d.file_url} />
            ))}
            {docs.length === 0 && !row.photo_url && !row.student_card_url && !row.khs_url && !row.transcript_custom_url && !row.additional_docs_url && !row.tiktok_video_url && (
              <p className="text-sm text-muted-foreground">Belum ada berkas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground">{value}</p>
    </div>
  );
}

function DocLink({ type, url }: { type: string; url: string }) {
  return (
    <button
      type="button"
      onClick={() =>
        openStoredFile(url).catch((e: unknown) =>
          toast.error(e instanceof Error ? e.message : "Gagal membuka berkas"),
        )
      }
      className="w-full flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 hover:bg-muted text-left"
    >
      <div className="flex items-center gap-2 text-sm">
        <FileText className="h-4 w-4 text-primary" />
        <span className="font-medium">{type}</span>
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}


function StatCard({ label, value, icon, gradient, iconBg, className = "", isSmall = false }: {
  label: string;
  value: number;
  icon: ReactNode;
  gradient: string;
  iconBg: string;
  className?: string;
  isSmall?: boolean;
}) {
  return (
    <Card className={`rounded-2xl relative overflow-hidden group ${gradient} ${className}`}>
      {!isSmall && (
        <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-black/[0.02] rounded-full transition-transform group-hover:scale-110" />
      )}
      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
          <p className={`${isSmall ? "text-2xl" : "text-3xl sm:text-4xl"} font-black tabular-nums text-foreground`}>
            {value}
          </p>
        </div>
        <div className={`inline-flex ${isSmall ? "h-10 w-10" : "h-12 w-12"} shrink-0 items-center justify-center rounded-2xl ${iconBg} shadow-sm`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function JalurBadge({ row }: { row: Registration }) {
  if (!row.fast_track) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Reguler
      </Badge>
    );
  }
  const ps = (row.payment_status || "").toLowerCase();
  const paid = ps === "paid";
  const pending = ["pending", "processing", "waiting", "unpaid_pending"].includes(ps);
  const premium = (row.extra as any)?.fast_track_type === "premium";
  const payLabel = paid ? "Valid" : pending ? "Pending" : "Belum Bayar";
  const payClass = paid
    ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/40"
    : pending
      ? "bg-amber-400/20 text-amber-700 border border-amber-500/40 animate-pulse"
      : "bg-rose-500/10 text-rose-700 border border-rose-500/40";
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge
        className={
          premium
            ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:opacity-90 border border-amber-600 font-bold"
            : "bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 border border-amber-500/40"
        }
      >
        <Zap className="h-3 w-3 mr-1" /> {premium ? "Fast Track Premium" : "Fast Track"}
      </Badge>
      <Badge className={`${payClass} hover:opacity-90 font-bold text-[11px]`}>
        {paid ? "✓ " : pending ? "⏳ " : "• "}
        {payLabel}
      </Badge>
      {premium && paid && (
        <span className="text-[11px] font-semibold text-emerald-600">✓ Auto lolos administrasi</span>
      )}
    </div>
  );
}

