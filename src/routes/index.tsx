/**
 * apakah semua settingan doku sudah benar mulai dari doku client id dan doku secret key? apakah masih ada kekeliruan
 *
 * jawab dengan bahas aindonesia
 *
 * IMPORTANTE: Execute TODOS os detalhes desta tarefa dengan máxima precisão. Tidak ignore nada, tidak simplifique, implemente EXATAMENTE o que foi pedido.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { HeartHandshake, Trophy, Wallet, ArrowRight, CheckCircle2, Sparkles, ShieldCheck, Users, GraduationCap, Heart } from "lucide-react";
import heroDefault from "@/assets/students-hero.png";
import posterDefault from "@/assets/poster-beasiswa.png";
import benefitDefault from "@/assets/benefit-prestasi-kita.png.asset.json";
import { Countdown } from "@/components/Countdown";
import { AboutMockup } from "@/components/AboutMockup";
import { FAQSection } from "@/components/FAQSection";
import { TimelineSection } from "@/components/TimelineSection";
import { BenefitsSection } from "@/components/BenefitsSection";
import { AlumniSection } from "@/components/AlumniSection";
import { AdSlot } from "@/components/ads/AdSlot";
import { RawHtmlWidget } from "@/components/ads/RawHtmlWidget";
import { useBranding } from "@/hooks/use-branding";

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
];

const marquee = ["Beasiswa Prestasi", "Beasiswa Ekonomi", "Beasiswa Umum", "Beasiswa Yatim", "Tanpa Biaya", "Seluruh Indonesia", "Sertifikat Resmi", "Merchandise", "Akses Magang"];

function Index() {
  const { heroImage, posterImage, benefitImage, homeWidgets } = useBranding();
  const heroImg = heroImage && heroImage.startsWith('http') ? heroImage : heroDefault;
  const posterImg = posterImage && posterImage.startsWith('http') ? posterImage : posterDefault;
  const benefitImg = benefitImage && benefitImage.startsWith('http') ? benefitImage : benefitDefault.url;

  return (
    <div className="animate-in fade-in duration-500">
      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="container-page py-12 md:py-20 grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground/75 shadow-card">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
              Prestasi Kita 2026 · Batch #8
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.65rem] font-extrabold leading-[1.03] tracking-tight text-foreground flex flex-col items-center lg:items-start">
              Raih beasiswa
              <span className="relative mt-1 block w-fit text-primary mx-auto lg:mx-0">
                Prestasi Kita
                <svg aria-hidden="true" viewBox="0 0 300 12" preserveAspectRatio="none" className="absolute -bottom-1.5 left-0 h-2.5 w-full text-[var(--gold)]">
                  <path d="M3 8 Q 75 2, 150 6 T 297 5" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </span>
              <span className="text-muted-foreground/80"> Batch #8</span>
            </h1>

            <p className="max-w-xl text-base md:text-lg text-muted-foreground mx-auto lg:mx-0">
              Program beasiswa pendidikan nasional untuk pelajar dan mahasiswa Indonesia —
              jalur Prestasi, Ekonomi, Umum, dan Yatim, tanpa minimal nilai, tanpa biaya pendaftaran.
            </p>

            <div className="hidden sm:flex flex-col sm:flex-row gap-3">
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

            <p className="hidden sm:block text-xs text-muted-foreground">
              Gratis 100% · tanpa pungutan biaya · seleksi transparan
            </p>

            <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-3 py-2 sm:px-4 sm:py-3 w-fit">
              <ShieldCheck size={16} className="text-primary shrink-0" />
              <span className="text-[10px] sm:text-xs font-semibold text-foreground/80 whitespace-nowrap">Terbuka untuk</span>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {jenjang.map((j) => (
                  <span key={j} className="rounded-full bg-card px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] font-semibold text-foreground/75 shadow-card whitespace-nowrap">
                    {j}
                  </span>
                ))}
              </div>
            </div>

            <div className="sm:hidden flex flex-col gap-3">
              <Link
                to="/daftar"
                className="btn-block group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground"
              >
                Daftar sekarang
                <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
              </Link>
              <p className="text-center text-[10px] text-muted-foreground">
                Gratis 100% · tanpa pungutan biaya
              </p>
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
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src.includes('undefined') || target.src.includes('null') || (target.src !== new URL(heroDefault, window.location.origin).href)) {
                      target.src = heroDefault;
                    }
                  }}
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
          <div className="card-block grid grid-cols-1 sm:grid-cols-3 gap-4 px-6 py-7">
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

      <div className="container-page overflow-visible">
        <AdSlot placement="after_hero" />
        {/* WIDGET_CUSTOM_HOMEPAGE_1: Tambahkan kode HTML/Adsense di sini */}
        <RawHtmlWidget 
          id="home-widget-1"
          html={homeWidgets.widget1 || ""}
        />
      </div>

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

        <div className="mt-12 grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <CategoryCard
            tag="Beasiswa Prestasi"
            icon={<Trophy />}
            title="Untuk yang berprestasi, akademik & non-akademik"
            desc="Program beasiswa bagi pelajar dan mahasiswa yang memiliki prestasi akademik maupun non akademik."
            to="/beasiswa-prestasi"
          />
          <CategoryCard
            tag="Beasiswa Ekonomi"
            icon={<HeartHandshake />}
            title="Untuk yang membutuhkan dukungan finansial"
            desc="Program beasiswa bagi pelajar dan mahasiswa yang membutuhkan dukungan finansial untuk pendidikan."
            to="/beasiswa-ekonomi"
            variant="dark"
          />
          <CategoryCard
            tag="Beasiswa Umum"
            icon={<Users />}
            title="Untuk semua pelajar & mahasiswa aktif"
            desc="Jalur terbuka tanpa syarat prestasi khusus maupun kriteria ekonomi tertentu. Siapa pun boleh mendaftar."
            to="/beasiswa-umum"
          />
          <CategoryCard
            tag="Beasiswa Yatim"
            icon={<Heart />}
            title="Untuk anak yatim, piatu & yatim piatu"
            desc="Jalur khusus bagi pelajar dan mahasiswa yang telah kehilangan orang tua, agar pendidikan tetap berlanjut."
            to="/beasiswa-yatim"
            variant="dark"
          />
        </div>
      </section>

      <div className="container-page overflow-visible">
        <AdSlot placement="after_categories" />
        {/* WIDGET_CUSTOM_HOMEPAGE_2: Tambahkan kode HTML/Adsense di sini */}
        <RawHtmlWidget id="home-widget-2" html={homeWidgets.widget2 || ""} />
      </div>

      <AboutMockup />

      <BenefitsSection />

      <div className="container-page overflow-visible">
        <AdSlot placement="after_benefits" />
        {/* WIDGET_CUSTOM_HOMEPAGE_3: Tambahkan kode HTML/Adsense di sini */}
        <RawHtmlWidget id="home-widget-3" html={homeWidgets.widget3 || ""} />
      </div>

      <AlumniSection />

      <div className="container-page overflow-visible">
        <AdSlot placement="after_alumni" />
      </div>

      <TimelineSection />

      <FAQSection />

      <div className="container-page overflow-visible">
        <AdSlot placement="after_faq" />
      </div>
    </div>
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
