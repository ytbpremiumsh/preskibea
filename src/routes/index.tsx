import { createFileRoute, Link } from "@tanstack/react-router";
import { HeartHandshake, Trophy, Wallet, ArrowRight, CheckCircle2, Sparkles, ShieldCheck, Users, GraduationCap, Heart } from "lucide-react";
import heroImg from "@/assets/students-hero.png";
import { Countdown } from "@/components/Countdown";
import { AboutMockup } from "@/components/AboutMockup";
import { FAQSection } from "@/components/FAQSection";
import { TimelineSection } from "@/components/TimelineSection";
import { BenefitsSection } from "@/components/BenefitsSection";
import { AlumniSection } from "@/components/AlumniSection";
import { AdSlot } from "@/components/ads/AdSlot";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Beasiswa Pendidikan Prestasi Kita Batch #8" },
      { name: "description", content: "Program beasiswa nasional untuk SMP, SMA/SMK/MA, dan Mahasiswa. Total beasiswa Rp17.000.000/semester. Tidak dipungut biaya." },
      { property: "og:title", content: "Beasiswa Pendidikan Prestasi Kita Batch #8" },
      { property: "og:description", content: "Beasiswa Prestasi, Ekonomi, Umum & Yatim untuk pelajar dan mahasiswa Indonesia. Total Rp17.000.000 per semester, tanpa biaya pendaftaran." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Beasiswa Pendidikan Prestasi Kita Batch #8" },
      { name: "twitter:description", content: "Beasiswa Prestasi, Ekonomi, Umum & Yatim untuk pelajar dan mahasiswa Indonesia. Tanpa biaya pendaftaran." },
    ],
  }),
  component: Index,
});

const jenjang = ["SMP", "SMA/SMK/MA", "Mahasiswa"];

const stats = [
  { value: "Rp17jt", label: "Total beasiswa per semester" },
  { value: "4", label: "Jalur beasiswa tersedia" },
  { value: "3", label: "Jenjang pendidikan tercakup" },
  { value: "Rp0", label: "Biaya pendaftaran" },
];

const marquee = ["Beasiswa Prestasi", "Beasiswa Ekonomi", "Beasiswa Umum", "Beasiswa Yatim", "Tanpa Biaya", "Seluruh Indonesia", "Sertifikat Resmi", "Merchandise", "Akses Magang"];

function Index() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="container-page py-12 md:py-20 grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground/75 shadow-card">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
              Prestasi Kita 2026 · Batch #8
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.65rem] font-extrabold leading-[1.03] tracking-tight text-foreground">
              Raih beasiswa
              <span className="relative mt-1 block w-fit text-primary">
                Prestasi Kita
                <svg aria-hidden="true" viewBox="0 0 300 12" preserveAspectRatio="none" className="absolute -bottom-1.5 left-0 h-2.5 w-full text-[var(--gold)]">
                  <path d="M3 8 Q 75 2, 150 6 T 297 5" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </span>
              <span className="text-muted-foreground/80"> Batch #8</span>
            </h1>

            <p className="max-w-xl text-base md:text-lg text-muted-foreground">
              Program beasiswa pendidikan nasional untuk pelajar dan mahasiswa Indonesia —
              jalur Prestasi, Ekonomi, Umum, dan Yatim, tanpa minimal nilai, tanpa biaya pendaftaran.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/daftar"
                className="btn-block group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground"
              >
                Daftar sekarang
                <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/beasiswa-prestasi"
                className="btn-block inline-flex items-center justify-center gap-2 rounded-full bg-card px-7 py-3.5 text-sm font-bold text-foreground hover:text-primary"
              >
                Lihat persyaratan
              </Link>
            </div>

            <p className="text-xs text-muted-foreground">
              Gratis 100% · tanpa pungutan biaya · seleksi transparan
            </p>

            <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-4 py-3">
              <ShieldCheck size={16} className="text-primary" />
              <span className="text-xs font-semibold text-foreground/80">Terbuka untuk</span>
              {jenjang.map((j) => (
                <span key={j} className="rounded-full bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground/75 shadow-card">
                  {j}
                </span>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="card-block relative p-5">
              <div className="flex items-center gap-1.5 pb-4">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--gold)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-primary/40" />
                <span className="ml-3 text-[11px] font-semibold text-muted-foreground">Beasiswa Prestasi Kita · Batch #8</span>
              </div>
              <div className="overflow-hidden rounded-3xl bg-secondary/50">
                <img
                  src={heroImg}
                  alt="Ilustrasi pelajar Indonesia penerima Beasiswa Prestasi Kita"
                  width={1024}
                  height={1024}
                  className="mx-auto w-full max-w-md"
                  fetchPriority="high"
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <MiniStat icon={<Wallet size={15} />} value="Rp17.000.000" label="per semester" highlight />
                <MiniStat icon={<GraduationCap size={15} />} value="SMP – Mahasiswa" label="semua jenjang" />
              </div>
            </div>

            <div className="card-block absolute -left-4 bottom-24 hidden px-4 py-3 xl:block">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Users size={14} className="text-primary" /> Se-Indonesia
              </div>
            </div>

          </div>
        </div>

        {/* STAT STRIP */}
        <div className="container-page pb-14">
          <div className="card-block grid grid-cols-2 gap-4 px-6 py-7 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-extrabold text-primary">{s.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARQUEE BAND */}
      <div className="overflow-hidden border-y border-primary/20 py-3.5 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap">
          {[...marquee, ...marquee, ...marquee, ...marquee].map((m, i) => (
            <span key={i} className="flex items-center gap-8 text-xs font-bold uppercase tracking-[0.18em]">
              {m}
              <Sparkles size={13} className="text-[var(--gold)]" />
            </span>
          ))}
        </div>
      </div>

      <AdSlot placement="after_hero" />

      {/* COUNTDOWN */}
      <section className="container-page pt-16 pb-4">
        <Countdown />
      </section>

      {/* KATEGORI */}
      <section className="container-page py-16">
        <SectionHeader
          eyebrow="Kategori Beasiswa"
          title="Prestasi, Ekonomi, Umum, atau Yatim?"
          desc="Satu program, empat jalur beasiswa. Pilih yang paling sesuai dengan kondisimu."
        />

        <div className="mt-12 flex justify-center">
          <Link
            to="/daftar"
            className="btn-block group inline-flex items-center justify-center gap-3 rounded-2xl bg-primary px-10 py-5 text-lg font-extrabold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Daftar Sekarang
            <ArrowRight size={22} className="transition group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <AdSlot placement="after_categories" />

      <AboutMockup />

      <BenefitsSection />

      <AdSlot placement="after_benefits" />

      <AlumniSection />

      <AdSlot placement="after_alumni" />

      <TimelineSection />

      <FAQSection />

      <AdSlot placement="after_faq" />
    </>
  );
}

function MiniStat({ icon, value, label, highlight }: { icon: React.ReactNode; value: string; label: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border-2 border-ink p-3.5 ${highlight ? "bg-primary text-primary-foreground" : "bg-card text-foreground"}`}>
      <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
        {icon} {label}
      </div>
      <div className="mt-1 text-sm font-extrabold">{value}</div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground/75 shadow-card">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" /> {eyebrow}
      </span>
      <h2 className="mt-4 text-3xl md:text-4xl font-extrabold text-foreground">{title}</h2>
      <p className="mt-3 text-muted-foreground">{desc}</p>
    </div>
  );
}

function CategoryCard({ tag, icon, title, desc, to, variant }: { tag: string; icon: React.ReactNode; title: string; desc: string; to: "/beasiswa-prestasi" | "/beasiswa-ekonomi" | "/beasiswa-umum" | "/beasiswa-yatim"; variant?: "dark" }) {
  const isDark = variant === "dark";
  return (
    <div
      className={`group relative overflow-hidden p-8 ${isDark ? "card-block-dark" : "card-block"}`}
    >
      <div className={`absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl ${isDark ? "bg-[var(--gold)]/25" : "bg-primary/10"}`} />
      <div className="relative">
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${isDark ? "bg-[var(--gold)] text-gold-foreground" : "bg-primary-soft text-primary"}`}>
          {icon}
        </div>
        <span className={`mt-5 inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${isDark ? "bg-[var(--gold)] text-gold-foreground" : "bg-primary-soft text-primary"}`}>
          {tag}
        </span>
        <h3 className="mt-3 text-xl md:text-2xl font-bold">{title}</h3>
        <p className={`mt-3 text-sm ${isDark ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{desc}</p>

        <ul className={`mt-5 space-y-2 text-sm ${isDark ? "text-primary-foreground/90" : "text-foreground/80"}`}>
          {["Terbuka untuk SMP, SMA/SMK/MA, & Mahasiswa", "Tanpa minimal nilai rapor / IPK", "Tidak dipungut biaya"].map((x) => (
            <li key={x} className="flex items-start gap-2">
              <CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${isDark ? "text-[var(--gold)]" : "text-primary"}`} /> {x}
            </li>
          ))}
        </ul>

        <Link
          to={to}
          className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition hover:opacity-95 ${
            isDark ? "bg-[var(--gold)] text-gold-foreground" : "bg-primary text-primary-foreground"
          }`}
        >
          Lihat detail <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
