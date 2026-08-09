import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/beasiswa-prestasi")({
  head: () => ({
    meta: [
      { title: "Beasiswa Prestasi — Prestasi Kita Batch #8" },
      { name: "description", content: "Beasiswa untuk pelajar dan mahasiswa berprestasi akademik maupun non-akademik. Total Rp17.000.000/semester." },
      { property: "og:title", content: "Beasiswa Prestasi — Prestasi Kita Batch #8" },
      { property: "og:description", content: "Program beasiswa bagi pelajar dan mahasiswa berprestasi." },
    ],
  }),
  component: () => (
    <CategoryPage
      kind="prestasi"
      tagline="Beasiswa Prestasi"
      title="Beasiswa untuk Pelajar & Mahasiswa Berprestasi"
      desc="Program beasiswa bagi pelajar dan mahasiswa yang memiliki prestasi akademik maupun non akademik. Tunjukkan pencapaianmu dan raih dukungan pendidikan terbaik."
      registerTo="/pendaftaran/prestasi"
      shareTo="/bagikan-poster"
    />
  ),
});
