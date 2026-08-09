import { createFileRoute, useSearch } from "@tanstack/react-router";
import { BerkasInfoPage } from "@/components/BerkasInfoPage";

export const Route = createFileRoute("/berkas/prestasi/")({
  head: () => ({
    meta: [
      { title: "Pengiriman Berkas Prestasi — Prestasi Kita Batch #8" },
      { name: "description", content: "Persyaratan & informasi pengiriman berkas Beasiswa Prestasi." },
    ],
  }),
  component: () => {
    const search = useSearch({ strict: false }) as { education_level?: string };
    return <BerkasInfoPage kind="prestasi" educationLevel={search.education_level} />;
  },
});
