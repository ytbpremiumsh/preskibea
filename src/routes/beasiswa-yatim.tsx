import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/beasiswa-yatim")({
  head: () => ({
    meta: [
      { title: "Beasiswa Yatim — Prestasi Kita Batch #8" },
      { name: "description", content: "Jalur beasiswa khusus bagi anak yatim, piatu, dan yatim piatu yang sedang menempuh pendidikan di Indonesia." },
      { property: "og:title", content: "Beasiswa Yatim — Prestasi Kita Batch #8" },
      { property: "og:description", content: "Jalur khusus untuk anak yatim, piatu, dan yatim piatu." },
    ],
  }),
  component: () => (
    <CategoryPage
      kind="yatim"
      tagline="Beasiswa Yatim"
      title="Beasiswa Jalur Yatim untuk Pelajar & Mahasiswa"
      desc="Jalur khusus bagi anak yatim, piatu, maupun yatim piatu yang ingin terus melanjutkan pendidikan. Cukup lengkapi berkas pendukung — tanpa minimal nilai dan tanpa biaya pendaftaran."
      registerTo="/pendaftaran/yatim"
      shareTo="/bagikan-poster"
    />
  ),
});
