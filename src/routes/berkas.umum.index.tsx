import { createFileRoute, useSearch } from "@tanstack/react-router";
import { BerkasInfoPage } from "@/components/BerkasInfoPage";

export const Route = createFileRoute("/berkas/umum/")({
  head: () => ({
    meta: [
      { title: "Pengiriman Berkas Umum — Prestasi Kita Batch #8" },
      { name: "description", content: "Persyaratan & informasi pengiriman berkas Beasiswa Umum." },
    ],
  }),
  component: () => {
    const search = useSearch({ strict: false }) as { education_level?: string };
    return <BerkasInfoPage kind="umum" educationLevel={search.education_level} />;
  },
});
