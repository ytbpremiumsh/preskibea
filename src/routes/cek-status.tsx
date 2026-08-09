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
  education_level?: string | null;
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

      {/* Timeline */}
      <div className="mt-6 grid sm:grid-cols-3 gap-3">
        <Step n={1} label="Pendaftaran" done desc="Data diterima" />
        <Step
          n={2}
          label="Pengiriman Essai"
          done={essayDone}
          desc={isFast ? "Otomatis lolos (Fast Track)" : essayDone ? "Esai sudah dikirim" : "Belum dikirim"}
        />
        <Step
          n={3}
          label="Berkas Pendukung"
          done={hasDocs}
          desc={hasDocs ? `${data.docs.total} berkas masuk` : "Belum dikirim"}
        />
      </div>



      {/* Benefit Card - Certificate */}
      {certEnabled && (
        <div className="mt-6 rounded-2xl border-2 border-primary/20 bg-primary/5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Award size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">E-Sertifikat Resmi</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Selamat! Kamu berhak mendapatkan e-sertifikat resmi sebagai peserta Beasiswa Prestasi Kita Batch #8.
                </p>
              </div>
            </div>
            <button
              onClick={downloadCert}
              disabled={downloading}
              className="btn-block inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-all hover:opacity-95 disabled:opacity-60"
            >
              {downloading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              Unduh PDF
            </button>
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

function Step({ n, label, desc, done, rejected }: { n: number; label: string; desc: string; done?: boolean; rejected?: boolean }) {
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
  return (
    <div className={`rounded-2xl border-2 ${cls} p-4`}>
      <div className="flex items-center gap-2">
        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${numCls}`}>
          {rejected ? "✕" : done ? "✓" : n}
        </div>
        <div className="text-sm font-bold text-foreground">{label}</div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{desc}</div>
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
