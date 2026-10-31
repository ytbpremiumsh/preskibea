import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Gift,
  Loader2,
  LogOut,
  MessageSquare,
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

type Report = {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  admin_reply: string | null;
  has_image: boolean;
};
type Tab = "status" | "reports" | "benefits";
function PesertaPage() {
  const [settings, setSettings] = useState<PesertaSettings>(DEFAULT_PESERTA_SETTINGS);
  const [tokenInput, setTokenInput] = useState("");
  const [token, setToken] = useState("");
  const currentToken = useRef("");
  currentToken.current = token;
  const [data, setData] = useState<StatusData | null>(null);
  const [tab, setTab] = useState<Tab>("status");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    let active = true;
    void (async () => {
      const { data: setting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "peserta_dashboard")
        .maybeSingle();
      if (active) setSettings(normalizePesertaSettings(setting?.value));
    })();
    return () => {
      active = false;
    };
  }, []);
  const enabledTabs: { id: Tab; label: string; enabled: boolean; icon: typeof UserRound }[] = [
    { id: "status", label: "Tahapan Saya", enabled: settings.status_enabled, icon: ShieldCheck },
    {
      id: "reports",
      label: "Laporan Kendala",
      enabled: settings.reports_enabled,
      icon: MessageSquare,
    },
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
      setToken(normalized);
      setData(result.data as StatusData);
      setTokenInput("");
    } catch (err) {
      setProblem((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const loadReports = async (currentTokenValue: string) => {
    setReportsError(null);
    const { data: result, error } = await supabase.functions.invoke("peserta-kendala", {
      body: { action: "list", token: currentTokenValue },
    });
    if (currentToken.current !== currentTokenValue) return;
    if (error || !result?.ok) {
      setReportsError("Laporan belum dapat dimuat. Coba lagi.");
      return;
    }
    setReports(result.reports ?? []);
  };
  useEffect(() => {
    if (token && selected === "reports") void loadReports(token);
  }, [token, selected]);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    if (!subject.trim() || !message.trim()) {
      setReportsError("Isi judul dan penjelasan kendala.");
      return;
    }
    if (
      image &&
      (!["image/jpeg", "image/png", "image/webp"].includes(image.type) ||
        image.size > 2 * 1024 * 1024)
    ) {
      setReportsError("Gambar harus JPG, PNG, atau WebP dan maksimal 2 MB.");
      return;
    }
    setSending(true);
    setSent(false);
    setReportsError(null);
    try {
      const form = new FormData();
      form.append("action", "submit");
      form.append("token", token);
      form.append("subject", subject.trim());
      form.append("message", message.trim());
      if (image) form.append("image", image);
      const { data: result, error } = await supabase.functions.invoke("peserta-kendala", {
        body: form,
      });
      if (error || !result?.ok) throw new Error("Laporan belum terkirim. Coba lagi.");
      setSubject("");
      setMessage("");
      setImage(null);
      setInputKey((n) => n + 1);
      setSent(true);
      await loadReports(token);
    } catch (err) {
      setReportsError((err as Error).message);
    } finally {
      setSending(false);
    }
  };
  const openAttachment = async (reportId: string) => {
    const { data: result, error } = await supabase.functions.invoke("peserta-kendala", {
      body: { action: "image", token, report_id: reportId },
    });
    if (error || !result?.url) {
      setReportsError("Gambar belum dapat dibuka. Coba lagi.");
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  };
  return (
    <main className="min-h-[70vh] bg-muted/30 py-10 md:py-14">
      <div className="container-page mx-auto max-w-5xl">
        <Link to="/" className="text-sm font-semibold text-primary hover:underline">
          ← Kembali ke beranda
        </Link>
        {!data ? (
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
                  setToken("");
                  setData(null);
                  setReports([]);
                  setSubject("");
                  setMessage("");
                  setImage(null);
                  setSent(false);
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
            {selected === "reports" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-3xl border bg-background p-6 shadow-sm">
                  <h2 className="text-xl font-bold">Laporkan Kendala</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ceritakan kendala agar tim dapat membantu.
                  </p>
                  <form onSubmit={submit} className="mt-5 space-y-4">
                    <label className="block text-sm font-semibold">
                      Judul kendala
                      <input
                        value={subject}
                        maxLength={120}
                        onChange={(e) => setSubject(e.target.value)}
                        className="mt-2 w-full rounded-xl border bg-background px-4 py-3 font-normal"
                        placeholder="Contoh: kesulitan unggah berkas"
                      />
                    </label>
                    <label className="block text-sm font-semibold">
                      Penjelasan
                      <textarea
                        value={message}
                        maxLength={4000}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={5}
                        className="mt-2 w-full rounded-xl border bg-background px-4 py-3 font-normal"
                        placeholder="Ceritakan kendala yang dialami"
                      />
                    </label>
                    <label className="block text-sm font-semibold">
                      Lampiran gambar{" "}
                      <span className="font-normal text-muted-foreground">
                        (opsional, JPG/PNG/WebP maks. 2 MB)
                      </span>
                      <input
                        key={inputKey}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                        className="mt-2 block w-full text-sm font-normal"
                      />
                    </label>
                    {reportsError && (
                      <p role="alert" className="text-sm text-destructive">
                        {reportsError}
                      </p>
                    )}
                    {sent && (
                      <p className="flex gap-2 text-sm text-emerald-700">
                        <CheckCircle2 size={16} /> Laporan berhasil dikirim.
                      </p>
                    )}
                    <button
                      disabled={sending}
                      className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                    >
                      {sending ? "Mengirim…" : "Kirim Laporan"}
                    </button>
                  </form>
                </section>
                <section className="rounded-3xl border bg-background p-6 shadow-sm">
                  <h2 className="text-xl font-bold">Riwayat Laporan</h2>
                  {!reports.length ? (
                    <p className="mt-4 text-sm text-muted-foreground">Belum ada laporan.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {reports.map((r) => (
                        <article key={r.id} className="rounded-xl border p-4">
                          <div className="flex justify-between gap-3">
                            <h3 className="font-semibold">{r.subject}</h3>
                            <span className="text-xs text-muted-foreground">
                              {r.status === "resolved" ? "Selesai" : "Menunggu"}
                            </span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                            {r.message}
                          </p>
                          {r.has_image && (
                            <button
                              onClick={() => void openAttachment(r.id)}
                              className="mt-3 text-sm font-semibold text-primary"
                            >
                              Lihat lampiran
                            </button>
                          )}
                          {r.admin_reply && (
                            <p className="mt-3 rounded-lg bg-muted p-3 text-sm">
                              <strong>Balasan admin:</strong> {r.admin_reply}
                            </p>
                          )}
                          <p className="mt-3 text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleString("id-ID", {
                              timeZone: "Asia/Jakarta",
                            })}{" "}
                            WIB
                          </p>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
