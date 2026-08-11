import { Wallet, Award, Gift, PlayCircle, Users, Briefcase } from "lucide-react";
import benefitDefault from "@/assets/benefit-prestasi-kita.png.asset.json";
import { useBranding } from "@/hooks/use-branding";

const benefits = [
  {
    icon: Wallet,
    title: "Dana Pendidikan Beasiswa",
    desc: "Bantuan dana pendidikan hingga Rp17.000.000 per semester untuk penerima.",
    accent: "bg-primary text-primary-foreground",
  },
  {
    icon: PlayCircle,
    title: "Video Motivasi",
    desc: 'Video eksklusif "Menghadapi Tantangan dan Meraih Keberhasilan dalam Studi".',
    accent: "bg-[oklch(0.92_0.14_85)] text-gold-foreground",
  },
  {
    icon: Gift,
    title: "Merchandise Menarik",
    desc: "Paket merchandise eksklusif dari Prestasi Kita: kaos, block note, goodie bag, dan lainnya.",
    accent: "bg-primary-soft text-primary",
  },
  {
    icon: Award,
    title: "Sertifikat Beasiswa",
    desc: "Sertifikat resmi penerima beasiswa langsung dari Prestasi Kita.",
    accent: "bg-primary-soft text-primary",
  },
  {
    icon: Users,
    title: "Kontingen Ambassador",
    desc: "Peluang menjadi Kontingen Ambassador Program Prestasi Kita.",
    accent: "bg-primary-soft text-primary",
  },
  {
    icon: Briefcase,
    title: "Akses Magang",
    desc: "Kesempatan magang di Prestasi Kita Indonesia dan jaringan partner.",
    accent: "bg-primary-soft text-primary",
  },
];

export function BenefitsSection() {
  const { benefitImage } = useBranding();
  const benefitImg = benefitImage || "https://ltmfvbcazebowndigkyi.supabase.co/storage/v1/object/public/admin-media/branding/benefit-prestasi-kita-batch-8.png?t=1723334400123";

  return (
    <section className="container-page py-20">
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
          Benefit Beasiswa
        </span>
        <h2 className="mt-4 text-3xl md:text-4xl font-extrabold text-foreground">
          Apa Saja yang Kamu Dapatkan?
        </h2>
        <p className="mt-3 text-muted-foreground">
          Bukan sekadar beasiswa tunai — kamu mendapatkan paket lengkap untuk mendukung
          perjalanan akademis dan pengembangan diri.
        </p>
      </div>

      <div className="mt-12 mb-16 flex justify-center">
        <div className="card-block overflow-hidden max-w-4xl w-full">
          <img 
            src={benefitImg} 
            alt="Benefit Beasiswa Prestasi Kita" 
            className="w-full h-auto object-contain"
          />
        </div>
      </div>

      <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {benefits.map((b) => (
          <div
            key={b.title}
            className="card-block p-6 transition"
          >
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${b.accent}`}>
              <b.icon size={20} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">{b.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{b.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
