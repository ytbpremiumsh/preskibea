import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, HeartHandshake, Trophy, Users } from "lucide-react";

export const Route = createFileRoute("/daftar")({
  head: () => ({
    meta: [
      { title: "Pilih Jalur Pendaftaran — Prestasi Kita" },
      { name: "description", content: "Pilih jalur beasiswa: Prestasi, Ekonomi, atau Umum sebelum mengisi formulir pendaftaran." },
    ],
  }),
  component: DaftarSelector,
});

function DaftarSelector() {
  return (
    <main className="container-page py-16">
      <header className="max-w-2xl mx-auto text-center">
        <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">Pendaftaran</span>
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-foreground">Pilih Jalur Beasiswa</h1>
        <p className="mt-3 text-muted-foreground">Pilih kategori yang sesuai dengan kondisimu untuk melanjutkan pendaftaran.</p>
      </header>

      <section className="mt-10 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <CategoryCard
          to="/beasiswa-prestasi"
          icon={<Trophy size={20} />}
          title="Beasiswa Prestasi"
          desc="Untuk pelajar dengan prestasi akademik maupun non-akademik."
          cta="Daftar Prestasi"
        />
        <CategoryCard
          to="/beasiswa-ekonomi"
          icon={<HeartHandshake size={20} />}
          title="Beasiswa Ekonomi"
          desc="Dukungan finansial bagi pelajar dari keluarga prasejahtera."
          cta="Daftar Ekonomi"
        />
        <CategoryCard
          to="/beasiswa-umum"
          icon={<Users size={20} />}
          title="Beasiswa Umum"
          desc="Jalur terbuka untuk semua pelajar & mahasiswa aktif di Indonesia."
          cta="Daftar Umum"
        />
      </section>
    </main>
  );
}

function CategoryCard({ to, icon, title, desc, cta }: { to: string; icon: React.ReactNode; title: string; desc: string; cta: string }) {
  return (
    <div className="card-block p-6 flex flex-col">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">{icon}</div>
      <h2 className="mt-3 text-xl font-bold text-foreground">{title}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground flex-1">{desc}</p>
      <Link
        to={to as any}
        className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition"
      >
        {cta} <ArrowRight size={14} />
      </Link>
    </div>
  );
}
