import { createFileRoute } from "@tanstack/react-router";
import { RegistrationForm } from "@/components/RegistrationForm";

export const Route = createFileRoute("/pendaftaran/umum")({
  head: () => ({
    meta: [
      { title: "Pendaftaran Beasiswa Umum — Prestasi Kita Section #3" },
      { name: "description", content: "Formulir pendaftaran Beasiswa Umum Prestasi Kita Section #3." },
    ],
  }),
  component: () => <RegistrationForm kind="umum" />,
});
