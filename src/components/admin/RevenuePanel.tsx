import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Wallet,
  Zap,
  Clock,
} from "lucide-react";

type PayRow = {
  id: string;
  amount: number | string | null;
  created_at: string | null;
  registration_id: string | null;
};

type Tier = "standard" | "premium";

type DayRow = {
  key: string;
  label: string;
  total: number;
  countStandard: number;
  countPremium: number;
  amountStandard: number;
  amountPremium: number;
};

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);

const JAKARTA_TIME_ZONE = "Asia/Jakarta";

const jakartaKey = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
};

const addDays = (key: string, amount: number) => {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return date.toISOString().slice(0, 10);
};

const dayDistance = (start: string, end: string) => {
  const toUtc = (key: string) => {
    const [year, month, day] = key.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((toUtc(end) - toUtc(start)) / 86400000);
};

const dayLabel = (key: string) =>
  new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", timeZone: "UTC" }).format(
    new Date(`${key}T00:00:00Z`),
  );

type RangeKey = "all" | 30 | 14 | 7 | 1;

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: 30, label: "30 Hari" },
  { key: 14, label: "14 Hari" },
  { key: 7, label: "7 Hari" },
  { key: 1, label: "1 Hari" },
];

export function RevenuePanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>(14);
  const [rows, setRows] = useState<{ created_at: string; amount: number; tier: Tier }[]>([]);
  const mountedRef = useRef(true);
  const requestRef = useRef(0);

  const loadRevenue = useCallback(async (showLoading = false) => {
    const requestId = ++requestRef.current;
    if (showLoading) setLoading(true);
    setError(null);
    const since = new Date();
    since.setDate(since.getDate() - 365);
    since.setHours(0, 0, 0, 0);

    const { data: pays, error: paymentsError } = await supabase
      .from("payments")
      .select("id,amount,created_at,registration_id")
      .in("status", ["paid", "success", "SUCCESS", "settlement", "SETTLEMENT"])
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(5000);

    if (paymentsError) {
      if (mountedRef.current && requestId === requestRef.current) {
        setError(`Data pendapatan gagal dimuat: ${paymentsError.message}`);
        setLoading(false);
      }
      return;
    }

    const list = (pays || []) as PayRow[];
    const ids = Array.from(new Set(list.map((p) => p.registration_id).filter(Boolean))) as string[];

    const tierById = new Map<string, Tier>();
    for (let i = 0; i < ids.length; i += 300) {
      const chunk = ids.slice(i, i + 300);
      const { data: regs, error: registrationsError } = await supabase
        .from("registrations")
        .select("id,extra")
        .in("id", chunk);
      if (registrationsError) {
        if (mountedRef.current && requestId === requestRef.current) {
          setError(`Kategori peserta gagal dimuat: ${registrationsError.message}`);
          setLoading(false);
        }
        return;
      }
      (regs || []).forEach((r: any) => {
        tierById.set(
          r.id,
          (r.extra?.fast_track_type === "premium" ? "premium" : "standard") as Tier,
        );
      });
    }

    const mapped = list
      .filter((p) => !!p.created_at)
      .map((p) => ({
        created_at: p.created_at as string,
        amount: Number(p.amount) || 0,
        tier:
          (p.registration_id ? tierById.get(p.registration_id) : undefined) ?? ("standard" as Tier),
      }));

    if (!mountedRef.current || requestId !== requestRef.current) return;
    setRows(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void loadRevenue(true);

    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => void loadRevenue(), 350);
    };

    const channel = supabase
      .channel("admin-revenue-payments")
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, scheduleRefresh)
      .subscribe();

    const refreshWhenActive = () => {
      if (document.visibilityState === "visible") void loadRevenue();
    };
    window.addEventListener("focus", refreshWhenActive);
    document.addEventListener("visibilitychange", refreshWhenActive);

    return () => {
      mountedRef.current = false;
      if (refreshTimer) clearTimeout(refreshTimer);
      window.removeEventListener("focus", refreshWhenActive);
      document.removeEventListener("visibilitychange", refreshWhenActive);
      void supabase.removeChannel(channel);
    };
  }, [loadRevenue]);

  const days = useMemo<DayRow[]>(() => {
    const out: DayRow[] = [];
    const todayKey = jakartaKey(new Date());

    let startKey: string;
    if (range !== "all") {
      startKey = addDays(todayKey, -(range - 1));
    } else if (rows.length) {
      startKey = rows.reduce(
        (earliest, row) => {
          const key = jakartaKey(new Date(row.created_at));
          return key < earliest ? key : earliest;
        },
        jakartaKey(new Date(rows[0].created_at)),
      );
    } else {
      startKey = todayKey;
    }

    const span = Math.max(1, dayDistance(startKey, todayKey) + 1);
    for (let i = span - 1; i >= 0; i--) {
      const key = addDays(todayKey, -i);
      out.push({
        key,
        label: dayLabel(key),
        total: 0,
        countStandard: 0,
        countPremium: 0,
        amountStandard: 0,
        amountPremium: 0,
      });
    }
    const idx = new Map(out.map((d, i) => [d.key, i]));
    for (const r of rows) {
      const i = idx.get(jakartaKey(new Date(r.created_at)));
      if (i === undefined) continue;
      out[i].total += r.amount;
      if (r.tier === "premium") {
        out[i].countPremium++;
        out[i].amountPremium += r.amount;
      } else {
        out[i].countStandard++;
        out[i].amountStandard += r.amount;
      }
    }
    return out;
  }, [rows, range]);

  const today = days[days.length - 1];
  const yesterday = days[days.length - 2];
  const diff = (today?.total || 0) - (yesterday?.total || 0);
  const pct = yesterday?.total ? Math.round((diff / yesterday.total) * 100) : null;
  const trendUp = diff > 0;
  const trendFlat = diff === 0;

  const totalRange = days.reduce((a, d) => a + d.total, 0);
  const maxDay = Math.max(1, ...days.map((d) => d.total));
  const rangeLabel = range === "all" ? "Semua" : `${range} Hari`;

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button
            className="ml-auto shrink-0 font-semibold underline"
            onClick={() => void loadRevenue(true)}
          >
            Coba lagi
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((r) => (
          <button
            key={String(r.key)}
            onClick={() => setRange(r.key)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              range === r.key
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-white text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Pendapatan Hari Ini
              </p>
              <p className="text-2xl font-black tabular-nums leading-none text-foreground">
                {rupiah(today?.total || 0)}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold">
                {trendFlat ? (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Minus className="h-3.5 w-3.5" /> Sama dengan kemarin
                  </span>
                ) : trendUp ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <TrendingUp className="h-3.5 w-3.5" /> Naik {rupiah(Math.abs(diff))}
                    {pct !== null ? ` (${pct}%)` : ""}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-600">
                    <TrendingDown className="h-3.5 w-3.5" /> Turun {rupiah(Math.abs(diff))}
                    {pct !== null ? ` (${Math.abs(pct)}%)` : ""}
                  </span>
                )}
              </div>
            </div>
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Fast Track Valid (hari ini)
              </p>
              <p className="text-2xl font-black tabular-nums leading-none text-foreground">
                {today?.countStandard || 0}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {rupiah(today?.amountStandard || 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <Zap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                FT Premium Valid (hari ini)
              </p>
              <p className="text-2xl font-black tabular-nums leading-none text-foreground">
                {today?.countPremium || 0}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {rupiah(today?.amountPremium || 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Total {rangeLabel}
              </p>
              <p className="text-2xl font-black tabular-nums leading-none text-foreground">
                {rupiah(totalRange)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl p-5 shadow-soft">
        <h2 className="text-base font-semibold text-foreground">
          Pendapatan Harian ({rangeLabel})
        </h2>
        <p className="text-xs text-muted-foreground">
          Hanya pembayaran yang benar-benar valid (paid).
        </p>
        <div className="mt-4 flex h-56 items-end gap-2 overflow-x-auto pb-1">
          {days.map((d) => {
            const hPct = d.total > 0 ? Math.max(4, Math.round((d.total / maxDay) * 100)) : 0;
            return (
              <div
                key={d.key}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                style={{ minWidth: days.length > 20 ? 34 : undefined }}
              >
                <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                  {d.total > 0 ? (d.total / 1000).toFixed(0) + "k" : ""}
                </span>
                <div
                  className={`w-full rounded-t-md transition-all ${d.total > 0 ? "bg-primary/80" : "bg-muted"}`}
                  style={{ height: `${hPct}%`, minHeight: 2 }}
                  title={`${d.label}: ${rupiah(d.total)}`}
                />
                <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="rounded-2xl p-5 shadow-soft">
        <h2 className="mb-3 text-base font-semibold text-foreground">Rincian Harian</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">Tanggal</th>
                <th className="py-2 pr-3">Fast Track Valid</th>
                <th className="py-2 pr-3">FT Premium Valid</th>
                <th className="py-2 pr-3">Total Pendapatan</th>
                <th className="py-2">Tren</th>
              </tr>
            </thead>
            <tbody>
              {[...days].reverse().map((d, i, arr) => {
                const prev = arr[i + 1];
                const delta = (d.total || 0) - (prev?.total || 0);
                return (
                  <tr key={d.key} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">{d.label}</td>
                    <td className="py-2 pr-3 tabular-nums">
                      {d.countStandard} ·{" "}
                      <span className="text-muted-foreground">{rupiah(d.amountStandard)}</span>
                    </td>
                    <td className="py-2 pr-3 tabular-nums">
                      {d.countPremium} ·{" "}
                      <span className="text-muted-foreground">{rupiah(d.amountPremium)}</span>
                    </td>
                    <td className="py-2 pr-3 font-semibold tabular-nums">{rupiah(d.total)}</td>
                    <td className="py-2">
                      {!prev ? (
                        <Badge variant="secondary">—</Badge>
                      ) : delta > 0 ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          Naik
                        </Badge>
                      ) : delta < 0 ? (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Turun</Badge>
                      ) : (
                        <Badge variant="secondary">Tetap</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default RevenuePanel;
