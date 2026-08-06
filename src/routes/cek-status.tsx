import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Loader2, AlertCircle, FileText, ArrowRight } from "lucide-react";
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
                  placeholder="PK-PRE-XXXXXX atau PK-EKO-XXXXXX"
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

  return (
    <div className="card-block mt-6 p-6 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Pendaftar</div>
          <div className="mt-1 text-xl font-extrabold text-foreground">{data.full_name}</div>
          <div className="mt-1 text-sm text-muted-foreground">{jenis} · Kode: <span className="font-mono font-semibold text-foreground">{data.token}</span></div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        <Step
          n={1}
          label="Pendaftaran"
          done
          desc="Data diterima"
        />
        <Step
          n={2}
          label="Berkas Pendukung"
          done={hasDocs}
          desc={hasDocs ? `${data.docs.total} berkas masuk` : "Belum dikirim"}
        />
      </div>

      {/* Berkas detail */}
      <div className="mt-6 rounded-2xl border border-border bg-background p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <FileText size={16} className="text-primary" /> Detail Berkas
        </div>
        {hasDocs ? (
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <Stat label="Diproses" value={data.docs.pending} cls="text-amber-600 dark:text-amber-400" />
            <Stat label="Disetujui" value={data.docs.approved} cls="text-green-600 dark:text-green-400" />
            <Stat label="Ditolak" value={data.docs.rejected} cls="text-destructive" />
          </div>
        ) : (
          <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-200">
            ⚠️ Anda belum mengirim berkas pendukung. Pendaftaran belum lengkap.
          </div>
        )}
      </div>

      {!hasDocs && (
        <Link
          to={berkasTo as "/berkas/prestasi/upload" | "/berkas/ekonomi/upload" | "/berkas/umum/upload" | "/berkas/yatim/upload"}
          search={{ token: data.token }}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition"
        >
          Kirim Berkas Sekarang <ArrowRight size={16} />
        </Link>
      )}
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
