import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Gift,
  Loader2,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isValidToken, normalizeToken } from "@/lib/token";
import {
  DEFAULT_PESERTA_SETTINGS,
  normalizePesertaSettings,
  type PesertaSettings,
} from "@/lib/peserta-settings";
import { StatusResult, type StatusData } from "./cek-status";

export const Route = createFileRoute("/peserta")({
  head: () => ({
    meta: [
      { title: "Dashboard Peserta — Prestasi Kita" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: PesertaPage,
});
type Tab = "status" | "benefits";
function PesertaPage() {
  const [settings, setSettings] = useState<PesertaSettings>(DEFAULT_PESERTA_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [data, setData] = useState<StatusData | null>(null);
  const [tab, setTab] = useState<Tab>("status");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data: setting, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "peserta_dashboard")
          .maybeSingle();
        if (error) throw error;
        if (active) setSettings(normalizePesertaSettings(setting?.value));
      } catch {
        if (active) setSettingsError(true);
      } finally {
        if (active) setSettingsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  const enabledTabs: { id: Tab; label: string; enabled: boolean; icon: typeof UserRound }[] = [
    { id: "status", label: "Tahapan Saya", enabled: settings.status_enabled, icon: ShieldCheck },
    { id: "benefits", label: "Benefit", enabled: settings.benefits_enabled, icon: Gift },
  ];
  const selected =
    enabledTabs.find((item) => item.id === tab && item.enabled)?.id ??
    enabledTabs.find((item) => item.enabled)?.id;
  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeToken(tokenInput);
    if (!isValidToken(normalized)) {
      setProblem("Format token tidak valid. Contoh: PK-PRE-7F3K9D");
      return;
    }
    setBusy(true);
    setProblem(null);
    try {
      const { data: result, error } = await supabase.functions.invoke("cek-status-pendaftar", {
        body: { token: normalized },
      });
      if (error || !result?.ok || !result.data)
        throw new Error("Token tidak ditemukan atau layanan sedang tidak tersedia.");
      setData(result.data as StatusData);
      setTokenInput("");
    } catch (err) {
      setProblem((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="min-h-[70vh] bg-muted/30 py-10 md:py-14">
      <div className="container-page mx-auto max-w-5xl">
        <Link to="/" className="text-sm font-semibold text-primary hover:underline">
          ← Kembali ke beranda
        </Link>
        {settingsLoading ? (
          <div className="mx-auto mt-16 text-center text-sm text-muted-foreground">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
            Menyiapkan dashboard…
          </div>
        ) : settingsError ? (
          <div
            role="alert"
            className="mx-auto mt-8 max-w-lg rounded-2xl border border-destructive/30 bg-background p-6 text-sm text-destructive"
          >
            Pengaturan dashboard belum dapat dimuat. Silakan muat ulang halaman.
          </div>
        ) : !data ? (
          <div className="mx-auto mt-8 max-w-lg rounded-3xl border border-border bg-background p-6 shadow-sm md:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserRound />
            </div>
            <h1 className="mt-5 text-3xl font-bold">{settings.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Masukkan token pendaftaran untuk masuk ke dashboard peserta.
            </p>
            <form onSubmit={login} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold">
                Token pendaftaran
                <input
                  autoComplete="off"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                  placeholder="PK-PRE-XXXXXX"
                  maxLength={24}
                  className="mt-2 w-full rounded-xl border bg-background px-4 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
              </label>
              {problem && (
                <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle size={16} />
                  {problem}
                </p>
              )}
              <button
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}{" "}
                Masuk Dashboard
              </button>
            </form>
            <p className="mt-4 text-xs text-muted-foreground">
              Token bersifat pribadi. Jangan bagikan kepada orang lain.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-3xl bg-primary p-6 text-primary-foreground md:p-8">
              <div>
                <p className="text-sm opacity-80">Selamat datang, {data.full_name}</p>
                <h1 className="mt-1 text-2xl font-bold md:text-3xl">{settings.title}</h1>
                <p className="mt-2 max-w-xl text-sm opacity-90">{settings.welcome}</p>
              </div>
              <button
                onClick={() => {
                  setData(null);
                  setTab("status");
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold"
              >
                <LogOut size={16} /> Keluar
              </button>
            </div>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Menu peserta">
              {enabledTabs
                .filter((item) => item.enabled)
                .map((item) => (
                  <button
                    key={item.id}
                    role="tab"
                    aria-selected={selected === item.id}
                    onClick={() => setTab(item.id)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${selected === item.id ? "bg-primary text-primary-foreground" : "border bg-background text-foreground"}`}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </button>
                ))}
            </div>
            {!selected && (
              <div className="rounded-2xl border bg-background p-6 text-muted-foreground">
                Menu peserta sedang tidak tersedia.
              </div>
            )}
            {selected === "status" && <StatusResult data={data} />}
            {selected === "benefits" && (
              <section className="rounded-3xl border bg-background p-6 shadow-sm md:p-8">
                <div className="flex items-center gap-3 text-primary">
                  <Gift />
                  <h2 className="text-xl font-bold text-foreground">{settings.benefits_title}</h2>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                  {settings.benefits_text}
                </p>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
