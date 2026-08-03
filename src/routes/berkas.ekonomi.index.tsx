import { createFileRoute } from "@tanstack/react-router";
import { BerkasInfoPage } from "@/components/BerkasInfoPage";

export const Route = createFileRoute("/berkas/ekonomi/")({
  head: () => ({
    meta: [
      { title: "Pengiriman Berkas Ekonomi — Prestasi Kita Batch #8" },
      { name: "description", content: "Persyaratan & informasi pengiriman berkas Beasiswa Ekonomi." },
    ],
  }),
  component: () => <BerkasInfoPage kind="ekonomi" />,
});
