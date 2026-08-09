import { createFileRoute } from "@tanstack/react-router";
import { BerkasInfoPage } from "@/components/BerkasInfoPage";

export const Route = createFileRoute("/berkas/yatim/")({
  head: () => ({
    meta: [
      { title: "Pengiriman Berkas Yatim — Prestasi Kita Batch #8" },
      { name: "description", content: "Persyaratan & informasi pengiriman berkas Beasiswa Yatim." },
    ],
  }),
  component: () => {
    const search = useSearch({ strict: false }) as { education_level?: string };
    return <BerkasInfoPage kind="yatim" educationLevel={search.education_level} />;
  },
});
