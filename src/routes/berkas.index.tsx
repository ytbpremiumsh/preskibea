import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileText, HeartHandshake, Trophy, Users, Heart } from "lucide-react";
import { useBranding } from "@/hooks/use-branding";
import { RawHtmlWidget } from "@/components/ads/RawHtmlWidget";

export const Route = createFileRoute("/berkas/")({
  head: () => ({
    meta: [
      { title: "Pilih Kategori Pengiriman Berkas — Prestasi Kita" },
      { name: "description", content: "Pilih kategori beasiswa untuk mengirimkan berkas pendukung." },
    ],
  }),
  component: BerkasSelector,
});

function BerkasSelector() {
  const { berkasWidgets } = useBranding();

  return (
    <main className="container-page py-16">
      {/* Widget Atas Berkas */}
      {berkasWidgets.top && (
        <div className="mb-10 overflow-visible">
          <RawHtmlWidget id="berkas-widget-top" html={berkasWidgets.top} />
        </div>
      )}
      <header className="max-w-2xl mx-auto text-center">
        <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">Pengiriman Berkas</span>
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-foreground">Pilih Kategori Berkas</h1>
        <p className="mt-3 text-muted-foreground">Sesuaikan jalur beasiswa yang kamu daftarkan.</p>
      </header>

      <section className="mt-10 grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card to="/berkas/prestasi" icon={<Trophy size={20} />} title="Berkas Beasiswa Prestasi" desc="Lihat persyaratan dan unggah berkas untuk jalur prestasi." />
        <Card to="/berkas/ekonomi" icon={<HeartHandshake size={20} />} title="Berkas Beasiswa Ekonomi" desc="Lihat persyaratan dan unggah berkas untuk jalur ekonomi." />
        <Card to="/berkas/umum" icon={<Users size={20} />} title="Berkas Beasiswa Umum" desc="Lihat persyaratan dan unggah berkas untuk jalur umum." />
        <Card to="/berkas/yatim" icon={<Heart size={20} />} title="Berkas Beasiswa Yatim" desc="Lihat persyaratan dan unggah berkas untuk jalur yatim." />
      </section>

      {/* Widget Bawah Berkas */}
      {berkasWidgets.bottom && (
        <div className="mt-16 overflow-visible">
          <RawHtmlWidget id="berkas-widget-bottom" html={berkasWidgets.bottom} />
        </div>
      )}
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
        <FileText size={14} /> Lanjut <ArrowRight size={14} />
      </Link>
    </div>
  );
}
