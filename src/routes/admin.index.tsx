import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, GraduationCap, HeartHandshake, Clock, FileText, Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

// Lazy-load charts to keep recharts out of the initial admin bundle
const LineDaily = lazy(() => import("@/components/admin/DashboardCharts").then((m) => ({ default: m.LineDaily })));
const PieKind = lazy(() => import("@/components/admin/DashboardCharts").then((m) => ({ default: m.PieKind })));
const BarJenjang = lazy(() => import("@/components/admin/DashboardCharts").then((m) => ({ default: m.BarJenjang })));

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

type RecentRow = {
  id: string;
  full_name: string;
  email: string;
  kind: "prestasi" | "ekonomi" | "umum" | "yatim";
  status: string;
  school_name: string;
  education_level: string;
  fast_track: boolean | null;
  created_at: string;
};

type LiteRow = {
  kind: "prestasi" | "ekonomi" | "umum" | "yatim";
  education_level: string;
  fast_track: boolean | null;
  created_at: string;
};

const JENJANG = ["SMP", "SMA", "SMK", "MA", "Mahasiswa"] as const;

function normalizeJenjang(v: string): string {
  const u = (v || "").toUpperCase();
  if (u.includes("MAHASISWA") || u.includes("KULIAH") || u.includes("UNIV")) return "Mahasiswa";
  if (u.includes("SMK")) return "SMK";
  if (u.includes("MA")) return "MA";
  if (u.includes("SMA")) return "SMA";
  if (u.includes("SMP") || u.includes("MTS")) return "SMP";
  return v || "Lainnya";
}

function ChartFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function AdminOverview() {
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [lite, setLite] = useState<LiteRow[]>([]);
  const [counts, setCounts] = useState({ total: 0, prestasi: 0, ekonomi: 0, umum: 0, yatim: 0, pending: 0, today: 0, docs: 0, fastTrack: 0 });
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("admin_notif_off") !== "1";
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      // Fast: today (start) ISO + 14 days back ISO
      const now = new Date();
      const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
      const start14 = new Date(startToday); start14.setDate(start14.getDate() - 13);

      // Fire all queries in parallel; use head:true counts for totals (no row data)
      const [
        recentRes,
        liteRes,
        totalRes,
        prestasiRes,
        ekonomiRes,
        umumRes,
        yatimRes,
        pendingRes,
        todayRes,
        docsRes,
        fastTrackRes,
      ] = await Promise.all([
        supabase.from("registrations")
          .select("id,full_name,email,kind,status,school_name,education_level,created_at,fast_track")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase.from("registrations")
          .select("kind,education_level,created_at,fast_track")
          .gte("created_at", start14.toISOString())
          .limit(5000),
        supabase.from("registrations").select("id", { count: "exact", head: true }),
        supabase.from("registrations").select("id", { count: "exact", head: true }).eq("kind", "prestasi"),
        supabase.from("registrations").select("id", { count: "exact", head: true }).eq("kind", "ekonomi"),
        supabase.from("registrations").select("id", { count: "exact", head: true }).eq("kind", "umum"),
        supabase.from("registrations").select("id", { count: "exact", head: true }).eq("kind", "yatim"),
        supabase.from("registrations").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("registrations").select("id", { count: "exact", head: true }).gte("created_at", startToday.toISOString()),
        supabase.from("documents").select("id", { count: "exact", head: true }),
        supabase.from("registrations").select("id", { count: "exact", head: true }).eq("fast_track", true),
      ]);

      if (!active) return;
      setRecent((recentRes.data ?? []) as RecentRow[]);
      setLite((liteRes.data ?? []) as LiteRow[]);
      setCounts({
        total: totalRes.count ?? 0,
        prestasi: prestasiRes.count ?? 0,
        ekonomi: ekonomiRes.count ?? 0,
        umum: umumRes.count ?? 0,
        yatim: yatimRes.count ?? 0,
        pending: pendingRes.count ?? 0,
        today: todayRes.count ?? 0,
        docs: docsRes.count ?? 0,
        fastTrack: fastTrackRes.count ?? 0,
      });

      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, []);

  // Realtime subscribe (only after initial paint)
  useEffect(() => {
    const channel = supabase
      .channel("admin-registrations")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "registrations" },
        (payload) => {
          const newRow = payload.new as RecentRow;
          setRecent((prev) => [newRow, ...prev].slice(0, 8));
          setLite((prev) => [{ kind: newRow.kind, education_level: newRow.education_level, created_at: newRow.created_at, fast_track: newRow.fast_track }, ...prev]);
          setCounts((c) => ({
            ...c,
            total: c.total + 1,
            today: c.today + 1,
            prestasi: c.prestasi + (newRow.kind === "prestasi" ? 1 : 0),
            ekonomi: c.ekonomi + (newRow.kind === "ekonomi" ? 1 : 0),
            fastTrack: c.fastTrack + (newRow.fast_track ? 1 : 0),
          }));
          if (notif) {
            toast.success(`Pendaftar baru: ${newRow.full_name}`, {
              description: `${newRow.kind === "prestasi" ? "Beasiswa Prestasi" : "Beasiswa Ekonomi"} · ${newRow.school_name}`,
              duration: 8000,
            });
            try { audioRef.current?.play().catch(() => {}); } catch { /* ignore */ }
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              new Notification("Pendaftar baru", { body: `${newRow.full_name} — ${newRow.school_name}` });
            }
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [notif]);

  const toggleNotif = async () => {
    const next = !notif;
    setNotif(next);
    localStorage.setItem("admin_notif_off", next ? "0" : "1");
    if (next && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    toast.message(next ? "Notifikasi diaktifkan" : "Notifikasi dimatikan");
  };

  const byJenjang = useMemo(() => {
    const map = new Map<string, { name: string; prestasi: number; ekonomi: number; total: number }>();
    for (const j of JENJANG) map.set(j, { name: j, prestasi: 0, ekonomi: 0, total: 0 });
    for (const r of lite) {
      const j = normalizeJenjang(r.education_level);
      const cur = map.get(j) ?? { name: j, prestasi: 0, ekonomi: 0, total: 0 };
      if (r.kind === "prestasi") cur.prestasi++; else cur.ekonomi++;
      cur.total++;
      map.set(j, cur);
    }
    return Array.from(map.values());
  }, [lite]);

  const byKind = useMemo(() => [
    { name: "Prestasi", value: counts.prestasi },
    { name: "Ekonomi", value: counts.ekonomi },
  ], [counts]);

  const dailyStats = useMemo(() => {
    const days: { date: string; label: string; count: number; fastTrack: number }[] = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      days.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        count: 0,
        fastTrack: 0,
      });
    }
    const idx = new Map(days.map((d, i) => [d.date, i]));
    for (const r of lite) {
      const k = new Date(r.created_at).toISOString().slice(0, 10);
      const i = idx.get(k);
      if (i !== undefined) {
        days[i].count++;
        if (r.fast_track) days[i].fastTrack++;
      }
    }
    return days;
  }, [lite]);

  const items = [
    { label: "Total Pendaftar", value: counts.total, icon: GraduationCap, color: "text-primary", bg: "bg-primary/10" },
    { label: "Pendaftar Fast Track", value: counts.fastTrack, icon: Clock, color: "text-orange-600", bg: "bg-orange-100" },
    { label: "Hari Ini", value: counts.today, icon: Clock, color: "text-emerald-700", bg: "bg-emerald-100" },
    { label: "Beasiswa Prestasi", value: counts.prestasi, icon: GraduationCap, color: "text-primary", bg: "bg-primary/10" },
    { label: "Beasiswa Ekonomi", value: counts.ekonomi, icon: HeartHandshake, color: "text-accent-foreground", bg: "bg-accent/30" },
    { label: "Berkas Diunggah", value: counts.docs, icon: FileText, color: "text-blue-700", bg: "bg-blue-100" },
  ];

  return (
    <div className="space-y-6">
      <audio
        ref={audioRef}
        preload="none"
        src="data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Statistik Pendaftaran</h1>
          <p className="text-sm text-muted-foreground">
            Update real-time {loading ? "· memuat…" : `· ${counts.today} pendaftar hari ini`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={toggleNotif}>
          {notif ? <Bell className="h-4 w-4 mr-1.5" /> : <BellOff className="h-4 w-4 mr-1.5" />}
          {notif ? "Notifikasi: ON" : "Notifikasi: OFF"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((it) => (
          <Card key={it.label} className="rounded-2xl p-5 shadow-soft">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${it.bg} ${it.color}`}>
              <it.icon className="h-5 w-5" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {loading ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-muted" /> : it.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{it.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl p-5 shadow-soft lg:col-span-2">
          <h2 className="text-base font-semibold text-foreground">Pendaftar per Hari (14 hari terakhir)</h2>
          <div className="mt-4 h-64">
            <Suspense fallback={<ChartFallback />}>
              {!loading && <LineDaily data={dailyStats} showFastTrack={true} />}
            </Suspense>
          </div>
        </Card>

        <Card className="rounded-2xl p-5 shadow-soft">
          <h2 className="text-base font-semibold text-foreground">Distribusi Kategori</h2>
          <div className="mt-4 h-64">
            <Suspense fallback={<ChartFallback />}>
              {!loading && <PieKind data={byKind} />}
            </Suspense>
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl p-5 shadow-soft">
        <h2 className="text-base font-semibold text-foreground">Pendaftar per Jenjang (14 hari terakhir)</h2>
        <div className="mt-4 h-72">
          <Suspense fallback={<ChartFallback />}>
            {!loading && <BarJenjang data={byJenjang} />}
          </Suspense>
        </div>
      </Card>

      <Card className="rounded-2xl p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Pendaftar Beasiswa Terbaru</h2>
            <p className="text-xs text-muted-foreground">8 pendaftar paling baru.</p>
          </div>
          <Link to="/admin/pendaftar" className="text-sm font-medium text-primary hover:underline">
            Lihat semua
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada pendaftar.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Nama</th>
                  <th className="px-3 py-2">Kategori</th>
                  <th className="px-3 py-2">Sekolah / Kampus</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2 font-medium text-foreground">{r.full_name}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="capitalize">{r.kind}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div>{r.school_name}</div>
                      <div className="text-xs uppercase text-muted-foreground">{r.education_level}</div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{r.email}</td>
                    <td className="px-3 py-2 text-muted-foreground">{new Date(r.created_at).toLocaleDateString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
