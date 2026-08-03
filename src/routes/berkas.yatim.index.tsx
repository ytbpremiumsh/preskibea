import { createFileRoute } from "@tanstack/react-router";
import { BerkasInfoPage } from "@/components/BerkasInfoPage";

export const Route = createFileRoute("/berkas/yatim/")({
  head: () => ({
    meta: [
      { title: "Pengiriman Berkas Yatim — Prestasi Kita Section #3" },
      { name: "description", content: "Persyaratan & informasi pengiriman berkas Beasiswa Yatim." },
    ],
  }),
  component: () => <BerkasInfoPage kind="yatim" />,
});
