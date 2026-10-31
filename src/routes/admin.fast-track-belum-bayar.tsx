import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, Loader2, RefreshCw, Search } from "lucide-react";
import {
  fastTrackTier,
  matchesRegistrationDate,
  normalizedEmail,
  normalizedWhatsapp,
  unpaidFastTrack,
  type FastTrackRegistration,
} from "@/lib/unpaid-fast-track";

export const Route = createFileRoute("/admin/fast-track-belum-bayar")({
  component: UnpaidFastTrackPage,
});

type Snapshot = {
  registrations: FastTrackRegistration[];
  payments: { registration_id: string; status: string }[];
  syncedAt: Date;
};
const PAGE_SIZE = 50;

function UnpaidFastTrackPage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("all");
  const [sort, setSort] = useState("oldest");
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState(false);
  const invalidRange = Boolean(dateFrom && dateTo && dateFrom > dateTo);
  const refreshAction = useRef<() => void>(() => {});

  useEffect(() => {
    let disposed = false;
    let running = false;
    let again = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      if (running) {
        again = true;
        return;
      }
      running = true;
      setBusy(true);
      try {
        do {
          again = false;
          // Fetch all pages before displaying results: a paid duplicate may be on a later page.
          const fetchRegistrations = async () => {
            const rows: FastTrackRegistration[] = [];
            for (let from = 0; ; from += 1000) {
              const { data, error } = await supabase
                .from("registrations")
                .select(
                  "id,full_name,email,whatsapp,token,kind,created_at,fast_track,payment_status,extra",
                )
                .eq("fast_track", true)
                .order("id")
                .range(from, from + 999);
              if (error) throw error;
              rows.push(...(data as FastTrackRegistration[]));
              if (data.length < 1000) break;
            }
            return rows;
          };
          const fetchPayments = async () => {
            const rows: Snapshot["payments"] = [];
            for (let from = 0; ; from += 1000) {
              const { data, error } = await supabase
                .from("payments")
                .select("id,registration_id,status")
                .order("id")
                .range(from, from + 999);
              if (error) throw error;
              rows.push(...data);
              if (data.length < 1000) break;
            }
            return rows;
          };
          const [registrations, payments] = await Promise.all([
            fetchRegistrations(),
            fetchPayments(),
          ]);
          if (disposed) return;
          setSnapshot({ registrations, payments, syncedAt: new Date() });
          setError(null);
        } while (again && !disposed);
      } catch (err) {
        if (!disposed)
          setError((err as { message?: string }).message ?? "Gagal memuat data pembayaran.");
      } finally {
        running = false;
        if (!disposed) setBusy(false);
      }
    }
    const refresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void load();
      }, 500);
    };
    refreshAction.current = () => {
      void load();
    };
    void load();
    const channel = supabase
      .channel("admin-unpaid-fast-track")
      .on("postgres_changes", { event: "*", schema: "public", table: "registrations" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, refresh)
      .subscribe();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 60000);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, []);
  const unpaid = useMemo(
    () => (snapshot ? unpaidFastTrack(snapshot.registrations, snapshot.payments) : []),
    [snapshot],
  );
  const dateRows = useMemo(
    () => unpaid.filter((row) => matchesRegistrationDate(row.created_at, dateFrom, dateTo)),
    [unpaid, dateFrom, dateTo],
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const phoneQuery = normalizedWhatsapp(search);
    return dateRows
      .filter(
        (row) =>
          (tier === "all" || fastTrackTier(row) === tier) &&
          (!query ||
            [row.full_name, row.email, row.whatsapp, row.token].some((value) =>
              value?.toLowerCase().includes(query),
            ) ||
            (phoneQuery.length >= 3 && normalizedWhatsapp(row.whatsapp).includes(phoneQuery))),
      )
      .sort((a, b) => {
        if (sort === "oldest") {
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime() ||
            a.id.localeCompare(b.id)
          );
        }
        const left =
          sort === "whatsapp" ? normalizedWhatsapp(a.whatsapp) : normalizedEmail(a.email);
        const right =
          sort === "whatsapp" ? normalizedWhatsapp(b.whatsapp) : normalizedEmail(b.email);
        return (
          left.localeCompare(right, "id") ||
          a.full_name.localeCompare(b.full_name, "id") ||
          a.id.localeCompare(b.id)
        );
      });
  }, [dateRows, tier, search, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const change = useCallback((setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  }, []);

  const exportData = async () => {
    if (exporting || busy || error || invalidRange || !filtered.length) return;
    setExporting(true);
    try {
      const { exportRowsToXlsx } = await import("@/lib/excel-export");
      await exportRowsToXlsx(
        filtered.map((row) => ({
          Nama: row.full_name,
          Token: row.token ?? "",
          Email: row.email ?? "",
          WhatsApp: row.whatsapp ?? "",
          "Fast Track": fastTrackTier(row) === "premium" ? "FT Premium" : "FT Standar",
          Kategori: row.kind,
          "Tanggal daftar (WIB)": new Date(row.created_at).toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
          }),
          "Status pembayaran": "Belum bayar",
        })),
        "FT Belum Bayar",
        `FT-Belum-Bayar-${dateFrom || "awal"}-${dateTo || "terbaru"}.xlsx`,
      );
      toast.success(`${filtered.length} pendaftaran berhasil diekspor`);
    } catch {
      toast.error("Gagal mengunduh data. Silakan coba lagi.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">FT Belum Bayar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pendaftar FT Standar dan FT Premium yang belum membayar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => void exportData()}
            disabled={
              busy || exporting || !snapshot || Boolean(error) || invalidRange || !filtered.length
            }
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {exporting ? "Mengekspor…" : "Unduh Excel"}
          </Button>
          <Button variant="outline" onClick={() => refreshAction.current()} disabled={busy}>
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Segarkan
          </Button>
        </div>
      </div>
      <Card className="p-4 text-sm text-muted-foreground">
        Peserta dengan pembayaran Fast Track berhasil tidak ditampilkan, termasuk pendaftaran lain
        dengan email atau nomor WhatsApp yang sama. Format 08, 628, dan +628 dikenali sebagai nomor
        yang sama.
      </Card>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive p-4 text-sm text-destructive"
        >
          Data belum berhasil diperbarui: {error}. Segarkan sebelum memakai daftar untuk tindak
          lanjut.
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Belum bayar sesuai tanggal", dateRows.length],
          ["FT Standar", dateRows.filter((r) => fastTrackTier(r) === "standard").length],
          ["FT Premium", dateRows.filter((r) => fastTrackTier(r) === "premium").length],
        ].map(([label, count]) => (
          <Card key={label} className="p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-bold">
              {snapshot ? Number(count).toLocaleString("id-ID") : "—"}
            </p>
          </Card>
        ))}
      </div>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap gap-3 border-b p-4">
          <div className="relative min-w-60 flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Cari peserta"
              className="pl-9"
              placeholder="Nama, email, WhatsApp, atau token…"
              value={search}
              onChange={(e) => change(setSearch, e.target.value)}
            />
          </div>
          <select
            aria-label="Jenis Fast Track"
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={tier}
            onChange={(e) => change(setTier, e.target.value)}
          >
            <option value="all">Semua Fast Track</option>
            <option value="standard">FT Standar</option>
            <option value="premium">FT Premium</option>
          </select>
          <select
            aria-label="Urutkan peserta"
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={sort}
            onChange={(e) => change(setSort, e.target.value)}
          >
            <option value="oldest">Urutkan: Tanggal terlama</option>
            <option value="email">Urutkan: Email</option>
            <option value="whatsapp">Urutkan: WhatsApp</option>
          </select>
        </div>
        <div className="flex flex-wrap items-end gap-3 border-b p-4">
          <label className="space-y-1 text-sm">
            <span>Dari tanggal daftar</span>
            <Input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => change(setDateFrom, e.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Sampai tanggal daftar</span>
            <Input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => change(setDateTo, e.target.value)}
            />
          </label>
          <Button
            variant="outline"
            disabled={!dateFrom && !dateTo}
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setPage(1);
            }}
          >
            Semua tanggal
          </Button>
          <p className="text-xs text-muted-foreground">
            Tanggal pendaftaran dalam WIB. Ekspor memuat seluruh hasil filter, bukan hanya halaman
            ini.
          </p>
          {invalidRange && (
            <p role="alert" className="w-full text-sm text-destructive">
              Tanggal akhir harus sama dengan atau setelah tanggal awal.
            </p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Peserta", "Email", "WhatsApp", "Fast Track", "Kategori", "Terdaftar"].map(
                  (title) => (
                    <th key={title} className="whitespace-nowrap p-4 font-medium">
                      {title}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {!snapshot && busy ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    <p className="mt-2">Memeriksa seluruh pembayaran…</p>
                  </td>
                </tr>
              ) : !visible.length ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-muted-foreground">
                    {error && !snapshot
                      ? "Data belum tersedia. Coba segarkan kembali."
                      : "Tidak ada peserta belum bayar yang sesuai filter."}
                  </td>
                </tr>
              ) : (
                visible.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-muted/30">
                    <td className="p-4">
                      <p className="font-medium">{row.full_name}</p>
                      <p className="text-xs text-muted-foreground">{row.token || "—"}</p>
                    </td>
                    <td className="p-4">{row.email || "—"}</td>
                    <td className="whitespace-nowrap p-4">{row.whatsapp || "—"}</td>
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className={
                          fastTrackTier(row) === "premium"
                            ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
                            : "border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-200"
                        }
                      >
                        {fastTrackTier(row) === "premium" ? "FT Premium" : "FT Standar"}
                      </Badge>
                    </td>
                    <td className="p-4 capitalize">{row.kind}</td>
                    <td className="whitespace-nowrap p-4">
                      {new Date(row.created_at).toLocaleDateString("id-ID", {
                        timeZone: "Asia/Jakarta",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-sm">
          <p>
            {filtered.length.toLocaleString("id-ID")} pendaftaran · Halaman {currentPage} / {pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= pages}
              onClick={() => setPage(currentPage + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </Card>
      {snapshot && (
        <p className="text-xs text-muted-foreground">
          Diperbarui {snapshot.syncedAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB ·
          otomatis saat pembayaran berubah.
        </p>
      )}
    </div>
  );
}
