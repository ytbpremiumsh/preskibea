import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, HeartHandshake, Share2, Trophy, Users, Heart } from "lucide-react";

export const Route = createFileRoute("/bagikan-poster/")({
  head: () => ({
    meta: [
      { title: "Pilih Kategori Poster — Prestasi Kita" },
      { name: "description", content: "Pilih kategori beasiswa untuk membagikan poster ke media sosial." },
    ],
  }),
  component: PosterSelector,
});

function PosterSelector() {
  return (
    <main className="container-page py-16">
      <header className="max-w-2xl mx-auto text-center">
        <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">Bagikan Poster</span>
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-foreground">Pilih Kategori Poster</h1>
        <p className="mt-3 text-muted-foreground">Pilih jalur beasiswa yang kamu ikuti untuk mendapatkan poster yang sesuai.</p>
      </header>

      <section className="mt-10 grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card to="/bagikan-poster/prestasi" icon={<Trophy size={20} />} title="Poster Beasiswa Prestasi" desc="Unduh & bagikan poster untuk jalur prestasi." />
        <Card to="/bagikan-poster/ekonomi" icon={<HeartHandshake size={20} />} title="Poster Beasiswa Ekonomi" desc="Unduh & bagikan poster untuk jalur ekonomi." />
        <Card to="/bagikan-poster/umum" icon={<Users size={20} />} title="Poster Beasiswa Umum" desc="Unduh & bagikan poster untuk jalur umum." />
        <Card to="/bagikan-poster/yatim" icon={<Heart size={20} />} title="Poster Beasiswa Yatim" desc="Unduh & bagikan poster untuk jalur yatim." />
      </section>
    </main>
  );
}

function Card({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="card-block p-6 flex flex-col">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">{icon}</div>
      <h2 className="mt-3 text-xl font-bold text-foreground">{title}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground flex-1">{desc}</p>
      <Link
        to={to as any}
        className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition"
      >
        <Share2 size={14} /> Lanjut <ArrowRight size={14} />
      </Link>
    </div>
  );
}
