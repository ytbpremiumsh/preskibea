import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, HeartHandshake, Trophy, Users, Heart } from "lucide-react";
import ilustrasiPrestasi from "@/assets/jalur-prestasi.jpg";
import ilustrasiEkonomi from "@/assets/jalur-ekonomi.jpg";
import ilustrasiUmum from "@/assets/jalur-umum.jpg";
import ilustrasiYatim from "@/assets/jalur-yatim.jpg";
import { useBranding } from "@/hooks/use-branding";

export const Route = createFileRoute("/daftar")({
  head: () => ({
    meta: [
      { title: "Pilih Jalur Pendaftaran — Prestasi Kita" },
      { name: "description", content: "Pilih jalur beasiswa: Prestasi, Ekonomi, Umum, atau Yatim sebelum mengisi formulir pendaftaran." },
    ],
  }),
  component: DaftarSelector,
});

function DaftarSelector() {
  const { categoryImages } = useBranding();

  return (
    <main className="container-page py-16">
      <header className="max-w-2xl mx-auto text-center">
        <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">Pendaftaran</span>
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-foreground">Pilih Jalur Beasiswa</h1>
        <p className="mt-3 text-muted-foreground">Pilih kategori yang sesuai dengan kondisimu untuk melanjutkan pendaftaran.</p>
      </header>

      <section className="mt-12 grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <CategoryCard
          to="/beasiswa-prestasi"
          icon={<Trophy size={20} />}
          title="Beasiswa Prestasi"
          desc="Untuk pelajar dengan prestasi akademik maupun non-akademik."
          cta="Daftar Prestasi"
          illustration={categoryImages.prestasi || ilustrasiPrestasi}
        />
        <CategoryCard
          to="/beasiswa-ekonomi"
          icon={<HeartHandshake size={20} />}
          title="Beasiswa Ekonomi"
          desc="Dukungan finansial bagi pelajar dari keluarga prasejahtera."
          cta="Daftar Ekonomi"
          illustration={categoryImages.ekonomi || ilustrasiEkonomi}
        />
        <CategoryCard
          to="/beasiswa-umum"
          icon={<Users size={20} />}
          title="Beasiswa Umum"
          desc="Jalur terbuka untuk semua pelajar & mahasiswa aktif di Indonesia."
          cta="Daftar Umum"
          illustration={categoryImages.umum || ilustrasiUmum}
        />
        <CategoryCard
          to="/beasiswa-yatim"
          icon={<Heart size={20} />}
          title="Beasiswa Yatim"
          desc="Jalur khusus bagi anak yatim, piatu, dan yatim piatu."
          cta="Daftar Yatim"
          illustration={categoryImages.yatim || ilustrasiYatim}
        />
      </section>
    </main>
  );
}

function CategoryCard({ 
  to, 
  icon, 
  title, 
  desc, 
  cta, 
  illustration 
}: { 
  to: string; 
  icon: React.ReactNode; 
  title: string; 
  desc: string; 
  cta: string;
  illustration: string;
}) {
  return (
    <div className="card-block group flex flex-col overflow-hidden">
      <div className="aspect-[16/9] w-full overflow-hidden bg-secondary/30 border-b border-border">
        <img 
          src={illustration} 
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            const target = e.currentTarget;
            const fallbacks: Record<string, string> = {
              "Beasiswa Prestasi": ilustrasiPrestasi,
              "Beasiswa Ekonomi": ilustrasiEkonomi,
              "Beasiswa Umum": ilustrasiUmum,
              "Beasiswa Yatim": ilustrasiYatim
            };
            if (fallbacks[title] && target.src !== fallbacks[title]) {
              target.src = fallbacks[title];
            }
          }}
        />
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
            {icon}
          </div>
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
        </div>
        <p className="mt-4 text-sm text-muted-foreground flex-1 leading-relaxed">
          {desc}
        </p>
        <Link
          to={to as any}
          className="btn-block mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-soft hover:opacity-95 transition"
        >
          {cta} <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

