import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight, Heart, FileUp, KeyRound, Copy, Check, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DonationCard } from "@/components/DonationCard";

type Search = {
  name?: string;
  email?: string;
  whatsapp?: string;
  kind?: "prestasi" | "ekonomi" | "umum";
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
    kind: s.kind === "prestasi" || s.kind === "ekonomi" || s.kind === "umum" ? s.kind : undefined,
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  component: SuksesPage,
});

function SuksesPage() {
  const { name, email, whatsapp, kind, token } = useSearch({ from: "/pendaftaran/sukses" });
  const berkasTo = kind === "ekonomi" ? "/berkas/ekonomi/upload" : kind === "umum" ? "/berkas/umum/upload" : "/berkas/prestasi/upload";
  const jenis = kind === "ekonomi" ? "Beasiswa Ekonomi" : kind === "prestasi" ? "Beasiswa Prestasi" : kind === "umum" ? "Beasiswa Umum" : "Beasiswa";
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
                Sebelum kirim berkas, bantu sebarkan informasi beasiswa ini dengan membagikan poster ke media sosial atau grup WhatsApp. Lalu kirim bukti share via WhatsApp admin.
              </p>
            </div>
          </div>
          <Link
            to={kind === "ekonomi" ? "/bagikan-poster/ekonomi" : kind === "umum" ? "/bagikan-poster/umum" : "/bagikan-poster/prestasi"}
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
                Setelah membagikan poster, lanjutkan dengan mengirim berkas. Siapkan dokumen sesuai persyaratan, lalu masukkan kode pendaftar.
              </p>
            </div>
          </div>
          <Link
            to={berkasTo as "/berkas/prestasi/upload" | "/berkas/ekonomi/upload" | "/berkas/umum/upload"}
            search={token ? { token } : undefined}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition"
          >
            Kirim Berkas <ArrowRight size={16} />
          </Link>
          <Link
            to="/cek-status"
            search={token ? { token } : undefined}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition"
          >
            Cek Status Pendaftaran
          </Link>
        </div>

        {/* Pemisah + soft-sell donasi */}
        <div className="mt-10 mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            <Heart size={12} className="fill-current" /> Sambil Menunggu
          </div>
          <div className="h-px flex-1 bg-border" />
        </div>
        <p className="text-center text-sm text-muted-foreground mb-4">
          Program ini gratis untuk peserta. Kalau kamu merasa terbantu dan ingin ikut menjaga program ini tetap berjalan untuk pelajar lain, kamu bisa berdonasi sukarela di bawah 👇
        </p>

        <DonationCard
          defaultName={name ?? ""}
          defaultEmail={email ?? ""}
          defaultWhatsapp={whatsapp ?? ""}
        />
      </div>
    </main>
  );
}
