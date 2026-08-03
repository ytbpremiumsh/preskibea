import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/beasiswa-ekonomi")({
  head: () => ({
    meta: [
      { title: "Beasiswa Ekonomi — Prestasi Kita Batch #8" },
      { name: "description", content: "Beasiswa untuk pelajar dan mahasiswa yang membutuhkan dukungan finansial. Total Rp17.000.000/semester." },
      { property: "og:title", content: "Beasiswa Ekonomi — Prestasi Kita Batch #8" },
      { property: "og:description", content: "Program beasiswa bagi pelajar dan mahasiswa yang membutuhkan dukungan finansial." },
    ],
  }),
  component: () => (
    <CategoryPage
      kind="ekonomi"
      tagline="Beasiswa Ekonomi"
      title="Beasiswa untuk Dukungan Pendidikan yang Setara"
      desc="Program beasiswa bagi pelajar dan mahasiswa yang membutuhkan dukungan finansial untuk pendidikan. Pendidikan berkualitas adalah hak semua anak Indonesia."
      registerTo="/pendaftaran/ekonomi"
      shareTo="/bagikan-poster/ekonomi"
    />
  ),
});
