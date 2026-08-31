import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, Clock, Zap } from "lucide-react";

type Row = {
  paymentId: string;
  paidAt: string;
  amount: number;
  name: string;
  email: string;
  token: string;
  kind: string;
  tier: "standard" | "premium";
};

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);

const localKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const KIND_LABEL: Record<string, string> = {
  prestasi: "Prestasi",
  ekonomi: "Ekonomi",
  umum: "Umum",
  yatim: "Yatim",
};

export function ValidPaymentsPanel() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [date, setDate] = useState<string>(""); // YYYY-MM-DD, kosong = semua
  const [tierFilter, setTierFilter] = useState<"all" | "standard" | "premium">("all");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);

      // Ambil semua pembayaran yang benar-benar valid (paid)
      const pays: any[] = [];
      let from = 0;
      while (true) {
        const { data } = await supabase
          .from("payments")
          .select("id,amount,created_at,registration_id")
          .eq("status", "paid")
          .order("created_at", { ascending: false })
          .range(from, from + 999);
        const batch = (data || []) as any[];
        pays.push(...batch);
        if (batch.length < 1000) break;
        from += 1000;
      }

      const ids = Array.from(new Set(pays.map((p) => p.registration_id).filter(Boolean))) as string[];
      const regById = new Map<string, any>();
      for (let i = 0; i < ids.length; i += 300) {
        const chunk = ids.slice(i, i + 300);
        const { data: regs } = await supabase
          .from("registrations")
          .select("id,full_name,email,token,kind,extra,fast_track")
          .in("id", chunk);
        (regs || []).forEach((r: any) => regById.set(r.id, r));
      }

      const mapped: Row[] = pays
        .filter((p) => p.created_at && p.registration_id && regById.has(p.registration_id))
        .map((p) => {
          const r = regById.get(p.registration_id)!;
          return {
            paymentId: p.id,
            paidAt: p.created_at,
            amount: Number(p.amount) || 0,
            name: r.full_name || "-",
            email: r.email || "-",
            token: r.token || "-",
            kind: r.kind || "-",
            tier: r.extra?.fast_track_type === "premium" ? "premium" : "standard",
          };
        });

      if (!alive) return;
      setRows(mapped);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (date && localKey(new Date(r.paidAt)) !== date) return false;
      if (tierFilter !== "all" && r.tier !== tierFilter) return false;
      return true;
    });
  }, [rows, date, tierFilter]);

  const totalAmount = filtered.reduce((a, r) => a + r.amount, 0);
  const countStd = filtered.filter((r) => r.tier === "standard").length;
  const countPrem = filtered.filter((r) => r.tier === "premium").length;

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Total Valid</p>
              <p className="text-2xl font-black tabular-nums leading-none text-foreground">{filtered.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">{rupiah(totalAmount)}</p>
            </div>
          </div>
        </Card>
        <Card className="border bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Fast Track Valid</p>
              <p className="text-2xl font-black tabular-nums leading-none text-foreground">{countStd}</p>
            </div>
          </div>
        </Card>
        <Card className="border bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <Zap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">FT Premium Valid</p>
              <p className="text-2xl font-black tabular-nums leading-none text-foreground">{countPrem}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Peserta Fast Track — Pembayaran Valid</h2>
            <p className="text-xs text-muted-foreground">Hanya menampilkan pembayaran yang benar-benar valid (paid).</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "standard", "premium"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tierFilter === t
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-white text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {t === "all" ? "Semua" : t === "standard" ? "Fast Track" : "FT Premium"}
              </button>
            ))}
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 w-auto text-xs"
            />
            {date && (
              <button
                onClick={() => setDate("")}
                className="rounded-full border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Reset Tanggal
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">Tanggal Valid</th>
                <th className="py-2 pr-3">Nama</th>
                <th className="py-2 pr-3">Kode</th>
                <th className="py-2 pr-3">Jalur</th>
                <th className="py-2 pr-3">Tipe</th>
                <th className="py-2">Nominal</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    Tidak ada pembayaran valid pada filter ini.
                  </td>
                </tr>
              )}
              {filtered.map((r) => {
                const d = new Date(r.paidAt);
                return (
                  <tr key={r.paymentId} className="border-b last:border-0">
                    <td className="py-2 pr-3 tabular-nums">
                      {d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}{" "}
                      <span className="text-xs text-muted-foreground">
                        {d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">{r.token}</td>
                    <td className="py-2 pr-3">{KIND_LABEL[r.kind] || r.kind}</td>
                    <td className="py-2 pr-3">
                      {r.tier === "premium" ? (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">⚡ Premium</Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Fast Track</Badge>
                      )}
                    </td>
                    <td className="py-2 font-semibold tabular-nums">{rupiah(r.amount)}</td>
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

export default ValidPaymentsPanel;
