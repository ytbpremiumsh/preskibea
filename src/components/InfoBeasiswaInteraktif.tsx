import { useState } from "react";
import {
  GraduationCap,
  Backpack,
  Wallet,
  CheckCircle2,
  Sparkles,
  Award,
  Gift,
  PlayCircle,
  Users,
  Briefcase,
} from "lucide-react";

type KategoriInfo = {
  key: string;
  label: string;
  icon: React.ReactNode;
  // nominal per jenjang; jika sama untuk semua jenjang, isi sama
  nominal: { pelajar: string; mahasiswa: string };
  periode: string;
  highlight: string;
  fakta: string[];
};

const kategoriBeasiswa = [
  "Kategori Prestasi",
  "Kategori Ekonomi",
  "Kategori Umum",
  "Kategori Yatim",
];

// Nominal per kategori (dalam ribuan Rupiah) per jenjang
// Prestasi & Ekonomi: Pelajar 800rb, Mahasiswa 1jt
// Umum & Yatim: 500rb (sama untuk semua jenjang)
const nominalByKategori: Record<string, { pelajar: string; mahasiswa: string }> = {
  prestasi: { pelajar: "Rp800.000", mahasiswa: "Rp1.000.000" },
  ekonomi: { pelajar: "Rp800.000", mahasiswa: "Rp1.000.000" },
  umum: { pelajar: "Rp500.000", mahasiswa: "Rp500.000" },
  yatim: { pelajar: "Rp500.000", mahasiswa: "Rp500.000" },
};

const data: KategoriInfo[] = [
  {
    key: "pelajar",
    label: "Pelajar",
    icon: <Backpack size={20} />,
    nominal: { pelajar: "Rp800.000", mahasiswa: "Rp1.000.000" },
    periode: "per semester",
    highlight: "Untuk jenjang SMP/MTs, SMA/SMK/MA sederajat & Gap Year",
    fakta: [
      "Berlaku untuk seluruh sekolah di Indonesia",
      "Tanpa minimal nilai rapor",
      "Jalur prestasi, ekonomi, umum & yatim tersedia",
      "Pilihan Jalur Fast Track tersedia",
    ],
  },
  {
    key: "mahasiswa",
    label: "Mahasiswa",
    icon: <GraduationCap size={20} />,
    nominal: { pelajar: "Rp800.000", mahasiswa: "Rp1.000.000" },
    periode: "per semester",
    highlight: "Untuk Mahasiswa aktif maupun calon mahasiswa D3–S2 PTN/PTS",
    fakta: [
      "Berlaku untuk seluruh kampus di Indonesia",
      "Tanpa minimal IPK",
      "Jalur prestasi, ekonomi, umum & yatim tersedia",
      "Pilihan Jalur Fast Track tersedia",
    ],
  },
];


const benefits = [
  {
    icon: PlayCircle,
    title: "Video Motivasi",
    desc: 'Video eksklusif "Menghadapi Tantangan dan Meraih Keberhasilan dalam Studi".',
  },
  {
    icon: Gift,
    title: "Merchandise Menarik",
    desc: "Paket merchandise eksklusif: kaos, block note, goodie bag, dan lainnya.",
  },
  {
    icon: Award,
    title: "Sertifikat Beasiswa",
    desc: "Sertifikat resmi penerima beasiswa langsung dari Prestasi Kita.",
  },
  {
    icon: Users,
    title: "Kontingen Ambassador",
    desc: "Peluang menjadi Kontingen Ambassador Program Prestasi Kita.",
  },
  {
    icon: Briefcase,
    title: "Akses Magang",
    desc: "Kesempatan magang di Prestasi Kita Indonesia dan jaringan partner.",
  },
  {
    icon: Zap,
    title: "Benefit Fast Track",
    desc: "Sertifikat Nasional, Template CV, E-Book (Rp79rb), & Group List Beasiswa 2026.",
  },
];

export function InfoBeasiswaInteraktif() {
  const [active, setActive] = useState<string>("pelajar");
  const current = data.find((d) => d.key === active)!;

  return (
    <section className="py-4">
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles size={14} /> Nominal Bantuan
        </span>
        <h2 className="mt-3 text-2xl md:text-3xl font-extrabold text-foreground">
          Besaran Beasiswa per Jenjang
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Pilih jenjang untuk melihat detail dukungan yang akan diterima.
        </p>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {data.map((d) => {
          const isActive = active === d.key;
          return (
            <button
              key={d.key}
              onClick={() => setActive(d.key)}
              className={`group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold border transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-soft scale-105"
                  : "bg-card text-foreground border-border hover:border-primary hover:text-primary"
              }`}
            >
              <span className={isActive ? "text-primary-foreground" : "text-primary"}>
                {d.icon}
              </span>
              {d.label}
            </button>
          );
        })}
      </div>

      {/* Detail card */}
      <div
        key={current.key}
        className="card-block mt-6 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500"
      >
        <div className="grid md:grid-cols-[1.1fr_1fr] gap-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              <Wallet size={14} /> Nominal Bantuan
            </span>

            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {kategoriBeasiswa.map((k, idx) => {
                const kKey = ["prestasi", "ekonomi", "umum", "yatim"][idx];
                const nominal = nominalByKategori[kKey][active as "pelajar" | "mahasiswa"];
                return (
                  <div key={k} className="rounded-2xl border border-primary/30 p-4 bg-primary-soft/40">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {k}
                    </p>
                    <p className="mt-2 text-2xl md:text-3xl font-extrabold text-foreground break-words">
                      {nominal}
                    </p>
                    <p className="text-xs text-muted-foreground">{current.periode}</p>
                  </div>
                );
              })}
            </div>


            <p className="mt-4 text-muted-foreground">{current.highlight}</p>
          </div>

          <div className="rounded-2xl bg-primary-soft/50 p-6 border border-primary/10">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
              Fakta {current.label}
            </h3>
            <ul className="mt-4 space-y-3">
              {current.fakta.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground/85">
                  <CheckCircle2 size={18} className="mt-0.5 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Benefit lainnya */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
              Benefit Lainnya
            </h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Selain dana, penerima beasiswa juga mendapatkan paket lengkap berikut:
          </p>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-border bg-background p-4 hover:border-primary/40 hover:shadow-soft transition"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <b.icon size={18} />
                </div>
                <h4 className="mt-3 text-sm font-semibold text-foreground">{b.title}</h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
