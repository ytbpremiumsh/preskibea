import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
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
          <Link to={`/beasiswa-${kind}`} className="text-xs font-semibold text-primary hover:underline">
            ← Kembali ke Informasi Jalur
          </Link>
          <div className="mt-6 max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-foreground">
              Pilih Tipe Pendaftaran
            </h1>
            <p className="mt-4 text-muted-foreground text-lg">
              Jalur Beasiswa {kindLabel}. Pilih tipe pendaftaran yang sesuai dengan keinginanmu.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-12 -mt-8 md:-mt-12 relative z-10">
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
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
            <h2 className="text-2xl font-bold text-foreground mb-3">Jalur Fast Track</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Dapatkan kemudahan pendaftaran tanpa syarat media sosial dan berbagai benefit eksklusif Batch #8.
            </p>
            
            <ul className="space-y-3 mb-8">
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
                <span className="inline-flex items-center gap-2 rounded-xl bg-[var(--gold)]/15 border border-[var(--gold)]/40 px-3 py-1.5 animate-blink-gold">
                  <span className="font-bold text-foreground">Lolos Pengiriman Administrasi Esai</span>
                  <span className="inline-flex h-5 items-center rounded-full bg-[var(--gold)] px-2 text-[10px] font-extrabold uppercase tracking-wider text-white">Populer</span>
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
                <span><strong className="font-bold text-foreground">E-Book</strong> Menjemput Beasiswa Impian ke Kampus Dunia Senilai <strong className="font-bold text-foreground">Rp 79.000,-</strong></span>
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
            <h2 className="text-2xl font-bold text-foreground mb-3">Fast Track Premium</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Benefit maksimal dengan jaminan lolos administrasi berkas untuk percepatan seleksi.
            </p>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 px-3 py-1.5 animate-pulse">
                  <span className="font-bold text-emerald-700">Lolos Administrasi Berkas</span>
                  <Badge className="bg-emerald-500 text-white text-[10px]">Auto</Badge>
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <span className="font-bold text-foreground">Lolos Pengiriman Administrasi Esai</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <span>Bebas Syarat Media Sosial & Share Poster</span>
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
                <span><strong className="font-bold text-foreground">E-Book</strong> Menjemput Beasiswa Impian ke Kampus Dunia</span>
              </li>
            </ul>

            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">BIAYA FAST TRACK PREMIUM</span>
              <span className="text-2xl font-black text-emerald-700">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(fastTrackPremiumFee)}
              </span>
            </div>

            <Link
              to={`/pendaftaran/${kind}`}
              search={{ type: "fast_track", ft_type: "premium" } as any}
              className="btn-block inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-bold shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all group bg-emerald-500 text-white"
            >
              Pilih Premium <Zap size={18} className="fill-current transition-transform group-hover:scale-110" />
            </Link>
          </div>
        </div>
        
        <div className="mt-12 text-center max-w-2xl mx-auto">
          <p className="text-xs text-muted-foreground leading-relaxed">
            *Seluruh dana yang terkumpul melalui Jalur Fast Track akan digunakan untuk pengembangan program beasiswa Prestasi Kita dan operasional bantuan pendidikan bagi yang membutuhkan.
          </p>
        </div>
      </section>
    </main>
  );
}
