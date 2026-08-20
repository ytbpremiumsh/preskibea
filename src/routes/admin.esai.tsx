import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Search, Eye, Check, X, PenLine, Zap, Megaphone, Save } from "lucide-react";
import { toast } from "sonner";
import { TokenBadge } from "@/components/admin/TokenBadge";

export const Route = createFileRoute("/admin/esai")({
  component: AdminEsai,
});

type EssayAnswer = { question: string; answer: string };
type EssayStatus = "pending" | "approved" | "rejected";

type Row = {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  kind: string;
  token: string | null;
  education_level: string | null;
  school_name: string | null;
  fast_track: boolean | null;
  extra: Record<string, unknown> | null;
};

const KIND_LABEL: Record<string, string> = {
  prestasi: "Prestasi",
  ekonomi: "Ekonomi",
  umum: "Umum",
  yatim: "Yatim",
};

function answersOf(r: Row): EssayAnswer[] {
  const a = r.extra?.essay_answers;
  return Array.isArray(a) ? (a as EssayAnswer[]) : [];
}
function submittedAt(r: Row): string | null {
  const v = r.extra?.essay_submitted_at;
  return typeof v === "string" ? v : null;
}
function statusOf(r: Row): EssayStatus {
  const v = r.extra?.essay_status;
  if (v === "approved" || v === "rejected") return v;
  return r.fast_track ? "approved" : "pending";
}

function AdminEsai() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterKind, setFilterKind] = useState<"all" | keyof typeof KIND_LABEL>("all");
  const [detail, setDetail] = useState<Row | null>(null);

  // Pengumuman
  const [published, setPublished] = useState(false);
  const [message, setMessage] = useState("");
  const [savingAnn, setSavingAnn] = useState(false);

  // Auto lolos khusus jalur Reguler
  const [autoReguler, setAutoReguler] = useState(false);

  const load = async () => {
    setLoading(true);
    const [r, s] = await Promise.all([
      supabase
        .from("registrations")
        .select(
          "id, full_name, email, whatsapp, kind, token, education_level, school_name, fast_track, extra",
        )
        .order("created_at", { ascending: false }),
      supabase.from("site_settings").select("value").eq("key", "esai_announcement").maybeSingle(),
    ]);
    if (r.error) toast.error(r.error.message);
    setRows((r.data ?? []) as Row[]);
    const cfg = (s.data?.value ?? {}) as { published?: boolean; message?: string };
    setPublished(!!cfg.published);
    setMessage(cfg.message ?? "");
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const saveAnnouncement = async (nextPublished = published, nextMessage = message) => {
    setSavingAnn(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert(
        { key: "esai_announcement", value: { published: nextPublished, message: nextMessage } },
        { onConflict: "key" },
      );
    setSavingAnn(false);
    if (error) return toast.error(error.message);
    toast.success(nextPublished ? "Pengumuman esai dipublikasikan" : "Pengumuman esai ditahan");
  };

  const setStatus = async (row: Row, status: EssayStatus) => {
    const nextExtra = { ...(row.extra ?? {}), essay_status: status };
    const { error } = await supabase
      .from("registrations")
      .update({ extra: nextExtra })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    setRows((prev) => prev.map((p) => (p.id === row.id ? { ...p, extra: nextExtra } : p)));
    setDetail((d) => (d && d.id === row.id ? { ...d, extra: nextExtra } : d));
    toast.success(status === "approved" ? "Ditandai lolos esai" : status === "rejected" ? "Ditandai tidak lolos" : "Direset");
  };

  const submitted = useMemo(
    () => rows.filter((r) => !!submittedAt(r) || !!r.fast_track),
    [rows],
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return submitted.filter((r) => {
      if (filterKind !== "all" && r.kind !== filterKind) return false;
      if (!s) return true;
      return (
        r.full_name.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s) ||
        (r.token ?? "").toLowerCase().includes(s)
      );
    });
  }, [submitted, q, filterKind]);

  const stats = useMemo(() => {
    const fast = submitted.filter((r) => r.fast_track).length;
    const manual = submitted.length - fast;
    const approved = submitted.filter((r) => statusOf(r) === "approved").length;
    const pending = submitted.filter((r) => statusOf(r) === "pending").length;
    return { total: submitted.length, fast, manual, approved, pending };
  }, [submitted]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
          <PenLine className="h-6 w-6 text-primary" /> Pengiriman Esai
        </h1>
        <p className="text-sm text-muted-foreground">
          Daftar peserta yang telah mengirimkan esai singkat. Peserta Fast Track otomatis lolos.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Esai Masuk" value={stats.total} />
        <StatCard label="Fast Track (Auto Lolos)" value={stats.fast} />
        <StatCard label="Lolos Esai" value={stats.approved} />
        <StatCard label="Menunggu Penilaian" value={stats.pending} />
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" /> Publikasi Pengumuman Esai
            </h2>
            <p className="mt-1 text-xs text-muted-foreground max-w-lg">
              Selama toggle nonaktif, hasil esai ditahan dan tidak tampil di halaman cek status maupun halaman esai peserta.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground">
              {published ? "Dipublikasikan" : "Ditahan"}
            </span>
            <Switch
              checked={published}
              onCheckedChange={(v) => {
                setPublished(v);
                saveAnnouncement(v, message);
              }}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="text-xs font-medium text-foreground/80">Pesan Pengumuman (opsional)</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Contoh: Hasil penilaian esai telah diumumkan. Peserta yang lolos dapat melanjutkan ke tahap berkas administrasi."
            className="mt-1.5"
          />
          <Button
            onClick={() => saveAnnouncement()}
            disabled={savingAnn}
            className="mt-3"
            size="sm"
          >
            {savingAnn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Pengumuman
          </Button>
        </div>
      </Card>

      <Card className="p-5">
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
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Belum ada peserta yang mengirimkan esai.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Peserta</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Jalur</TableHead>
                  <TableHead>Waktu Kirim</TableHead>
                  <TableHead>Status Esai</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const st = statusOf(r);
                  const at = submittedAt(r);
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
                        {r.fast_track ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                            <Zap className="h-3 w-3" /> Fast Track
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Reguler</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {at
                          ? new Date(at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
                          : "Auto (Fast Track)"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={st === "approved" ? "default" : st === "rejected" ? "destructive" : "secondary"}
                        >
                          {st === "approved" ? "Lolos" : st === "rejected" ? "Tidak Lolos" : "Menunggu"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => setDetail(r)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setStatus(r, "approved")}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setStatus(r, "rejected")}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Jawaban Esai — {detail?.full_name}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground">
                {KIND_LABEL[detail.kind] ?? detail.kind} · {detail.token ?? "—"} ·{" "}
                {detail.education_level ?? "—"} · {detail.school_name ?? "—"}
              </div>
              {detail.fast_track && answersOf(detail).length === 0 ? (
                <div className="rounded-xl border border-amber-500/40 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  Peserta Fast Track — tahap esai otomatis lolos tanpa pengisian jawaban.
                </div>
              ) : (
                answersOf(detail).map((a, i) => (
                  <div key={i} className="rounded-xl border border-border p-4">
                    <div className="text-xs font-semibold text-primary">
                      {i + 1}. {a.question}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{a.answer}</p>
                  </div>
                ))
              )}
              <div className="flex gap-2">
                <Button onClick={() => setStatus(detail, "approved")} className="flex-1">
                  <Check className="h-4 w-4" /> Loloskan
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setStatus(detail, "rejected")}
                  className="flex-1"
                >
                  <X className="h-4 w-4" /> Tidak Lolos
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-extrabold text-foreground">{value}</div>
    </Card>
  );
}
