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
  payment_status?: string | null;
  essay_submitted?: boolean;
  essay_submitted_at?: string | null;
  essay_status?: "pending" | "approved" | "rejected";
  essay_announcement_published?: boolean;
  essay_announcement_message?: string | null;
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
  const essayDone = isFast || !!data.essay_submitted;
  const essayStatus = isFast ? "approved" : (data.essay_status ?? "pending");
  const essayPublished = !!data.essay_announcement_published;
  const adminPublished = !!data.admin_announcement_published;
  const adminStatus = (data.candidate_status ?? "pending") as "pending" | "approved" | "rejected";
  const adminResultLabel = !hasDocs
    ? "Menunggu pengiriman berkas"
    : !adminPublished
    ? "Menunggu validasi admin"
    : adminStatus === "approved"
    ? "Lolos seleksi administrasi"
    : adminStatus === "rejected"
    ? "Belum lolos seleksi administrasi"
    : "Sedang diverifikasi";
  const essayResultLabel = isFast
    ? "Lolos otomatis (Fast Track)"
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
        </div>
        <span
          className={`rounded-full border-2 px-3 py-1 text-xs font-bold ${
            isFast
              ? "border-amber-500 bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
              : "border-border bg-muted text-muted-foreground"
          }`}
        >
          {isFast ? "⚡ Fast Track" : "Jalur Reguler"}
        </span>
      </div>

      {isFast && (
        <div className="mt-5 rounded-2xl border-2 border-amber-500 bg-amber-50 p-4 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 text-sm font-extrabold text-amber-900 dark:text-amber-200">
            <Zap size={16} /> Fast Track — Esai Otomatis Lolos
          </div>
          <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">
            Anda tidak perlu mengisi esai singkat. Silakan langsung lanjut ke tahap Berkas Administrasi.
          </p>
        </div>
      )}

      {/* Pengumuman Esai */}
      {(isFast || essayPublished) && (
        <div
          className={`mt-5 rounded-2xl border-2 p-4 ${
            essayStatus === "approved"
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
              : essayStatus === "rejected"
              ? "border-destructive/50 bg-destructive/5"
              : "border-border bg-muted/40"
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-extrabold text-foreground">
            <PenLine size={16} /> Hasil Tahap Esai
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{essayResultLabel}</p>
          {data.essay_announcement_message && (
            <p className="mt-2 text-xs text-foreground/80">{data.essay_announcement_message}</p>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="mt-6 grid gap-3 items-stretch sm:grid-cols-2 lg:grid-cols-5">
        <Step
          n={1}
          label="Pendaftaran"
          done
          desc="Data diterima"
          status={{ text: "Lolos ke tahap berikutnya", tone: "pass" }}
        />
        <Step
          n={2}
          label="Pengiriman Essai"
          done={essayDone}
          desc={isFast ? "Otomatis lolos (Fast Track)" : essayDone ? "Esai sudah dikirim" : "Belum dikirim"}
          status={
            essayDone
              ? { text: "Lolos ke tahap berikutnya", tone: "pass" }
              : { text: "Belum lolos — selesaikan esai", tone: "wait" }
          }
        />
        <Step
          n={3}
          label="Hasil Esai"
          done={isFast || (essayPublished && essayStatus === "approved")}
          rejected={!isFast && essayPublished && essayStatus === "rejected"}
          desc={essayResultLabel}
          status={
            isFast || (essayPublished && essayStatus === "approved")
              ? { text: "Lolos ke tahap berikutnya", tone: "pass" }
              : essayPublished && essayStatus === "rejected"
              ? { text: "Tidak lolos", tone: "fail" }
              : { text: "Menunggu pengumuman", tone: "wait" }
          }
        />
        <Step
          n={4}
          label="Berkas Administrasi"
          done={hasDocs}
          desc={hasDocs ? "Berkas sudah dikirim" : "Belum dikirim"}
          status={
            hasDocs
              ? { text: "Berkas lengkap terkirim", tone: "pass" }
              : { text: "Belum lolos — kirim berkas", tone: "wait" }
          }
        />
        <Step
          n={5}
          label="Seleksi Administrasi"
          done={adminPublished && adminStatus === "approved"}
          rejected={adminPublished && adminStatus === "rejected"}
          desc={adminResultLabel}
          status={
            adminPublished && adminStatus === "approved"
              ? { text: "Lolos ke tahap berikutnya", tone: "pass" }
              : adminPublished && adminStatus === "rejected"
              ? { text: "Tidak lolos", tone: "fail" }
              : { text: "Belum lolos — menunggu validasi admin", tone: "wait" }
          }
        />
      </div>



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
  status,
}: {
  n: number;
  label: string;
  desc: string;
  done?: boolean;
  rejected?: boolean;
  status?: { text: string; tone: "pass" | "fail" | "wait" };
}) {
  const cls = rejected
    ? "border-destructive/40 bg-destructive/5"
    : done
    ? "border-primary/40 bg-primary-soft/40"
    : "border-border bg-background";
  const numCls = rejected
    ? "bg-destructive text-destructive-foreground"
    : done
    ? "bg-primary text-primary-foreground"
    : "bg-muted text-muted-foreground";
  const badgeCls =
    status?.tone === "pass"
      ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
      : status?.tone === "fail"
      ? "border-destructive/50 bg-destructive/5 text-destructive"
      : "border-border bg-muted text-muted-foreground";
  return (
    <div className={`flex h-full flex-col rounded-2xl border-2 ${cls} p-4`}>
      <div className="flex items-center gap-2">
        <div
          className={`flex h-7 w-7 shrink-0 basis-7 aspect-square items-center justify-center rounded-full text-xs font-bold leading-none ${numCls}`}
        >
          {rejected ? "✕" : done ? "✓" : n}
        </div>
        <div className="text-sm font-bold text-foreground">{label}</div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{desc}</div>
      {status && (
        <div
          className={`mt-3 inline-flex w-fit rounded-full border-2 px-2.5 py-1 text-[11px] font-bold ${badgeCls}`}
        >
          {status.text}
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
