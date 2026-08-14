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
      <section className="relative overflow-hidden bg-primary py-16 md:py-24 text-primary-foreground">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white blur-3xl" />
          <div className="absolute top-1/2 -right-24 h-64 w-64 -translate-y-1/2 rounded-full bg-white blur-3xl" />
        </div>

        <div className="container-page relative z-10">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold backdrop-blur-md">
                <Sparkles size={16} className="text-yellow-300" />
                <span>Pendaftaran Batch #8 Telah Dibuka!</span>
              </div>
              <h1 className="mt-6 text-4xl font-black leading-[1.1] md:text-6xl lg:text-7xl">
                Wujudkan <span className="text-secondary italic">Impian</span> <br />
                Pendidikanmu.
              </h1>
              <p className="mt-8 text-lg font-medium leading-relaxed opacity-90 md:text-xl">
                Prestasi Kita hadir untuk mendukung pelajar dan mahasiswa Indonesia meraih potensi terbaiknya melalui bantuan dana pendidikan dan pengembangan diri.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link
                  to="/pendaftaran/pilih-tipe"
                  className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-secondary px-8 py-4 text-lg font-black text-secondary-foreground shadow-neo transition-all hover:-translate-y-1 active:translate-y-0"
                >
                  Daftar Sekarang <ArrowRight className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/panduan"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-bold backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  Panduan Program
                </Link>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/20 pt-8">
                {stats.map((s) => (
                  <div key={s.label}>
                    <div className="text-2xl font-black md:text-3xl">{s.value}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-wider opacity-70">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative z-10 overflow-hidden rounded-[2.5rem] border-4 border-white/20 shadow-2xl">
                <img
                  src={heroImg}
                  alt="Prestasi Kita Students"
                  className="h-full w-full object-cover"
                />
              </div>
              {/* Floating badges */}
              <div className="absolute -left-6 top-1/4 z-20 animate-bounce-slow">
                <div className="flex items-center gap-3 rounded-2xl border-2 border-white/20 bg-white p-4 text-primary shadow-neo">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-black">Prestasi</div>
                    <div className="text-[10px] font-bold uppercase text-muted-foreground">Kategori Utama</div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 right-10 z-20 animate-float">
                <div className="flex items-center gap-3 rounded-2xl border-2 border-white/20 bg-white p-4 text-primary shadow-neo">
                  <div className="rounded-lg bg-green-500/10 p-2">
                    <Wallet className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-black">Ekonomi</div>
                    <div className="text-[10px] font-bold uppercase text-muted-foreground">Bantuan Dana</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="relative z-20 -mt-6 overflow-hidden bg-secondary py-4 font-black text-secondary-foreground shadow-neo-sm rotate-1">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...marquee, ...marquee].map((m, i) => (
            <span key={i} className="mx-8 flex items-center gap-4 text-lg uppercase">
              <Sparkles size={16} /> {m}
            </span>
          ))}
        </div>
      </div>

      <div className="container-page py-12">
        <AdSlot placement="home_top" />
      </div>

      {/* TIMELINE & COUNTDOWN */}
      <section className="bg-muted py-20">
        <div className="container-page">
          <div className="mb-16 text-center">
            <h2 className="text-sm font-black uppercase tracking-widest text-primary">Jadwal Program</h2>
            <h3 className="mt-4 text-4xl font-black text-foreground md:text-5xl">Garis Waktu Batch #8</h3>
          </div>
          
          <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
            <TimelineSection />
            <div className="space-y-6">
              <Countdown />
              <div className="rounded-[2rem] bg-primary p-8 text-primary-foreground shadow-neo">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white">
                  <ShieldCheck size={24} />
                </div>
                <h4 className="mt-6 text-xl font-bold">100% Bebas Biaya</h4>
                <p className="mt-3 text-sm opacity-80">
                  Pendaftaran beasiswa ini tidak memungut biaya apapun dari peserta di jalur reguler. Hati-hati penipuan!
                </p>
                <Link to="/panduan" className="mt-6 inline-flex items-center gap-2 text-sm font-black hover:underline">
                  Lihat Selengkapnya <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT PROGRAM */}
      <section id="program" className="py-24">
        <div className="container-page">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <div className="relative overflow-hidden rounded-[2.5rem] border-4 border-muted shadow-neo">
                <img
                  src={posterImg}
                  alt="Tentang Program Prestasi Kita"
                  className="w-full"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-primary">Tentang Kami</h2>
              <h3 className="mt-4 text-4xl font-black text-foreground md:text-5xl leading-tight">
                Membangun Masa Depan <br /> Melalui Pendidikan.
              </h3>
              <p className="mt-8 text-lg leading-relaxed text-muted-foreground">
                Beasiswa Prestasi Kita adalah inisiatif pendidikan nasional yang bertujuan untuk membantu pelajar dan mahasiswa Indonesia dalam meringankan biaya pendidikan serta memberikan pembekalan soft skills.
              </p>
              
              <div className="mt-12 space-y-8">
                <div className="flex items-start gap-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-neo-sm">
                    <GraduationCap size={28} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black">Fokus Jenjang</h4>
                    <p className="mt-2 text-muted-foreground">Terbuka untuk pelajar SMP, SMA/SMK/MA sederajat, hingga Mahasiswa S1/D3/D4 aktif.</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground shadow-neo-sm">
                    <Users size={28} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black">Pilihan Jalur</h4>
                    <p className="mt-2 text-muted-foreground">Empat jalur beasiswa yang disesuaikan dengan kondisi dan potensi masing-masing peserta.</p>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <Link
                  to="/tentang"
                  className="inline-flex items-center gap-2 rounded-2xl bg-muted px-8 py-4 font-black transition-all hover:bg-muted/80"
                >
                  Selengkapnya Tentang Kami <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MOCKUP SECTION */}
      <AboutMockup />

      <div className="container-page py-12">
        <AdSlot placement="home_middle" />
      </div>

      {/* CATEGORIES SECTION */}
      <section id="jalur" className="bg-primary py-24 text-primary-foreground">
        <div className="container-page text-center">
          <h2 className="text-sm font-black uppercase tracking-widest opacity-80">Jalur Beasiswa</h2>
          <h3 className="mt-4 text-4xl font-black md:text-5xl">Pilih Kategori Yang Sesuai</h3>
          
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <CategoryCard 
              icon={<Trophy size={32} />}
              title="Jalur Prestasi"
              desc="Untuk kamu yang memiliki prestasi akademik atau non-akademik di tingkat sekolah atau nasional."
              color="bg-white"
            />
            <CategoryCard 
              icon={<Wallet size={32} />}
              title="Jalur Ekonomi"
              desc="Bantuan untuk peserta dengan keterbatasan ekonomi namun memiliki semangat belajar tinggi."
              color="bg-white"
            />
            <CategoryCard 
              icon={<Sparkles size={32} />}
              title="Jalur Umum"
              desc="Jalur pendaftaran terbuka bagi seluruh pelajar dan mahasiswa tanpa syarat prestasi khusus."
              color="bg-white"
            />
            <CategoryCard 
              icon={<Heart size={32} />}
              title="Jalur Yatim"
              desc="Dukungan khusus bagi pelajar dan mahasiswa yatim, piatu, atau yatim piatu."
              color="bg-white"
            />
          </div>
          
          <div className="mt-16 text-center">
            <Link
              to="/pendaftaran/pilih-tipe"
              className="inline-flex items-center gap-2 rounded-2xl bg-secondary px-10 py-5 text-xl font-black text-secondary-foreground shadow-neo transition-all hover:-translate-y-1"
            >
              Mulai Pendaftaran <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <div className="container-page py-12">
        <AdSlot placement="home_bottom" />
      </div>

      <BenefitsSection />

      <AlumniSection />

      <FAQSection />

      {/* CTA SECTION */}
      <section className="bg-white py-24">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-[3rem] bg-secondary p-12 text-center text-secondary-foreground shadow-neo md:p-20">
            <div className="absolute top-0 right-0 p-8 opacity-20">
              <Sparkles size={120} />
            </div>
            <div className="relative z-10 mx-auto max-w-3xl">
              <h2 className="text-4xl font-black md:text-6xl">Siap Meraih Beasiswa?</h2>
              <p className="mt-8 text-xl font-medium opacity-90">
                Jangan lewatkan kesempatan emas untuk masa depan yang lebih baik. Pendaftaran ditutup 7 Februari 2027.
              </p>
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/pendaftaran/pilih-tipe"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-primary px-10 py-5 text-xl font-black text-primary-foreground shadow-neo-sm transition-all hover:-translate-y-1"
                >
                  Daftar Sekarang <ArrowRight />
                </Link>
                <Link
                  to="/panduan"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border-2 border-primary/20 bg-white/50 px-10 py-5 text-xl font-black backdrop-blur-sm transition-all hover:bg-white"
                >
                  Pelajari Dulu
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <RawHtmlWidget widgets={homeWidgets} />
    </div>
  );
}

function CategoryCard({ icon, title, desc, color }: { icon: React.ReactNode; title: string; desc: string; color: string }) {
  return (
    <div className={`rounded-3xl p-8 text-left transition-all hover:-translate-y-2 ${color} text-primary shadow-neo`}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h4 className="mt-6 text-2xl font-black leading-tight">{title}</h4>
      <p className="mt-4 text-sm font-medium leading-relaxed text-primary/70">
        {desc}
      </p>
    </div>
  );
}
