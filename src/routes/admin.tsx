import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, BellOff, Loader2, LogOut, Home, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Ringkasan Dashboard",
  "/admin/analytics": "Google Analytics",
  "/admin/pendaftar": "Data Pendaftar",
  "/admin/esai": "Pengiriman Esai",
  "/admin/berkas": "Pengiriman Berkas",
  "/admin/tahapan-seleksi": "Tahapan Seleksi",
  "/admin/kandidat": "Kandidat Lolos",
  "/admin/artikel": "Artikel",
  "/admin/formulir": "Formulir",
  "/admin/bagikan-poster": "Bagikan Poster",
  "/admin/media": "Media & File",
  "/admin/whatsapp": "WhatsApp",
  "/admin/ai-balasan": "Balasan AI",
  "/admin/pengaturan": "Pengaturan Situs",
  "/admin/integrasi": "Integrasi Pembayaran",
  "/admin/branding": "Logo Situs",
  "/admin/widgets": "Widget Home",
  "/admin/email-template": "Template Email",
  "/admin/keamanan": "Keamanan (2FA)",
  "/admin/adsense": "AdSense",
  "/admin/iklan-kustom": "Iklan Kustom",
  "/admin/kode-kustom": "Kode & Performa",
  "/admin/sistem-update": "Sistem Update",
  "/admin/maintenance": "Mode Maintenance",
};

type PaymentRealtimeRow = {
  id: string;
  amount: number | string | null;
  registration_id: string;
  status: string;
};

const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const spokenRupiah = (value: number) => `${Math.round(value || 0).toLocaleString("id-ID")} rupiah`;

function jakartaTodayRange() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: "year" | "month" | "day") =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  const start = new Date(Date.UTC(value("year"), value("month") - 1, value("day"), -7));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Prestasi Kita" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const pageTitle = PAGE_TITLES[currentPath.replace(/\/$/, "")] ?? "Admin Dashboard";
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("admin_payment_sound_off") !== "1";
  });
  const notifiedPaymentsRef = useRef(new Set<string>());

  const speakPayment = useCallback(
    (message: string, force = false) => {
      if (!force && !soundEnabled) return;
      if (!("speechSynthesis" in window)) {
        toast.error("Perangkat ini belum mendukung suara pembaca");
        return;
      }

      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = "id-ID";
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;
      const indonesianVoice = window.speechSynthesis
        .getVoices()
        .find((voice) => voice.lang.toLowerCase().startsWith("id"));
      if (indonesianVoice) utterance.voice = indonesianVoice;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    },
    [soundEnabled],
  );

  useEffect(() => {
    let active = true;
    const check = async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate({ to: "/login" });
        return;
      }
      setEmail(sess.session.user.email ?? null);
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", sess.session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!active) return;
      if (error || !data) {
        setIsAdmin(false);
      } else {
        setIsAdmin(true);
      }
      setChecking(false);
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/login" });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (!isAdmin) return;

    const unlockSpeech = () => {
      if (!("speechSynthesis" in window)) return;
      const silent = new SpeechSynthesisUtterance(" ");
      silent.volume = 0;
      silent.lang = "id-ID";
      window.speechSynthesis.speak(silent);
      window.speechSynthesis.resume();
    };
    window.addEventListener("pointerdown", unlockSpeech, { once: true });
    window.addEventListener("keydown", unlockSpeech, { once: true });

    const notifyPaidRegistration = async (registrationId: string, knownAmount?: number) => {
      if (!registrationId || notifiedPaymentsRef.current.has(registrationId)) return;
      // Klaim berdasarkan peserta agar event payments + registrations tidak bersuara dua kali.
      notifiedPaymentsRef.current.add(registrationId);

      const { data: registration } = await supabase
        .from("registrations")
        .select("id,full_name,fast_track,extra")
        .eq("id", registrationId)
        .maybeSingle();
      if (!registration?.fast_track) {
        notifiedPaymentsRef.current.delete(registrationId);
        return;
      }

      let amount = knownAmount ?? 0;
      if (!amount) {
        // Webhook menulis registrations lebih dahulu, lalu payments. Beri waktu agar
        // record pembayaran tersedia sebelum nominal dan total dibacakan.
        for (let attempt = 0; attempt < 3; attempt += 1) {
          if (attempt > 0) await new Promise((resolve) => window.setTimeout(resolve, 500));
          const { data: latestPayment } = await supabase
            .from("payments")
            .select("amount")
            .eq("registration_id", registrationId)
            .eq("status", "paid")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          amount = Number(latestPayment?.amount) || 0;
          if (amount > 0) break;
        }
      }

      const isPremium = (registration.extra as any)?.fast_track_type === "premium";
      const tier = isPremium ? "FT Premium" : "Fast Track";
      if (!amount) amount = isPremium ? 40000 : 10000;
      const description = `${registration.full_name || "Peserta"} · ${rupiah(amount)} · 1 pembayaran`;

      const { start, end } = jakartaTodayRange();
      const { data: todayPayments } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "paid")
        .gte("created_at", start)
        .lt("created_at", end);
      const todayCount = todayPayments?.length ?? 1;
      const todayTotal = (todayPayments ?? []).reduce(
        (total, row) => total + (Number(row.amount) || 0),
        0,
      );

      toast.success(`Pembayaran ${tier} masuk`, {
        description,
        duration: 10000,
      });
      speakPayment(
        `Pembayaran baru masuk dari ${registration.full_name || "peserta"}, sebesar ${spokenRupiah(amount)}. Total pendapatan hari ini ${spokenRupiah(todayTotal)} dari ${todayCount} pembayaran.`,
      );

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`Pembayaran ${tier} masuk`, {
          body: description,
          tag: `payment-${registrationId}`,
        });
      }

      if (notifiedPaymentsRef.current.size > 100) {
        const oldest = notifiedPaymentsRef.current.values().next().value;
        if (oldest) notifiedPaymentsRef.current.delete(oldest);
      }
    };

    const channel = supabase
      .channel("admin-global-payment-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
        async (payload) => {
          const payment = payload.new as PaymentRealtimeRow;
          if (!payment?.id || payment.status !== "paid") return;

          const previous = payload.old as Partial<PaymentRealtimeRow>;
          if (previous?.status === "paid") return;
          await notifyPaidRegistration(payment.registration_id, Number(payment.amount) || 0);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "registrations" },
        async (payload) => {
          const current = payload.new as {
            id?: string;
            fast_track?: boolean | null;
            payment_status?: string | null;
          };
          const previous = payload.old as { payment_status?: string | null };
          if (
            !current.id ||
            !current.fast_track ||
            current.payment_status !== "paid" ||
            previous?.payment_status === "paid"
          ) {
            return;
          }
          await new Promise((resolve) => window.setTimeout(resolve, 700));
          await notifyPaidRegistration(current.id);
        },
      )
      .subscribe();

    return () => {
      window.removeEventListener("pointerdown", unlockSpeech);
      window.removeEventListener("keydown", unlockSpeech);
      supabase.removeChannel(channel);
    };
  }, [isAdmin, speakPayment]);

  const toggleSound = async () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("admin_payment_sound_off", next ? "0" : "1");
    if (next) {
      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }
      toast.success("Suara pembayaran diaktifkan");
    } else {
      toast.message("Suara pembayaran dinonaktifkan");
    }
  };

  const testSound = async () => {
    const { start, end } = jakartaTodayRange();
    const { data } = await supabase
      .from("payments")
      .select("amount")
      .eq("status", "paid")
      .gte("created_at", start)
      .lt("created_at", end);
    const count = data?.length ?? 0;
    const total = (data ?? []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    speakPayment(
      `Tes suara pembayaran. Total pendapatan hari ini ${spokenRupiah(total)} dari ${count} pembayaran.`,
      true,
    );
    toast.success("Tes suara pembayaran berhasil diputar");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Anda telah keluar");
    navigate({ to: "/login" });
  };

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">Akses Ditolak</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Akun <span className="font-medium">{email}</span> belum memiliki role admin. Hubungi
          administrator utama untuk diberikan akses.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="outline" onClick={logout}>
            Keluar
          </Button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Beranda
          </Link>
        </div>
      </div>
    );
  }

  const initial = (email ?? "A").charAt(0).toUpperCase();

  return (
    <SidebarProvider>
      <div className="admin-theme min-h-screen flex w-full">
        <AdminSidebar />
        <SidebarInset className="bg-transparent">
          <header className="admin-header-glass sticky top-0 z-30 flex h-16 items-center gap-2 px-3 md:gap-3 md:px-6">
            <SidebarTrigger className="shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold tracking-tight text-foreground">
                {pageTitle}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                Panel Admin — Prestasi Kita
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link to="/" target="_blank" rel="noopener noreferrer">
                <Home className="mr-1 h-4 w-4" /> Lihat Situs
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSound}
              title={soundEnabled ? "Matikan suara pembayaran" : "Aktifkan suara pembayaran"}
              className="shrink-0"
            >
              {soundEnabled ? (
                <Bell className="h-4 w-4 sm:mr-1" />
              ) : (
                <BellOff className="h-4 w-4 sm:mr-1" />
              )}
              <span className="hidden sm:inline">Suara: {soundEnabled ? "ON" : "OFF"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={testSound}
              title="Tes suara pembayaran"
              className="shrink-0"
            >
              <Volume2 className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Tes Suara</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
            <div
              title={email ?? undefined}
              className="admin-stat-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground ring-2 ring-white/70"
            >
              {initial}
            </div>
          </header>
          <div className="mx-auto w-full max-w-[1400px] px-3 py-5 md:px-6 md:py-8">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
