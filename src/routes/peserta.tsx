import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Gift,
  Loader2,
  LogOut,
  MessageCircle,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ParticipantReports } from "@/components/ParticipantReports";
import { kindLabel } from "@/lib/token";
import { supabase } from "@/integrations/supabase/client";
import { isValidToken, normalizeToken } from "@/lib/token";
import {
  DEFAULT_PESERTA_SETTINGS,
  normalizePesertaSettings,
  whatsappChannelUrl,
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
function PesertaPage() {
  const [settings, setSettings] = useState<PesertaSettings>(DEFAULT_PESERTA_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [menu, setMenu] = useState<"home" | "tahapan" | "benefit" | "laporan">("home");
  const [data, setData] = useState<StatusData | null>(null);
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
  const channelUrl = whatsappChannelUrl(settings.whatsapp_channel_url);
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
    <main className="min-h-[70vh] bg-muted/30 py-8 md:py-10">
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8 xl:px-12">
        <Link to="/" className="text-sm font-semibold text-primary hover:underline">
          ← Kembali ke beranda
        </Link>
        {settingsLoading ? (
          <div className="mt-16 text-center text-sm text-muted-foreground">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
            Menyiapkan dashboard…
          </div>
        ) : settingsError ? (
          <p role="alert" className="mt-8 text-destructive">
            Pengaturan dashboard belum dapat dimuat. Silakan muat ulang halaman.
          </p>
        ) : !data ? (
          <div className="mx-auto my-10 max-w-lg rounded-lg border bg-background p-6 shadow-sm md:p-9">
            <UserRound className="h-10 w-10 text-primary" />
            <h1 className="mt-5 text-3xl font-bold">{settings.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Masuk dengan kode pendaftaran Anda.
            </p>
            <form onSubmit={login} className="mt-6 space-y-4">
              <label className="block space-y-2 text-sm font-semibold">
                Kode pendaftaran
                <Input
                  required
                  autoComplete="off"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                  placeholder="PK-PRE-XXXXXX"
                  maxLength={40}
                  className="h-12 font-mono"
                />
              </label>
              {problem && (
                <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle size={16} />
                  {problem}
                </p>
              )}
              <Button type="submit" disabled={busy} className="h-11 w-full">
                {busy ? <Loader2 className="animate-spin" /> : <ArrowRight />}Masuk Dashboard
              </Button>
            </form>
            <p className="mt-4 text-xs text-muted-foreground">
              Kode bersifat pribadi. Jangan bagikan kepada orang lain.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
              <div>
                <p className="text-sm font-semibold text-primary">PRESTASI KITA · PESERTA</p>
                <h1 className="mt-2 text-3xl font-bold">{settings.title}</h1>
                <p className="mt-2 text-muted-foreground">Selamat datang, {data.full_name}</p>
                <p className="mt-2 text-sm text-muted-foreground">{settings.welcome}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setData(null);
                  setMenu("home");
                }}
              >
                <LogOut />
                Keluar
              </Button>
            </header>
            <div className="grid gap-6 border-b pb-6 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Kode pendaftaran
                </p>
                <p className="mt-2 break-all font-mono font-bold">{data.token}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Jalur beasiswa
                </p>
                <p className="mt-2 font-bold">{kindLabel(data.kind)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Program</p>
                <p className="mt-2 font-bold">{data.fast_track ? "Fast Track" : "Reguler"}</p>
              </div>
            </div>
            <div role="tablist" aria-label="Menu peserta" className="flex gap-1 overflow-x-auto border-b">
              {([
                ["tahapan", "Tahapan Seleksi", ShieldCheck, settings.status_enabled],
                ["benefit", "Benefit", Gift, settings.benefits_enabled],
                ["laporan", "Laporan Kendala", MessageCircle, true],
              ] as const)
                .filter((t) => t[3])
                .map(([value, label, Icon]) => {
                  const active =
                    menu === value ||
                    (menu === "home" &&
                      value === (settings.status_enabled ? "tahapan" : settings.benefits_enabled ? "benefit" : "laporan"));
                  return (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setMenu(value)}
                      className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  );
                })}
            </div>
            {(() => {
              const tab = menu === "home" ? (settings.status_enabled ? "tahapan" : settings.benefits_enabled ? "benefit" : "laporan") : menu;
              return (
              <div className="space-y-5">
                {tab === "tahapan" && settings.status_enabled && (
                  <section>
                    <StatusResult data={data} />
                  </section>
                )}
                {tab === "benefit" && settings.benefits_enabled && (
                  <section>
                    <h2 className="text-xl font-bold">{settings.benefits_title}</h2>
                    <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">
                      {settings.benefits_text}
                    </p>
                    {channelUrl && (
                      <Button asChild className="mt-5">
                        <a href={channelUrl} target="_blank" rel="noopener noreferrer">
                          <MessageCircle />
                          Channel WhatsApp
                          <ArrowRight />
                        </a>
                      </Button>
                    )}
                  </section>
                )}
                {tab === "laporan" && <ParticipantReports key={data.token} token={data.token} />}
              </div>
              );
            })()}
          </div>
        )}
      </div>
    </main>
  );
}
