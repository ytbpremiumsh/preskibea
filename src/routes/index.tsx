import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, HeartHandshake, Trophy, Users, Wallet, Share2, CalendarClock, ArrowRight, CheckCircle2, GraduationCap, Sparkles, FileText } from "lucide-react";
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
      { title: "Beasiswa Pendidikan Prestasi Kita Section #3" },
      { name: "description", content: "Program beasiswa nasional untuk SD, SMP, SMA/SMK/MA, dan Mahasiswa. Total beasiswa Rp17.000.000/semester. Tidak dipungut biaya." },
    ],
  }),
  component: Index,
});

const jenjang = ["SD", "SMP", "SMA/SMK/MA", "Mahasiswa"];

function Index() {
  return (
    <>
      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="container-page py-12 md:py-24 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Title block — first on mobile, part of left column on desktop */}
          <div className="order-1 lg:order-1 lg:hidden space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1.5 text-xs font-semibold text-primary">
              <Sparkles size={14} /> Meraih Pendidikan, Mewujudkan Prestasi
            </span>
            <h1 className="relative text-3xl sm:text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground">
              <span className="block">Beasiswa</span>
              <span className="relative inline-block bg-gradient-to-br from-primary via-[oklch(0.55_0.22_290)] to-[oklch(0.45_0.22_280)] bg-clip-text text-transparent drop-shadow-[0_2px_12px_oklch(0.55_0.22_290/0.25)]">
                Prestasi Kita
                <svg aria-hidden="true" viewBox="0 0 200 8" preserveAspectRatio="none" className="absolute -bottom-1 left-0 h-1.5 w-full text-primary/60">
                  <path d="M2 5 Q 50 1, 100 4 T 198 4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>
              <span className="ml-2">Section</span>{" "}
              <span className="relative inline-block bg-gradient-to-br from-[oklch(0.75_0.18_80)] to-[oklch(0.55_0.16_60)] bg-clip-text text-transparent">
                #3
                <span className="absolute -top-1 -right-2 h-2 w-2 rounded-full bg-[oklch(0.75_0.18_80)] shadow-[0_0_12px_oklch(0.75_0.18_80)]" />
              </span>
            </h1>
          </div>

          <div className="order-2 lg:order-2 relative">
            <img
              src={heroImg}
              alt="Ilustrasi siswa Indonesia penerima beasiswa Prestasi Kita"
              width={1024}
              height={1024}
              className="w-full h-auto max-w-md mx-auto lg:max-w-none"
              fetchPriority="high"
            />
          </div>

          <div className="order-3 lg:order-1 space-y-6 md:space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="hidden lg:inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1.5 text-xs font-semibold text-primary">
              <Sparkles size={14} /> Meraih Pendidikan, Mewujudkan Prestasi
            </span>
            <h1 className="hidden lg:block relative text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight text-foreground">
              <span className="block">Beasiswa</span>
              <span className="relative inline-block bg-gradient-to-br from-primary via-[oklch(0.55_0.22_290)] to-[oklch(0.45_0.22_280)] bg-clip-text text-transparent drop-shadow-[0_4px_24px_oklch(0.55_0.22_290/0.3)]">
                Prestasi Kita
                <svg aria-hidden="true" viewBox="0 0 300 10" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-2 w-full text-primary/60">
                  <path d="M2 6 Q 75 1, 150 5 T 298 5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>{" "}
              <span className="inline-block">Section</span>{" "}
              <span className="relative inline-block bg-gradient-to-br from-[oklch(0.75_0.18_80)] to-[oklch(0.55_0.16_60)] bg-clip-text text-transparent">
                #3
                <span className="absolute -top-1 -right-3 h-2.5 w-2.5 rounded-full bg-[oklch(0.75_0.18_80)] shadow-[0_0_16px_oklch(0.75_0.18_80)]" />
              </span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl">
              Program beasiswa pendidikan nasional untuk pelajar dan mahasiswa Indonesia.
              Tanpa minimal nilai, tanpa biaya pendaftaran.
            </p>

            <div className="flex flex-wrap gap-2">
              {jenjang.map((j) => (
                <span key={j} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/80">
                  {j}
                </span>
              ))}
            </div>

            <div className="grid sm:grid-cols-3 gap-3 pt-2">
              <HighlightCard icon={<Wallet size={18} />} label="Total Beasiswa" value="Rp17.000.000" sub="per semester" highlight />
              <HighlightCard icon={<Trophy size={18} />} label="Beasiswa" value="Prestasi" sub="Akademik & non-akademik" />
              <HighlightCard icon={<HeartHandshake size={18} />} label="Beasiswa" value="Ekonomi" sub="Dukungan finansial" />
            </div>

            <div className="flex pt-2">
              <a href="#timeline" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition sm:w-auto sm:min-w-[280px]">
                Daftar Sekarang <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <AdSlot placement="after_hero" />

      {/* COUNTDOWN — di atas Kategori Beasiswa */}
      <section className="container-page pt-16 pb-4">
        <Countdown />
      </section>

      {/* KATEGORI */}
      <section className="container-page py-16">
        <SectionHeader
          eyebrow="Kategori Beasiswa"
          title="Pilih Jalur Beasiswamu"
          desc="Dua kategori, satu tujuan: membuka akses pendidikan untuk seluruh anak Indonesia."
        />

        <div className="mt-12 grid md:grid-cols-2 gap-6">
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
            variant="gold"
          />
        </div>
      </section>

      <AdSlot placement="after_categories" />

      {/* TENTANG / MOCKUP */}
      <AboutMockup />

      {/* BENEFIT */}
      <BenefitsSection />

      <AdSlot placement="after_benefits" />

      {/* PERAIH BEASISWA SEBELUMNYA */}
      <AlumniSection />

      <AdSlot placement="after_alumni" />

      {/* TIMELINE */}
      <TimelineSection />

      {/* FAQ */}
      <FAQSection />




      <AdSlot placement="after_faq" />
    </>
  );
}

function HighlightCard({ icon, label, value, sub, highlight }: { icon: React.ReactNode; label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "border-transparent bg-primary text-primary-foreground shadow-soft" : "border-border bg-card text-foreground shadow-card"}`}>
      <div className={`flex items-center gap-2 text-xs font-medium ${highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
        {icon} {label}
      </div>
      <div className="mt-1.5 text-lg font-bold">{value}</div>
      <div className={`text-xs ${highlight ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{sub}</div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">{eyebrow}</span>
      <h2 className="mt-4 text-3xl md:text-4xl font-extrabold text-foreground">{title}</h2>
      <p className="mt-3 text-muted-foreground">{desc}</p>
    </div>
  );
}

function CategoryCard({ tag, icon, title, desc, to, variant }: { tag: string; icon: React.ReactNode; title: string; desc: string; to: "/beasiswa-prestasi" | "/beasiswa-ekonomi"; variant?: "gold" }) {
  const isGold = variant === "gold";
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-card hover:shadow-soft hover:-translate-y-1 transition-all duration-300">
      <div className={`absolute -top-16 -right-16 h-48 w-48 rounded-full blur-2xl opacity-50 group-hover:opacity-80 transition ${isGold ? "bg-[oklch(0.88_0.16_85)]/60" : "bg-primary/30"}`} />
      <div className="relative">
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${isGold ? "bg-[oklch(0.92_0.14_85)] text-gold-foreground" : "bg-primary-soft text-primary"}`}>
          {icon}
        </div>
        <span className={`mt-5 inline-block text-xs font-semibold uppercase tracking-wider ${isGold ? "text-[oklch(0.55_0.16_75)]" : "text-primary"}`}>{tag}</span>
        <h3 className="mt-2 text-xl md:text-2xl font-bold text-foreground">{title}</h3>
        <p className="mt-3 text-sm text-muted-foreground">{desc}</p>

        <ul className="mt-5 space-y-2 text-sm text-foreground/80">
          {["Terbuka untuk SD, SMP, SMA/SMK/MA, & Mahasiswa", "Tanpa minimal nilai rapor / IPK", "Tidak dipungut biaya"].map((x) => (
            <li key={x} className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5 text-primary" /> {x}</li>
          ))}
        </ul>

        <Link to={to} className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 transition">
          Lihat Detail <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

// Suppress unused
void Award;
void Users;
