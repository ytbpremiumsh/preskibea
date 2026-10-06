import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search, Check, X, Megaphone, Save, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { TokenBadge } from "@/components/admin/TokenBadge";

export const Route = createFileRoute("/admin/tahapan-seleksi")({
  component: AdminTahapanSeleksi,
});

type Status = "pending" | "approved" | "rejected";

type Row = {
  id: string;
  full_name: string;
  email: string;
  kind: string;
  token: string | null;
  candidate_status: Status;
  fast_track: boolean | null;
  payment_status: string | null;
  extra: Record<string, unknown> | null;
};

const KIND_LABEL: Record<string, string> = {
  prestasi: "Prestasi",
  ekonomi: "Ekonomi",
  umum: "Umum",
  yatim: "Yatim",
};

const ANNOUNCEMENTS = [
  { key: "esai_announcement", title: "Tahap 2 — Pengiriman Essai" },
  { key: "administrasi_announcement", title: "Tahap 3 — Seleksi Administrasi" },
  { key: "tpa_announcement", title: "Tahap 4 — Tes Potensi Akademik" },
  { key: "interview_announcement", title: "Tahap 5 — Interview" },
] as const;

type AnnState = Record<string, { published: boolean; message: string }>;

function statusOf(r: Row, field: "tpa_status" | "interview_status"): Status {
  const v = r.extra?.[field];
  return v === "approved" || v === "rejected" ? v : "pending";
}

function AdminTahapanSeleksi() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterKind, setFilterKind] = useState<"all" | keyof typeof KIND_LABEL>("all");
  const [ann, setAnn] = useState<AnnState>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [debouncedQ, setDebouncedQ] = useState("");
  const [trackCounts, setTrackCounts] = useState({ regular: 0, standard: 0, premium: 0 });

  const applyEligibility = (query: any) =>
    query.or(
      "candidate_status.eq.approved,and(fast_track.eq.true,payment_status.eq.paid,extra->>fast_track_type.eq.premium)",
    );

  const load = useCallback(async () => {
    setLoading(true);
    let query: any = applyEligibility(
      supabase
        .from("registrations")
        .select(
          "id, full_name, email, kind, token, candidate_status, fast_track, payment_status, extra",
          { count: "exact" },
        ),
    );
    if (filterKind !== "all") query = query.eq("kind", filterKind);
    if (debouncedQ) {
      const term = debouncedQ.replace(/[,%()]/g, " ").trim();
      if (term) {
        query = query.or(
          `full_name.ilike.%${term}%,email.ilike.%${term}%,token.ilike.%${term}%`,
        );
      }
    }
    const from = (currentPage - 1) * pageSize;
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setRows((data ?? []) as Row[]);
    setTotalRows(count ?? 0);
    setLoading(false);
  }, [currentPage, pageSize, filterKind, debouncedQ]);

  const loadSettings = useCallback(async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ANNOUNCEMENTS.map((a) => a.key) as string[]);
    const next: AnnState = {};
    for (const a of ANNOUNCEMENTS) next[a.key] = { published: false, message: "" };
    for (const row of data ?? []) {
      const v = (row.value ?? {}) as { published?: boolean; message?: string };
      next[row.key] = { published: !!v.published, message: v.message ?? "" };
    }
    setAnn(next);
  }, []);

  const loadTrackCounts = useCallback(async () => {
    const count = (configure?: (query: any) => any) => {
      let query: any = applyEligibility(
        supabase.from("registrations").select("id", { count: "exact", head: true }),
      );
      if (configure) query = configure(query);
      return query;
    };
    const [regular, standard, premium] = await Promise.all([
      count((query) => query.or("fast_track.is.null,fast_track.eq.false")),
      count((query) =>
        query
          .eq("fast_track", true)
          .or("extra->>fast_track_type.is.null,extra->>fast_track_type.neq.premium"),
      ),
      count((query) => query.eq("fast_track", true).eq("extra->>fast_track_type", "premium")),
    ]);
    setTrackCounts({
      regular: regular.count ?? 0,
      standard: standard.count ?? 0,
      premium: premium.count ?? 0,
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void Promise.all([loadSettings(), loadTrackCounts()]);
  }, [loadSettings, loadTrackCounts]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    setCurrentPage(1);
  }, [q, filterKind, pageSize]);

  const saveAnn = async (key: string, value: { published: boolean; message: string }) => {
    setSaving(key);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value }, { onConflict: "key" });
    setSaving(null);
    if (error) return toast.error(error.message);
    toast.success(value.published ? "Hasil dipublikasikan" : "Hasil ditahan");
  };

  const setStage = async (row: Row, field: "tpa_status" | "interview_status", status: Status) => {
    const nextExtra = { ...(row.extra ?? {}), [field]: status };
    const { error } = await supabase
      .from("registrations")
      .update({ extra: nextExtra as never })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    setRows((prev) => prev.map((p) => (p.id === row.id ? { ...p, extra: nextExtra } : p)));
    toast.success(status === "approved" ? "Ditandai lolos" : "Ditandai tidak lolos");
  };

  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
          <ListChecks className="h-6 w-6 text-primary" /> Tahapan Seleksi
        </h1>
        <p className="text-sm text-muted-foreground">
          Validasi kelulusan Tes Potensi Akademik dan Interview, serta atur publikasi hasil setiap tahapan.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {ANNOUNCEMENTS.map((a) => {
          const cur = ann[a.key] ?? { published: false, message: "" };
          return (
            <Card key={a.key} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-bold text-foreground flex items-center gap-2">
                    <Megaphone className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{a.title}</span>
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {cur.published ? "Hasil tampil di halaman cek status." : "Hasil ditahan dari peserta."}
                  </p>
                </div>
                <Switch
                  checked={cur.published}
                  onCheckedChange={(v) => {
                    const next = { ...cur, published: v };
                    setAnn((p) => ({ ...p, [a.key]: next }));
                    saveAnn(a.key, next);
                  }}
                />
              </div>
              <Textarea
                value={cur.message}
                onChange={(e) => setAnn((p) => ({ ...p, [a.key]: { ...cur, message: e.target.value } }))}
                rows={2}
                placeholder="Pesan pengumuman (opsional)"
                className="mt-3"
              />
              <Button
                size="sm"
                className="mt-3"
                disabled={saving === a.key}
                onClick={() => saveAnn(a.key, ann[a.key])}
              >
                {saving === a.key ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Simpan
              </Button>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap gap-2 border-b border-border pb-4">
          <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
            Reguler: {trackCounts.regular}
          </Badge>
          <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700">
            FT Standar: {trackCounts.standard}
          </Badge>
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
            FT Premium: {trackCounts.premium}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama, email, atau kode pendaftar…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "prestasi", "ekonomi", "umum", "yatim"] as const).map((k) => (
              <Button
                key={k}
                size="sm"
                variant={filterKind === k ? "default" : "outline"}
                onClick={() => setFilterKind(k)}
              >
                {k === "all" ? "Semua" : KIND_LABEL[k]}
              </Button>
            ))}
            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              aria-label="Jumlah peserta per halaman"
            >
              <option value={20}>20 per halaman</option>
              <option value={50}>50 per halaman</option>
              <option value={100}>100 per halaman</option>
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Belum ada peserta yang lolos seleksi administrasi.
            </div>
          ) : (
            <>
            {/* Mobile: kartu */}
            <div className="grid gap-3 md:hidden">
              {rows.map((r) => (
                <div key={r.id} className="rounded-xl border border-border p-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-foreground">{r.full_name}</div>
                    <div className="truncate text-xs text-muted-foreground">{r.email}</div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {r.token ? <TokenBadge token={r.token} /> : null}
                    <Badge variant="outline">{KIND_LABEL[r.kind] ?? r.kind}</Badge>
                    <TrackBadge row={r} />
                  </div>
                  <div className="mt-3 space-y-2">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground">Tes Potensi Akademik</div>
                      <div className="mt-1">
                        <StageCell status={statusOf(r, "tpa_status")} onSet={(s) => setStage(r, "tpa_status", s)} />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground">Interview</div>
                      <div className="mt-1">
                        <StageCell
                          status={statusOf(r, "interview_status")}
                          onSet={(s) => setStage(r, "interview_status", s)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Peserta</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Jalur</TableHead>
                  <TableHead>Tes Potensi Akademik</TableHead>
                  <TableHead>Interview</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const tpa = statusOf(r, "tpa_status");
                  const itw = statusOf(r, "interview_status");
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-semibold text-foreground">{r.full_name}</div>
                        <div className="text-xs text-muted-foreground">{r.email}</div>
                      </TableCell>
                      <TableCell>{r.token ? <TokenBadge token={r.token} /> : "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{KIND_LABEL[r.kind] ?? r.kind}</Badge>
                      </TableCell>
                      <TableCell>
                        <TrackBadge row={r} />
                      </TableCell>
                      <TableCell>
                        <StageCell
                          status={tpa}
                          onSet={(s) => setStage(r, "tpa_status", s)}
                        />
                      </TableCell>
                      <TableCell>
                        <StageCell
                          status={itw}
                          onSet={(s) => setStage(r, "interview_status", s)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
            </>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Menampilkan {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalRows)} dari {totalRows} peserta
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Sebelumnya
              </Button>
              <span className="min-w-[92px] text-center text-xs font-semibold">
                Halaman {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function TrackBadge({ row }: { row: Row }) {
  if (!row.fast_track) {
    return (
      <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
        Reguler
      </Badge>
    );
  }
  if (row.extra?.fast_track_type === "premium") {
    return (
      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
        FT Premium
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700">
      FT Standar
    </Badge>
  );
}

function StageCell({ status, onSet }: { status: Status; onSet: (s: Status) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant={status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary"}>
        {status === "approved" ? "Lolos" : status === "rejected" ? "Tidak Lolos" : "Menunggu"}
      </Badge>
      <Button size="sm" variant="outline" onClick={() => onSet("approved")}>
        <Check className="h-3.5 w-3.5" />
      </Button>
      <Button size="sm" variant="outline" onClick={() => onSet("rejected")}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
