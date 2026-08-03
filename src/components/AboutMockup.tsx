import { Award, BookOpen, Wallet } from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Dana Pendidikan",
    desc: "Bantuan beasiswa hingga Rp17.000.000 per semester langsung ke penerima yang lolos seleksi.",
  },
  {
    icon: BookOpen,
    title: "Akses Terbuka",
    desc: "Terbuka untuk SD, SMP, SMA/SMK/MA, dan Mahasiswa di seluruh Indonesia.",
  },
  {
    icon: Award,
    title: "Apresiasi Prestasi",
    desc: "Mengapresiasi pelajar berprestasi akademik maupun non-akademik tanpa minimal nilai.",
  },
];

export function AboutMockup() {
  return (
    <section className="container-page py-20">
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
          Tentang Program
        </span>
        <h2 className="mt-4 text-3xl md:text-4xl font-extrabold text-foreground">
          Apa itu Beasiswa Prestasi Kita?
        </h2>
        <p className="mt-3 text-muted-foreground">
          Program beasiswa pendidikan nasional untuk mendukung pelajar Indonesia meraih
          mimpi akademis dan non-akademis. Berbasis prestasi dan kebutuhan ekonomi,
          dijalankan secara transparan dan tanpa biaya pendaftaran.
        </p>
      </div>

      <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f) => (
          <div
            key={f.title}
            className="card-block group p-6 transition"
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary group-hover:scale-105 transition">
              <f.icon size={20} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
