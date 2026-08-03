import { createFileRoute } from "@tanstack/react-router";
import { RegistrationForm } from "@/components/RegistrationForm";

export const Route = createFileRoute("/pendaftaran/umum")({
  head: () => ({
    meta: [
      { title: "Pendaftaran Beasiswa Umum — Prestasi Kita Batch #8" },
      { name: "description", content: "Formulir pendaftaran Beasiswa Umum Prestasi Kita Batch #8." },
    ],
  }),
  component: () => <RegistrationForm kind="umum" />,
});
