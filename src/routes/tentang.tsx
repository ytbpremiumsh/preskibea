import { createFileRoute } from "@tanstack/react-router";
import { HeartHandshake, Trophy, Users } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";

export const Route = createFileRoute("/tentang")({
  head: () => ({
    meta: [
      { title: "Tentang — Prestasi Kita" },
      { name: "description", content: "Tentang program Beasiswa Prestasi Kita: visi, misi, dan dampak bagi penerima." },
      { property: "og:title", content: "Tentang — Prestasi Kita" },
      { property: "og:description", content: "Mengenal program Beasiswa Prestasi Kita." },
    ],
  }),
  component: TentangPage,
});

function TentangPage() {
  return (
    <main className="container-page py-16">
      <header className="max-w-2xl">
        <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">Tentang Kami</span>
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-foreground">Tentang Beasiswa Prestasi Kita</h1>
        <p className="mt-3 text-muted-foreground">
          Beasiswa Prestasi Kita hadir untuk mendukung pelajar berprestasi dan
          mereka yang membutuhkan dukungan ekonomi agar dapat melanjutkan pendidikan
          dengan lebih ringan dan terarah.
        </p>
      </header>

      <section className="mt-10 grid md:grid-cols-3 gap-6">
        {[
          { icon: <Trophy size={20} />, title: "Mendorong Prestasi", desc: "Memberi apresiasi kepada pelajar yang aktif berprestasi akademik & non-akademik." },
          { icon: <HeartHandshake size={20} />, title: "Meringankan Ekonomi", desc: "Membantu biaya pendidikan bagi pelajar dari keluarga prasejahtera." },
          { icon: <Users size={20} />, title: "Pembinaan Berkelanjutan", desc: "Memberikan mentoring & pendampingan agar penerima terus berkembang." },
        ].map((b) => (
          <div key={b.title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">{b.icon}</div>
            <h3 className="mt-3 font-semibold text-foreground">{b.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{b.desc}</p>
          </div>
        ))}
      </section>

      <AdSlot placement="tentang_middle" />

      <section className="mt-12 rounded-2xl border border-border bg-card p-6 md:p-10 shadow-card">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">Visi & Misi</h2>
        <p className="mt-3 text-muted-foreground">
          Visi: Menjadi gerakan beasiswa yang inklusif dan memberdayakan generasi muda Indonesia.
        </p>
        <ul className="mt-3 list-disc pl-5 text-muted-foreground space-y-1.5">
          <li>Mendorong pelajar untuk terus berprestasi.</li>
          <li>Memberikan dukungan finansial yang tepat sasaran.</li>
          <li>Membangun ekosistem mentoring & pembinaan penerima.</li>
        </ul>
      </section>
    </main>
  );
}
