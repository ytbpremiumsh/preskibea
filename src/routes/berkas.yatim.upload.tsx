import { createFileRoute } from "@tanstack/react-router";
import { BerkasPage } from "@/components/BerkasPage";

type Search = { token?: string };

export const Route = createFileRoute("/berkas/yatim/upload")({
  head: () => ({
    meta: [
      { title: "Unggah Berkas Yatim — Prestasi Kita Section #3" },
      { name: "description", content: "Unggah berkas pendukung Beasiswa Yatim." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  component: () => <BerkasPage kind="yatim" />,
});
