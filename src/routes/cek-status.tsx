import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Loader2, AlertCircle, FileText, ArrowRight, Zap, PenLine, Award, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Search = { token?: string };

export const Route = createFileRoute("/cek-status")({
  head: () => ({
    meta: [
      { title: "Cek Status Pendaftaran — Beasiswa Prestasi Kita" },
      { name: "description", content: "Cek status pendaftaran beasiswa Prestasi Kita Anda dengan kode pendaftar. Pantau progres berkas dan hasil seleksi." },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  component: CekStatusPage,
});

type StatusData = {
  full_name: string;
  kind: "prestasi" | "ekonomi" | "umum" | "yatim";
  status: "pending" | "approved" | "rejected";
  candidate_status: string;
  created_at: string;
  token: string;
  fast_track?: boolean;
  extra?: any;
  payment_status?: string | null;
  essay_submitted?: boolean;
  essay_submitted_at?: string | null;
  essay_status?: "pending" | "approved" | "rejected";
  essay_announcement_published?: boolean;
  essay_announcement_message?: string | null;
  essay_auto_reguler?: boolean;
  education_level?: string | null;
  admin_announcement_published?: boolean;
  admin_announcement_message?: string | null;
  tpa_status?: "pending" | "approved" | "rejected";
  tpa_announcement_published?: boolean;
  tpa_announcement_message?: string | null;
  interview_status?: "pending" | "approved" | "rejected";
  interview_announcement_published?: boolean;
  interview_announcement_message?: string | null;
  docs: { total: number; pending: number; approved: number; rejected: number };
};

function CekStatusPage() {
  const { token: initialToken } = useSearch({ from: "/cek-status" });
  const [token, setToken] = useState((initialToken ?? "").toUpperCase());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StatusData | null>(null);

  const handleCheck = async (silent = false) => {
    const t = token.trim().toUpperCase();
    if (!t) {
      if (!silent) toast.error("Masukkan kode pendaftar");
      return;
    }
    if (!/^(PK|KP)-(PRE|EKO|UMU|YAT)-/.test(t)) {
      setError("Format kode tidak valid. Contoh: PK-PRE-7F3K9D");
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const { data: res, error: err } = await supabase.functions.invoke("cek-status-pendaftar", {
        body: { token: t },
      });
      if (err) throw err;
      const payload = res as { ok: boolean; data?: StatusData; error?: string };
      if (!payload?.ok || !payload.data) {
        setError(payload?.error === "not_found" ? "Kode tidak ditemukan." : "Gagal memuat status.");
        return;
      }
      setData(payload.data);
    } catch (e) {
      console.error(e);
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialToken) handleCheck(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken]);

  return (
    <main className="container-page py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="text-xs font-semibold text-primary hover:underline">← Kembali ke Beranda</Link>
        <div className="mt-4">
          <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">Cek Status</span>
          <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-foreground">Cek Status Pendaftaran</h1>
          <p className="mt-2 text-muted-foreground">
            Masukkan kode pendaftar Anda untuk melihat progres pendaftaran dan berkas.
          </p>
        </div>

        <div className="card-block mt-8 p-6 md:p-7">
          <label className="block">
            <span className="text-xs font-medium text-foreground/80">
              Kode Pendaftar<span className="text-destructive"> *</span>
            </span>
            <div className="mt-1.5 grid sm:grid-cols-[1fr_auto] gap-3">
              <div className="relative">
                <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={token}
                  onChange={(e) => { setToken(e.target.value.toUpperCase()); setError(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCheck(); } }}
                  placeholder="PK-PRE-XXXXXX, PK-EKO-XXXXXX, PK-UMU-XXXXXX, atau PK-YAT-XXXXXX"
                  maxLength={20}
                  className="w-full rounded-xl border border-border bg-background pl-9 pr-3.5 py-2.5 text-sm font-mono tracking-wider text-foreground outline-none transition focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <button
                type="button"
                onClick={() => handleCheck()}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 transition disabled:opacity-60"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                Cek Status
              </button>
            </div>
          </label>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}
        </div>

        {data && <StatusResult data={data} />}
      </div>
    </main>
  );
}


function StatusResult({ data }: { data: StatusData }) {
  const jenis = data.kind === "prestasi" ? "Beasiswa Prestasi" : data.kind === "ekonomi" ? "Beasiswa Ekonomi" : data.kind === "yatim" ? "Beasiswa Yatim" : "Beasiswa Umum";
  const berkasTo = data.kind === "prestasi" ? "/berkas/prestasi/upload" : data.kind === "ekonomi" ? "/berkas/ekonomi/upload" : data.kind === "yatim" ? "/berkas/yatim/upload" : "/berkas/umum/upload";
  const hasDocs = data.docs.total > 0;
  const isFast = !!data.fast_track;
  const isFTPremium = isFast && (data.extra as any)?.fast_track_type === "premium";
  const fastPaid = isFast && data.payment_status === "paid";
  const fastUnpaid = isFast && !fastPaid;
  const essayDone = fastPaid || !!data.essay_submitted;
  const essayStatus = fastPaid ? "approved" : (data.essay_status ?? "pending");
  const essayPublished = !!data.essay_announcement_published;
  // Auto lolos khusus jalur reguler (diatur admin)
  const essayAutoReguler = !isFast && !!data.essay_auto_reguler && !!data.essay_submitted;

  const adminPublished = !!data.admin_announcement_published;
  const adminStatus = (data.candidate_status ?? "pending") as "pending" | "approved" | "rejected";
  const tpaPublished = !!data.tpa_announcement_published;
  const tpaStatus = data.tpa_status ?? "pending";
  const itwPublished = !!data.interview_announcement_published;
  const itwStatus = data.interview_status ?? "pending";
  // Hasil per-peserta yang sudah dinilai admin tetap ditampilkan walau pengumuman global belum dirilis
  const tpaShown = tpaPublished || tpaStatus !== "pending";
  const itwShown = itwPublished || itwStatus !== "pending";

  const adminResultLabel = isFTPremium
    ? "Lolos Seleksi Administrasi (otomatis — Fast Track Premium)"
    : !hasDocs
    ? "Menunggu pengiriman berkas"
    : !adminPublished
    ? "Sedang diproses"
    : adminStatus === "approved"
    ? "Lolos seleksi administrasi"
    : adminStatus === "rejected"
    ? "Belum lolos seleksi administrasi"
    : "Sedang diverifikasi";
  const essayResultLabel = fastUnpaid
    ? "Menunggu pembayaran Fast Track"
    : fastPaid
    ? "Lolos otomatis (Fast Track)"
    : essayAutoReguler
    ? "Lolos otomatis (Reguler)"
    : !essayPublished
    ? "Pengumuman belum dirilis"
    : essayStatus === "approved"
    ? "Lolos tahap esai"
    : essayStatus === "rejected"
    ? "Belum lolos tahap esai"
    : "Sedang dinilai";
  const [certConfig, setCertConfig] = useState<{ enabled: boolean; releaseDate?: string }>({ enabled: false });
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "certificate_config")
      .maybeSingle()
      .then(({ data: res }) => {
        if (res?.value) {
          setCertConfig(res.value as any);
        } else {
          setCertConfig({ enabled: true }); // Default enabled
        }
      });
  }, []);

  const canDownload = certConfig.enabled && (!certConfig.releaseDate || new Date() >= new Date(certConfig.releaseDate));

  const downloadCert = async () => {
    setDownloading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("generate-certificate", {
        body: { token: data.token },
      });
      if (error) throw error;

      const blob = new Blob([res], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Sertifikat_${data.token}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success("Sertifikat berhasil diunduh");
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunduh sertifikat");
    } finally {
      setDownloading(false);
    }
  };


  return (
    <div className="card-block mt-6 p-6 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Pendaftar</div>
          <div className="mt-1 text-xl font-extrabold text-foreground">{data.full_name}</div>
          <div className="mt-1 text-sm text-muted-foreground">{jenis} · Kode: <span className="font-mono font-semibold text-foreground">{data.token}</span></div>
          {data.education_level && (
            <div className="mt-0.5 text-xs text-muted-foreground">Jenjang: <span className="font-semibold text-foreground/80">{data.education_level}</span></div>
          )}
        </div>
        <span
          className={`rounded-full border-2 px-3 py-1 text-xs font-bold ${
            isFast
              ? "border-amber-500 bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
              : "border-border bg-muted text-muted-foreground"
          }`}
        >
          {isFast ? (isFTPremium ? "⚡ Fast Track Premium" : "⚡ Fast Track") : "Jalur Reguler"}
        </span>
      </div>

      {/* Timeline */}
      {(() => {
        const essayPass = fastPaid || essayAutoReguler || (!isFast && essayPublished && essayStatus === "approved");
        const essayFail = !isFast && !essayAutoReguler && essayPublished && essayStatus === "rejected";
        const admPass = isFTPremium || (adminPublished && adminStatus === "approved");
        const admFail = !isFTPremium && adminPublished && adminStatus === "rejected";
        const tpaPass = tpaShown && tpaStatus === "approved";
        const tpaFail = tpaShown && tpaStatus === "rejected";
        const itwPass = itwShown && itwStatus === "approved";
        const itwFail = itwShown && itwStatus === "rejected";

        const outcomes: ("pass" | "fail" | "wait")[] = [
          "pass",
          essayPass ? "pass" : essayFail ? "fail" : "wait",
          admPass ? "pass" : admFail ? "fail" : "wait",
          tpaPass ? "pass" : tpaFail ? "fail" : "wait",
          itwPass ? "pass" : itwFail ? "fail" : "wait",
        ];
        // Tahap aktif = tahap "wait" pertama setelah semua tahap sebelumnya lolos
        let activeIdx = -1;
        for (let i = 0; i < outcomes.length; i++) {
          if (outcomes[i] === "pass") continue;
          if (outcomes[i] === "wait") activeIdx = i;
          break;
        }
        const act = (i: number) => activeIdx === i;
        const waitText = (i: number, fallback: string) =>
          act(i) ? "Menunggu" : fallback;

        return (
      <div className="mt-6 flex flex-col gap-3">
        <Step
          n={1}
          label="Pendaftaran"
          done
          desc="Data pendaftaran diterima"
          status={{ text: "Lolos ke tahap berikutnya", tone: "pass" }}
        />
        <Step
          n={2}
          label="Pengiriman Essai"
          done={essayPass}
          rejected={essayFail}
          active={act(1)}
          desc={
            fastUnpaid
              ? "Menunggu pembayaran Fast Track diverifikasi"
              : fastPaid
              ? "Otomatis lolos (Fast Track)"
              : !essayDone
              ? "Esai belum dikirim"
              : essayAutoReguler
              ? "Otomatis lolos (Reguler)"
              : essayPublished
              ? essayResultLabel
              : "Esai terkirim, sedang diproses"
          }
          status={
            fastUnpaid
              ? { text: "Menunggu", tone: "wait" }
              : fastPaid
              ? { text: "⚡ Auto Lolos (Fast Track)", tone: "pass" }
              : essayAutoReguler
              ? { text: "✅ Auto Lolos (Reguler)", tone: "pass" }
              : essayPass
              ? { text: "Lolos ke tahap berikutnya", tone: "pass" }
              : essayFail
              ? { text: "Tidak lolos", tone: "fail" }
              : essayDone
              ? { text: waitText(1, "Menunggu"), tone: act(1) ? "active" : "wait" }
              : { text: "Selesaikan esai", tone: "wait" }
          }

        />
        <Step
          n={3}
          label="Seleksi Administrasi"
          done={admPass}
          rejected={admFail}
          active={act(2)}
          desc={isFTPremium ? "Lolos Seleksi Administrasi — otomatis oleh sistem (Fast Track Premium), lanjut ke Tes Potensi Akademik" : adminResultLabel}
          status={
            isFTPremium
              ? { text: "Lolos Seleksi Administrasi", tone: "pass" }
              : admPass
              ? { text: "Lolos ke tahap berikutnya", tone: "pass" }
              : admFail
              ? { text: "Tidak lolos", tone: "fail" }
              : hasDocs
              ? { text: waitText(2, "Menunggu"), tone: act(2) ? "active" : "wait" }
              : { text: "Kirim berkas dahulu", tone: "wait" }
          }
        />
        <Step
          n={4}
          label="Tes Potensi Akademik"
          done={tpaPass}
          rejected={tpaFail}
          active={act(3)}
          desc={
            tpaPass
              ? "Lolos tes potensi akademik"
              : tpaFail
              ? "Belum lolos tes potensi akademik"
              : act(3)
              ? "Sedang dalam tahap ini — menunggu hasil"
              : "Hasil belum diumumkan"
          }
          status={
            tpaPass
              ? { text: "Lolos ke tahap berikutnya", tone: "pass" }
              : tpaFail
              ? { text: "Tidak lolos", tone: "fail" }
              : { text: waitText(3, "Menunggu"), tone: act(3) ? "active" : "wait" }
          }
        />
        <Step
          n={5}
          label="Interview"
          done={itwPass}
          rejected={itwFail}
          active={act(4)}
          desc={
            itwPass
              ? "Lolos tahap interview"
              : itwFail
              ? "Belum lolos tahap interview"
              : act(4)
              ? "Sedang dalam tahap ini — menunggu hasil"
              : "Hasil belum diumumkan"
          }
          status={
            itwPass
              ? { text: "Lolos — tahap final", tone: "pass" }
              : itwFail
              ? { text: "Tidak lolos", tone: "fail" }
              : { text: waitText(4, "Menunggu"), tone: act(4) ? "active" : "wait" }
          }
        />
      </div>
        );
      })()}




      {/* Benefit Card - Certificate Preview & Download */}
      {certConfig.enabled && (
        <div className="mt-6 overflow-hidden rounded-2xl border-2 border-primary/20 bg-primary/5">
          <div className="p-5">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <Award size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">E-Sertifikat Resmi</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Selamat! Kamu berhak mendapatkan e-sertifikat resmi sebagai peserta Beasiswa Prestasi Kita Batch #8.
                  </p>
                  {!canDownload && certConfig.releaseDate && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                      📅 Unduhan dibuka pada: {new Date(certConfig.releaseDate).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}
                    </div>
                  )}
                </div>
              </div>
              
              {canDownload ? (
                <button
                  onClick={downloadCert}
                  disabled={downloading}
                  className="btn-block inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-all hover:opacity-95 disabled:opacity-60"
                >
                  {downloading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  Unduh PDF
                </button>
              ) : (
                <div className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-muted px-5 text-sm font-bold text-muted-foreground border-2 border-dashed border-muted-foreground/30 cursor-not-allowed">
                  <Download size={16} />
                  Unduh Belum Dibuka
                </div>
              )}
            </div>
          </div>

          {/* Mosaic Preview Container */}
          <div className="relative aspect-[1.414/1] w-full border-t border-primary/10 bg-white p-4 sm:p-8">
            <div className="absolute inset-0 flex">
              {/* Mosaic Left */}
              <div className="grid h-full w-[10%] grid-cols-2 grid-rows-[repeat(10,1fr)]">
                {[...Array(20)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`${["bg-[#1a2a47]", "bg-[#2563eb]", "bg-[#60a5fa]", "bg-[#ffd700]"][Math.floor(Math.random() * 4)]}`}
                  />
                ))}
              </div>
              <div className="flex-1" />
              {/* Mosaic Right */}
              <div className="grid h-full w-[10%] grid-cols-2 grid-rows-[repeat(10,1fr)]">
                {[...Array(20)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`${["bg-[#1a2a47]", "bg-[#2563eb]", "bg-[#60a5fa]", "bg-[#ffd700]"][Math.floor(Math.random() * 4)]}`}
                  />
                ))}
              </div>
            </div>

            {/* Preview Content */}
            <div className="relative flex h-full flex-col items-center justify-center rounded border border-[#1a2a47]/20 bg-white/80 p-4 text-center backdrop-blur-[2px]">
              <div className="mb-2 text-[10px] font-bold text-[#1a2a47] sm:text-xs">SERTIFIKAT PENGHARGAAN</div>
              <div className="mb-1 h-[1px] w-12 bg-[#ffd700]" />
              <div className="text-[8px] italic text-muted-foreground sm:text-[10px]">Diberikan kepada:</div>
              <div className="my-2 text-sm font-extrabold text-[#1a2a47] sm:text-2xl">{data.full_name.toUpperCase()}</div>
              <div className="text-[8px] text-muted-foreground sm:text-[10px]">Peserta {jenis}</div>
              <div className="mt-4 text-[6px] text-[#1a2a47]/60 sm:text-[8px]">ID: {data.token}</div>
            </div>
          </div>
        </div>
      )}

      {/* Call to Actions */}
      <div className="mt-6 flex flex-col gap-3">
        {!isFast && !essayDone && (
          <Link
            to="/esai"
            search={{ token: data.token }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition"
          >
            Lengkapi Esai Sekarang <ArrowRight size={16} />
          </Link>
        )}

        {!hasDocs && essayDone && (
          <Link
            to={berkasTo as any}
            search={{ token: data.token } as any}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition"
          >
            Kirim Berkas Sekarang <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}

function Step({
  n,
  label,
  desc,
  done,
  rejected,
  active,
  status,
}: {
  n: number;
  label: string;
  desc: string;
  done?: boolean;
  rejected?: boolean;
  active?: boolean;
  status?: { text: string; tone: "pass" | "fail" | "wait" | "active" };
}) {
  const cls = rejected
    ? "border-destructive/40 bg-destructive/5"
    : done
    ? "border-primary/40 bg-primary-soft/40"
    : active
    ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20 shadow-[0_0_0_3px_rgba(245,158,11,0.15)]"
    : "border-border bg-background";
  const numCls = rejected
    ? "bg-destructive text-destructive-foreground"
    : done
    ? "bg-primary text-primary-foreground"
    : active
    ? "bg-amber-500 text-amber-950 animate-pulse"
    : "bg-muted text-muted-foreground";
  const badgeCls =
    status?.tone === "pass"
      ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
      : status?.tone === "fail"
      ? "border-destructive/50 bg-destructive/5 text-destructive"
      : status?.tone === "active"
      ? "border-amber-500 bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
      : "border-border bg-muted text-muted-foreground";

  return (
    <div className={`flex h-full min-w-0 flex-col rounded-2xl border-2 ${cls} p-3.5`}>
      <div className="flex min-w-0 items-start gap-2">
        <div
          className={`flex h-6 w-6 shrink-0 basis-6 aspect-square items-center justify-center rounded-full text-[11px] font-bold leading-none ${numCls}`}
        >
          {rejected ? "✕" : done ? "✓" : n}
        </div>
        <div className="min-w-0 flex-1 text-[13px] font-bold leading-snug text-foreground break-words hyphens-auto">
          {label}
        </div>
      </div>
      <div className="mt-2 text-[11px] leading-snug text-muted-foreground break-words">{desc}</div>
      {status && (
        <div
          className={`mt-auto pt-3 text-[10px] font-bold leading-snug ${
            status.tone === "pass"
              ? "text-emerald-700 dark:text-emerald-300"
              : status.tone === "fail"
              ? "text-destructive"
              : "text-muted-foreground"
          }`}
        >
          <span
            className={`inline-block max-w-full rounded-lg border px-2 py-1 break-words ${badgeCls}`}
          >
            {status.text}
          </span>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div>
      <div className={`text-2xl font-extrabold ${cls}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
