import { createFileRoute } from "@tanstack/react-router";
import { SharePosterPage } from "@/components/SharePosterPage";

export const Route = createFileRoute("/bagikan-poster")({
  head: () => ({
    meta: [
      { title: "Bagikan Poster Beasiswa — Prestasi Kita Batch #8" },
      { name: "description", content: "Bagikan poster Beasiswa Prestasi Kita Batch #8 ke WhatsApp, Instagram, Facebook, dan X." },
    ],
  }),
  component: () => <SharePosterPage kind="prestasi" />,
});
