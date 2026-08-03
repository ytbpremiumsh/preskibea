import { createFileRoute } from "@tanstack/react-router";
import { BerkasInfoPage } from "@/components/BerkasInfoPage";

export const Route = createFileRoute("/berkas/prestasi/")({
  head: () => ({
    meta: [
      { title: "Pengiriman Berkas Prestasi — Prestasi Kita Section #3" },
      { name: "description", content: "Persyaratan & informasi pengiriman berkas Beasiswa Prestasi." },
    ],
  }),
  component: () => <BerkasInfoPage kind="prestasi" />,
});
