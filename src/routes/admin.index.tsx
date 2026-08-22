import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, GraduationCap, HeartHandshake, Clock, FileText, Bell, BellOff, Zap } from "lucide-react";
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
  extra: Json;
};

type LiteRow = {
  kind: "prestasi" | "ekonomi" | "umum" | "yatim";
  education_level: string;
  fast_track: boolean | null;
  created_at: string;
  extra: Json;
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
  const [counts, setCounts] = useState({ total: 0, prestasi: 0, ekonomi: 0, umum: 0, yatim: 0, pending: 0, today: 0, docs: 0, fastTrack: 0, fastTrackPremium: 0 });
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
          .select("id,full_name,email,kind,status,school_name,education_level,created_at,fast_track,extra")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase.from("registrations")
          .select("kind,education_level,created_at,fast_track,extra")
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
      const liteData = (liteRes.data ?? []) as LiteRow[];
      setLite(liteData);
      
      const premiumCount = liteData.filter(r => (r as any).extra?.fast_track_type === 'premium').length;

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
        fastTrackPremium: premiumCount,
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
          const isPremium = (newRow.extra as any)?.fast_track_type === 'premium';
          setLite((prev) => [{ kind: newRow.kind, education_level: newRow.education_level, created_at: newRow.created_at, fast_track: newRow.fast_track, extra: newRow.extra } as any, ...prev]);
          setCounts((c) => ({
            ...c,
            total: c.total + 1,
            today: c.today + 1,
            prestasi: c.prestasi + (newRow.kind === "prestasi" ? 1 : 0),
            ekonomi: c.ekonomi + (newRow.kind === "ekonomi" ? 1 : 0),
            umum: c.umum + (newRow.kind === "umum" ? 1 : 0),
            yatim: c.yatim + (newRow.kind === "yatim" ? 1 : 0),

            fastTrack: c.fastTrack + (newRow.fast_track ? 1 : 0),
            fastTrackPremium: c.fastTrackPremium + (isPremium ? 1 : 0),
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
    type Row = { name: string; prestasi: number; ekonomi: number; umum: number; yatim: number; total: number };
    const blank = (name: string): Row => ({ name, prestasi: 0, ekonomi: 0, umum: 0, yatim: 0, total: 0 });
    const map = new Map<string, Row>();
    for (const j of JENJANG) map.set(j, blank(j));
    for (const r of lite) {
      const j = normalizeJenjang(r.education_level);
      const cur = map.get(j) ?? blank(j);
      if (r.kind === "prestasi") cur.prestasi++;
      else if (r.kind === "ekonomi") cur.ekonomi++;
      else if (r.kind === "umum") cur.umum++;
      else if (r.kind === "yatim") cur.yatim++;
      cur.total++;
      map.set(j, cur);
    }
    return Array.from(map.values());
  }, [lite]);

  const byKind = useMemo(() => [
    { name: "Prestasi", value: counts.prestasi },
    { name: "Ekonomi", value: counts.ekonomi },
    { name: "Umum", value: counts.umum },
    { name: "Yatim", value: counts.yatim },
  ], [counts]);


  const dailyStats = useMemo(() => {
    const days: { date: string; label: string; count: number; fastTrack: number; fastTrackPremium: number }[] = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      days.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        count: 0,
        fastTrack: 0,
        fastTrackPremium: 0,
      });
    }
    const idx = new Map(days.map((d, i) => [d.date, i]));
    for (const r of lite) {
      const k = new Date(r.created_at).toISOString().slice(0, 10);
      const i = idx.get(k);
      if (i !== undefined) {
        days[i].count++;
        if (r.fast_track) days[i].fastTrack++;
        if (r.fast_track && (r as any).extra?.fast_track_type === 'premium') days[i].fastTrackPremium++;
      }
    }
    return days;
  }, [lite]);

  const items = [
    { label: "Total Pendaftar", value: counts.total, icon: GraduationCap, color: "text-primary", bg: "bg-primary/10", url: "/admin/pendaftar" },
    { label: "Hari Ini", value: counts.today, icon: Clock, color: "text-emerald-700", bg: "bg-emerald-100", url: "/admin/pendaftar" },
    { label: "Fast Track", value: counts.fastTrack, icon: Clock, color: "text-orange-600", bg: "bg-orange-100", url: "/admin/pendaftar" },
    { label: "FT Premium", value: counts.fastTrackPremium, icon: Zap, color: "text-amber-600", bg: "bg-amber-100", url: "/admin/pendaftar" },
    { label: "Berkas Diunggah", value: counts.docs, icon: FileText, color: "text-blue-700", bg: "bg-blue-100", url: "/admin/berkas" },
    { label: "Beasiswa Prestasi", value: counts.prestasi, icon: GraduationCap, color: "text-indigo-600", bg: "bg-indigo-100", url: "/admin/pendaftar?kind=prestasi" },
    { label: "Beasiswa Ekonomi", value: counts.ekonomi, icon: HeartHandshake, color: "text-emerald-700", bg: "bg-emerald-100", url: "/admin/pendaftar?kind=ekonomi" },
    { label: "Beasiswa Umum", value: counts.umum, icon: GraduationCap, color: "text-teal-700", bg: "bg-teal-100", url: "/admin/pendaftar?kind=umum" },
    { label: "Beasiswa Yatim", value: counts.yatim, icon: HeartHandshake, color: "text-fuchsia-700", bg: "bg-fuchsia-100", url: "/admin/pendaftar?kind=yatim" },
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Main Stats Row */}
        {items.slice(0, 5).map((it) => (
          <Link key={it.label} to={it.url as any} className="block transition-transform hover:scale-[1.02] active:scale-[0.98]">
            <Card className="rounded-2xl p-5 shadow-soft h-full border-2 border-primary/20 bg-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-primary/5 rounded-full transition-transform group-hover:scale-110" />
              <div className="relative flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">{it.label}</p>
                  <p className="text-3xl font-black tabular-nums text-foreground sm:text-4xl">
                    {loading ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-muted" /> : it.value}
                  </p>
                </div>
                <div className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${it.bg} ${it.color} shadow-sm border border-current/10`}>
                  <it.icon className="h-6 w-6" />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Category Stats Row */}
        {items.slice(5).map((it) => (
          <Link key={it.label} to={it.url as any} className="block transition-transform hover:scale-[1.02] active:scale-[0.98]">
            <Card className="rounded-2xl p-5 shadow-sm h-full bg-white border-2 border-muted hover:border-primary/20 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${it.bg} ${it.color} shadow-sm border border-current/10`}>
                  <it.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{it.label}</p>
                  <p className="text-2xl font-black tabular-nums text-foreground">
                    {loading ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-muted" /> : it.value}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl p-5 shadow-soft lg:col-span-2">
          <h2 className="text-base font-semibold text-foreground">Pendaftar per Hari (14 hari terakhir)</h2>
          <div className="mt-4 h-64">
            <Suspense fallback={<ChartFallback />}>
              {!loading && <LineDaily data={dailyStats} showFastTrack={true} showFastTrackPremium={true} />}
            </Suspense>
          </div>
        </Card>

        <Card className="rounded-2xl p-5 shadow-soft">
          <h2 className="text-base font-semibold text-foreground">Distribusi Kategori</h2>
          <div className="mt-4 h-72">

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
