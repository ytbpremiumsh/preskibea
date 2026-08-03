import { createFileRoute } from "@tanstack/react-router";
import { BerkasPage } from "@/components/BerkasPage";

type Search = { token?: string };

export const Route = createFileRoute("/berkas/ekonomi/upload")({
  head: () => ({
    meta: [
      { title: "Unggah Berkas Ekonomi — Prestasi Kita Section #3" },
      { name: "description", content: "Unggah berkas pendukung Beasiswa Ekonomi." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  component: () => <BerkasPage kind="ekonomi" />,
});
