import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap, Clock, ArrowRight, CheckCircle2, FileText, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { scholarshipDetails, scholarshipRequirements } from "@/lib/scholarship-requirements";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  kind: z.enum(["prestasi", "ekonomi", "umum", "yatim"]).default("prestasi"),
});

export const Route = createFileRoute("/pendaftaran/pilih-tipe")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Pilih Tipe Pendaftaran — Prestasi Kita" },
      { name: "description", content: "Pilih tipe pendaftaran Reguler atau Fast Track untuk melanjutkan." },
    ],
  }),
  component: PilihTipePage,
});

function PilihTipePage() {
  const { kind } = Route.useSearch();
  const [fastTrackFee, setFastTrackFee] = useState<number>(15000);
  const [fastTrackPremiumFee, setFastTrackPremiumFee] = useState<number>(35000);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["fast_track_fee", "fast_track_premium_fee"])
      .then(({ data }) => {
        if (!data) return;
        const fee = data.find(s => s.key === "fast_track_fee")?.value;
        if (fee) setFastTrackFee(Number(fee));
        const premiumFee = data.find(s => s.key === "fast_track_premium_fee")?.value;
        if (premiumFee) setFastTrackPremiumFee(Number(premiumFee));
      });
  }, []);

  const kindLabel = 
    kind === "prestasi" ? "Prestasi" : 
    kind === "ekonomi" ? "Ekonomi" : 
    kind === "umum" ? "Umum" : "Yatim";

  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="container-page py-16 md:py-20 text-center">
          <Link to="/daftar" className="text-xs font-semibold text-primary hover:underline">
            ← Kembali pilih kategori
          </Link>
          <div className="mt-6 max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-foreground">
              Pilih Tipe Pendaftaran
            </h1>
            <p className="mt-4 text-muted-foreground text-lg">
              Kategori yang dipilih: Beasiswa {kindLabel}. Pilih jalur pendaftaran yang sesuai dengan keinginanmu.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-12 -mt-8 md:-mt-12 relative z-10">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 md:gap-8 max-w-7xl mx-auto">
          {/* Reguler Card */}
          <div className="card-block group flex flex-col p-8 transition-all hover:shadow-xl border-t-4 border-primary/20">
            <div className="h-14 w-14 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mb-6">
              <Clock size={32} />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Pendaftaran Reguler</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Jalur pendaftaran standar tanpa biaya. Peserta wajib mengikuti seluruh tahapan seleksi dan syarat media sosial.
            </p>
            
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <CheckCircle2 size={18} className="text-primary shrink-0" />
                <span>Wajib Follow Instagram & TikTok</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <CheckCircle2 size={18} className="text-primary shrink-0" />
                <span>Wajib Share Poster ke 5 Grup WA</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <CheckCircle2 size={18} className="text-primary shrink-0" />
                <span>Wajib Tag 5 Teman di Komentar</span>
              </li>
            </ul>

            <div className="mb-6 p-4 rounded-2xl bg-secondary/50 border border-border text-center">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Biaya Pendaftaran</span>
              <span className="text-2xl font-black text-primary">GRATIS</span>
            </div>

            <Link
              to={`/pendaftaran/${kind}`}
              search={{ type: "reguler", ft_type: "standard" } as any}
              className="btn-block inline-flex w-full items-center justify-center gap-2 rounded-full bg-card border-2 border-primary/20 px-6 py-4 text-base font-bold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group"
            >
              Pilih Reguler <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Fast Track Card */}
          <div className="card-block group flex flex-col p-8 transition-all hover:shadow-xl border-t-8 border-[var(--gold)] relative overflow-hidden bg-white">
            <div className="absolute top-0 right-0 bg-[var(--gold)] text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest shadow-sm">
              Rekomendasi
            </div>
            
            <div className="h-14 w-14 rounded-2xl bg-[var(--gold)]/10 text-[var(--gold)] flex items-center justify-center mb-6">
              <Zap size={32} />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Fast Track</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Dapatkan kemudahan pendaftaran tanpa syarat media sosial dan berbagai benefit eksklusif Batch #8.
            </p>
            
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <CheckCircle2 size={18} className="text-[var(--gold)] shrink-0" />
                <span className="font-semibold">Berkesempatan Meraih Dana Pendidikan Beasiswa</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <CheckCircle2 size={18} className="text-[var(--gold)] shrink-0" />
                <span className="font-semibold">Bebas Syarat Media Sosial & Share Poster</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <CheckCircle2 size={18} className="text-[var(--gold)] shrink-0" />
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--gold)]/15 border border-[var(--gold)]/40 px-2 py-1 animate-blink-gold">
                  <span className="text-xs font-bold text-foreground leading-none">Lolos Pengiriman Esai</span>
                  <span className="inline-flex h-4 shrink-0 items-center rounded-full bg-[var(--gold)] px-1.5 text-[9px] font-extrabold uppercase tracking-wide text-white leading-none">Populer</span>
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <CheckCircle2 size={18} className="text-[var(--gold)] shrink-0" />
                <span><strong className="font-bold text-foreground">Sertifikat</strong> Partisipan Nasional</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <CheckCircle2 size={18} className="text-[var(--gold)] shrink-0" />
                <span><strong className="font-bold text-foreground">Template</strong>&nbsp;E-Sheet Habit Tracker&nbsp;</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <CheckCircle2 size={18} className="text-[var(--gold)] shrink-0" />
                <span className="inline-block rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 leading-relaxed text-amber-950"><strong className="font-bold">E-Book</strong> Menjemput Beasiswa Impian ke Kampus Dunia Senilai <strong className="font-bold">Rp 79.000,-</strong> <span className="inline-flex rounded-full bg-amber-600 px-2 py-0.5 align-middle text-[10px] font-bold uppercase leading-none text-white">Benefit</span></span>
              </li>
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <CheckCircle2 size={18} className="text-[var(--gold)] shrink-0" />
                <span><strong className="font-bold text-foreground">Group</strong> List Beasiswa 2026</span>
              </li>
            </ul>

            <div className="mb-6 p-4 rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 text-center">
              <span className="text-xs font-bold text-[var(--gold-foreground)] uppercase tracking-wider block mb-1">BIAYA FAST TRACK</span>
              <span className="text-2xl font-black text-[var(--gold-foreground)]">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(fastTrackFee)}
              </span>
            </div>

            <Link
              to={`/pendaftaran/${kind}`}
              search={{ type: "fast_track", ft_type: "standard" } as any}
              className="btn-block inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-bold shadow-lg hover:shadow-[var(--gold)]/30 hover:-translate-y-0.5 transition-all group"
              style={{ background: "var(--gold)", color: "var(--gold-foreground)" }}
            >
              Pilih Fast Track <Zap size={18} className="fill-current transition-transform group-hover:scale-110" />
            </Link>
          </div>

          {/* Fast Track Premium Card */}
          <div className="card-block group flex flex-col p-8 transition-all hover:shadow-xl border-t-8 border-emerald-500 relative overflow-hidden bg-white">
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest shadow-sm">
              Premium
            </div>

            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-6">
              <Zap size={32} className="fill-current" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Fast Track Premium</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Benefit maksimal dengan jaminan lolos administrasi berkas untuk percepatan seleksi.
            </p>
            
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <span className="font-semibold">Berkesempatan Meraih Dana Pendidikan Beasiswa</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <span className="font-semibold">Bebas Syarat Media Sosial & Share Poster</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 px-2 py-1 animate-pulse">
                  <span className="text-xs font-bold text-emerald-700 leading-none">Lolos Pengiriman Esai</span>
                  <Badge className="bg-emerald-500 text-white text-[9px] h-4 leading-none shrink-0 px-1.5">Auto</Badge>
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 px-2 py-1 animate-pulse">
                  <span className="text-xs font-bold text-emerald-700 leading-none">Lolos Administrasi Berkas</span>
                  <Badge className="bg-emerald-500 text-white text-[9px] h-4 leading-none shrink-0 px-1.5">Auto</Badge>
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 px-2 py-1 animate-pulse">
                  <span className="text-xs font-bold text-emerald-700 leading-none">Ikut Tes Potensi Akademik (CBT)</span>
                  <Badge className="bg-emerald-500 text-white text-[9px] h-4 leading-none shrink-0 px-1.5">Auto</Badge>
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <span><strong className="font-bold text-foreground">Sertifikat</strong> Partisipan Nasional</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <span><strong className="font-bold text-foreground">Template</strong>&nbsp;E-Sheet Habit Tracker&nbsp;</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <span className="inline-block rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 leading-relaxed text-emerald-950"><strong className="font-bold">E-Book</strong> Menjemput Beasiswa Impian ke Kampus Dunia Senilai <strong className="font-bold">Rp 79.000,-</strong> <span className="inline-flex rounded-full bg-emerald-600 px-2 py-0.5 align-middle text-[10px] font-bold uppercase leading-none text-white">Benefit</span></span>
              </li>
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <span><strong className="font-bold text-foreground">Group</strong> List Beasiswa 2026</span>
              </li>
            </ul>

            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">BIAYA FAST TRACK PREMIUM</span>
              <span className="text-2xl font-black text-emerald-700">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(fastTrackPremiumFee)}
              </span>
            </div>

            <div className="relative pt-3">
              <span className="absolute -top-1 right-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-emerald-800 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-sm motion-safe:animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-white" /> Terbatas
              </span>
            <Link
              to={`/pendaftaran/${kind}`}
              search={{ type: "fast_track", ft_type: "premium" } as any}
              className="btn-block inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-bold shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all group bg-emerald-500 text-white"
            >
              <span>Pilih Premium</span> <Zap size={18} className="shrink-0 fill-current transition-transform group-hover:scale-110" />
            </Link>
            </div>
          </div>
        </div>

        <Dialog>
          <div className="card-block mx-auto mt-8 flex max-w-7xl flex-col gap-5 border border-primary/15 bg-primary-soft/30 p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary"><FileText size={22} /></div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Persyaratan Beasiswa {kindLabel}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Pastikan kamu memenuhi persyaratan sebelum melanjutkan pendaftaran.</p>
              </div>
            </div>
            <DialogTrigger asChild>
              <button type="button" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-primary/25 bg-card px-5 py-3 text-sm font-bold text-primary transition hover:bg-primary hover:text-primary-foreground">
                Lihat persyaratan <ArrowRight size={16} />
              </button>
            </DialogTrigger>
          </div>
          <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl p-6 sm:p-8">
            <DialogHeader>
              <DialogTitle className="pr-8 text-xl font-bold leading-tight">Persyaratan Beasiswa {kindLabel}</DialogTitle>
              <DialogDescription className="pt-1 leading-relaxed">{scholarshipDetails[kind].description}</DialogDescription>
            </DialogHeader>
            <div className="mt-2">
              <h3 className="font-bold text-foreground">Persyaratan peserta</h3>
              <ul className="mt-3 space-y-2.5">
                {scholarshipRequirements.map((requirement) => (
                  <li key={requirement} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/90">
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-primary" />
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-secondary/60 p-4">
              <h3 className="flex items-center gap-2 font-bold text-foreground"><BookOpen size={17} className="text-primary" /> Tips persiapan dokumen</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Siapkan dokumen pendukung seperti {scholarshipDetails[kind].documents}</p>
            </div>
            <Link to={`/beasiswa-${kind}`} className="inline-flex w-fit items-center gap-2 text-sm font-bold text-primary hover:underline">
              Lihat informasi lengkap <ArrowRight size={15} />
            </Link>
          </DialogContent>
        </Dialog>
      </section>
    </main>
  );
}
