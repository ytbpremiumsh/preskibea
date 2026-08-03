import { createFileRoute } from "@tanstack/react-router";
import { SharePosterPage } from "@/components/SharePosterPage";

export const Route = createFileRoute("/bagikan-poster/umum")({
  head: () => ({
    meta: [
      { title: "Bagikan Poster Beasiswa Umum — Prestasi Kita Batch #8" },
      { name: "description", content: "Bagikan poster Beasiswa Umum Prestasi Kita Batch #8 ke WhatsApp, Instagram, Facebook, dan X." },
    ],
  }),
  component: () => <SharePosterPage kind="umum" />,
});
