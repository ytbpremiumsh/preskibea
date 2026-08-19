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

  const load = async () => {
    setLoading(true);
    const [r, s] = await Promise.all([
      supabase
        .from("registrations")
        .select("id, full_name, email, kind, token, candidate_status, fast_track, extra")
        .order("created_at", { ascending: false }),
      supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ANNOUNCEMENTS.map((a) => a.key) as string[]),
    ]);
    if (r.error) toast.error(r.error.message);
    setRows((r.data ?? []) as Row[]);
    const next: AnnState = {};
    for (const a of ANNOUNCEMENTS) next[a.key] = { published: false, message: "" };
    for (const row of s.data ?? []) {
      const v = (row.value ?? {}) as { published?: boolean; message?: string };
      next[row.key] = { published: !!v.published, message: v.message ?? "" };
    }
    setAnn(next);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

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

  // Peserta yang relevan: sudah lolos seleksi administrasi
  const eligible = useMemo(
    () => rows.filter((r) => r.candidate_status === "approved"),
    [rows],
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return eligible.filter((r) => {
      if (filterKind !== "all" && r.kind !== filterKind) return false;
      if (!s) return true;
      return (
        r.full_name.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s) ||
        (r.token ?? "").toLowerCase().includes(s)
      );
    });
  }, [eligible, q, filterKind]);

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
              Belum ada peserta yang lolos seleksi administrasi.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Peserta</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Tes Potensi Akademik</TableHead>
                  <TableHead>Interview</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
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
          )}
        </div>
      </Card>
    </div>
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
