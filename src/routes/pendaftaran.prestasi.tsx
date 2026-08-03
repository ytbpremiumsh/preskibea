import { createFileRoute } from "@tanstack/react-router";
import { RegistrationForm } from "@/components/RegistrationForm";

export const Route = createFileRoute("/pendaftaran/prestasi")({
  head: () => ({
    meta: [
      { title: "Pendaftaran Beasiswa Prestasi — Prestasi Kita Section #3" },
      { name: "description", content: "Formulir pendaftaran Beasiswa Prestasi Prestasi Kita Section #3." },
    ],
  }),
  component: () => <RegistrationForm kind="prestasi" />,
});
