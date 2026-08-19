import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight, Heart, FileUp, KeyRound, Copy, Check, Share2, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";


type Search = {
  name?: string;
  email?: string;
  whatsapp?: string;
  kind?: "prestasi" | "ekonomi" | "umum" | "yatim";
  token?: string;
};

export const Route = createFileRoute("/pendaftaran/sukses")({
  head: () => ({
    meta: [
      { title: "Pendaftaran Berhasil — Beasiswa Prestasi Emas" },
      { name: "description", content: "Pendaftaran beasiswa berhasil dikirim. Simpan kode pendaftar Anda dan lanjutkan dengan mengirim berkas pendukung." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    name: typeof s.name === "string" ? s.name : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
    whatsapp: typeof s.whatsapp === "string" ? s.whatsapp : undefined,
    kind: s.kind === "prestasi" || s.kind === "ekonomi" || s.kind === "umum" || s.kind === "yatim" ? s.kind : undefined,
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  component: SuksesPage,
});

function SuksesPage() {
  const { name, email, whatsapp, kind, token } = useSearch({ from: "/pendaftaran/sukses" });
  const [fastTrackPayUrl, setFastTrackPayUrl] = useState<string | null>(null);
  const [isFastTrack, setIsFastTrack] = useState(false);

  useEffect(() => {
    if (token && token.includes("-") && (token.startsWith("PK-") || token.startsWith("KP-"))) {
      // Check if this is a fast track registration needing payment
      import("@/integrations/supabase/client").then(({ supabase }) => {
        supabase
          .from("registrations")
          .select("fast_track, payment_status, payment_url")
          .eq("token", token)
          .maybeSingle()
          .then(({ data }) => {
            setIsFastTrack(Boolean(data?.fast_track));
            if (data?.fast_track && data?.payment_status === "pending" && data?.payment_url) {
              setFastTrackPayUrl(data.payment_url);
            }
          });
      });
    }
  }, [token]);
  const berkasTo = kind === "ekonomi" ? "/berkas/ekonomi/upload" : kind === "umum" ? "/berkas/umum/upload" : kind === "yatim" ? "/berkas/yatim/upload" : "/berkas/prestasi/upload";
  const jenis = kind === "ekonomi" ? "Beasiswa Ekonomi" : kind === "prestasi" ? "Beasiswa Prestasi" : kind === "umum" ? "Beasiswa Umum" : kind === "yatim" ? "Beasiswa Yatim" : "Beasiswa";
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      toast.success("Kode disalin");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin");
    }
  };

  return (
    <main className="container-page py-12 md:py-16">
      <div className="mx-auto max-w-2xl">
        {/* HERO sukses */}
        <div className="text-center">
          <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft text-primary shadow-soft">
            <CheckCircle2 size={44} />
          </div>
          <h1 className="mt-6 text-3xl md:text-4xl font-extrabold text-foreground">
            Pendaftaran Berhasil!
          </h1>
          <p className="mt-3 text-muted-foreground">
            {name ? `Halo ${name}, p` : "P"}endaftaran {jenis} kamu sudah kami terima.
          </p>
        </div>

        {/* KODE PENDAFTAR */}
        {token && (
          <div className="mt-8 rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-primary-soft/60 to-primary-soft/20 p-6 md:p-7 shadow-card">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <KeyRound size={14} /> Kode Pendaftar Anda
            </div>
            <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 min-w-0 rounded-xl bg-card border-2 border-dashed border-primary/40 px-3 py-3 sm:px-4 sm:py-4 font-mono text-lg sm:text-2xl md:text-3xl font-extrabold tracking-[0.1em] sm:tracking-[0.2em] text-foreground text-center select-all break-all leading-tight">
                {token}
              </div>
              <button
                type="button"
                onClick={copy}
                className="inline-flex h-11 sm:h-12 w-full sm:w-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition text-sm font-semibold"
                aria-label="Salin kode"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                <span className="sm:hidden">{copied ? "Tersalin" : "Salin Kode"}</span>
              </button>
            </div>
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-200">
              ⚠️ <span className="font-semibold">Simpan kode ini baik-baik.</span> Kode wajib dimasukkan saat <strong>kirim berkas</strong> dan <strong>cek status</strong> pendaftaran. Kode juga sudah kami kirim via WhatsApp.
            </div>
          </div>
        )}

        {/* Status Fast Track — hanya tampil untuk pendaftar Fast Track */}
        {!isFastTrack ? null : fastTrackPayUrl ? (
          <div className="mt-6 rounded-3xl border-2 border-primary bg-primary-soft/30 p-6 md:p-7 shadow-card animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <CreditCard size={20} />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold uppercase tracking-wide text-primary">Pembayaran Fast Track</div>
                <h2 className="mt-0.5 text-lg font-extrabold text-foreground">Selesaikan Pembayaran</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Kamu memilih jalur <strong>Fast Track</strong>. Silakan selesaikan pembayaran agar status pendaftaran otomatis valid (Lolos Kirim Poster & Bebas Follow Sosmed).
                </p>
              </div>
            </div>
            <a
              href={fastTrackPayUrl}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition"
            >
              Bayar Sekarang <ArrowRight size={16} />
            </a>
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border-2 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-6 md:p-7 shadow-card animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                <CheckCircle2 size={20} />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Jalur Fast Track Aktif</div>
                <h2 className="mt-0.5 text-lg font-extrabold text-foreground">Otomatis Lolos Tahapan</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Selamat! Karena kamu menggunakan jalur <strong>Fast Track</strong>, kamu <strong>otomatis lolos</strong> tanpa perlu membagikan poster, follow sosial media, atau mengirim esai.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <Check size={10} /> BEBAS POSTER
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <Check size={10} /> BEBAS FOLLOW
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <Check size={10} /> BEBAS ESAI
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Langkah Lanjutan (Hanya untuk Reguler atau yang belum bayar) */}
        {!(isFastTrack && !fastTrackPayUrl) && (
          <>
            {/* Langkah 2: Bagikan Poster */}
            <div className="mt-6 rounded-3xl border-2 border-primary/30 bg-card p-6 md:p-7 shadow-card">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Share2 size={20} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold uppercase tracking-wide text-primary">Langkah 2 dari 3</div>
                  <h2 className="mt-0.5 text-lg font-extrabold text-foreground">Bagikan Poster Beasiswa</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sebelum kirim berkas, bantu sebarkan informasi beasiswa ini dengan membagikan poster ke media sosial atau grup WhatsApp.
                  </p>
                </div>
              </div>
              <Link
                to="/bagikan-poster"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition"
              >
                Bagikan Poster Sekarang <ArrowRight size={16} />
              </Link>
            </div>

            {/* Langkah 3: Kirim Berkas */}
            <div className="card-block mt-6 p-6 md:p-7">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                  <FileUp size={20} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Langkah 3 dari 3</div>
                  <h2 className="mt-0.5 text-lg font-extrabold text-foreground">Kirim Berkas Pendukung</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Siapkan dokumen sesuai persyaratan, lalu masukkan kode pendaftar untuk melengkapi pendaftaran.
                  </p>
                </div>
              </div>
              <Link
                to={berkasTo as any}
                search={{ token } as any}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition"
              >
                Kirim Berkas <ArrowRight size={16} />
              </Link>
            </div>
          </>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Link
            to="/cek-status"
            search={{ token } as any}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition"
          >
            Cek Status Pendaftaran
          </Link>
        </div>

      </div>
    </main>
  );
}
