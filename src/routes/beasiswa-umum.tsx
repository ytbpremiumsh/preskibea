import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/beasiswa-umum")({
  head: () => ({
    meta: [
      { title: "Beasiswa Umum — Prestasi Kita Section #3" },
      { name: "description", content: "Jalur beasiswa umum untuk seluruh pelajar dan mahasiswa Indonesia, tanpa syarat prestasi maupun kondisi ekonomi tertentu." },
      { property: "og:title", content: "Beasiswa Umum — Prestasi Kita Section #3" },
      { property: "og:description", content: "Jalur terbuka untuk semua pelajar & mahasiswa Indonesia." },
    ],
  }),
  component: () => (
    <CategoryPage
      kind="umum"
      tagline="Beasiswa Umum"
      title="Beasiswa Jalur Umum untuk Semua Pelajar & Mahasiswa"
      desc="Jalur terbuka bagi siapa saja yang sedang menempuh pendidikan di Indonesia. Tanpa syarat prestasi khusus maupun kriteria ekonomi tertentu — cukup penuhi persyaratan dasar dan kirim berkasmu."
      registerTo="/pendaftaran/umum"
      shareTo="/bagikan-poster/umum"
    />
  ),
});
