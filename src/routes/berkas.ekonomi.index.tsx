import { createFileRoute, useSearch } from "@tanstack/react-router";
import { BerkasInfoPage } from "@/components/BerkasInfoPage";

export const Route = createFileRoute("/berkas/ekonomi/")({
  head: () => ({
    meta: [
      { title: "Pengiriman Berkas Ekonomi — Prestasi Kita Batch #8" },
      { name: "description", content: "Persyaratan & informasi pengiriman berkas Beasiswa Ekonomi." },
    ],
  }),
  component: () => {
    const search = useSearch({ strict: false }) as { education_level?: string };
    return <BerkasInfoPage kind="ekonomi" educationLevel={search.education_level} />;
  },
});
