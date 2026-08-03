import { createFileRoute } from "@tanstack/react-router";
import { RegistrationForm } from "@/components/RegistrationForm";

export const Route = createFileRoute("/pendaftaran/prestasi")({
  head: () => ({
    meta: [
      { title: "Pendaftaran Beasiswa Prestasi — Prestasi Kita Batch #8" },
      { name: "description", content: "Formulir pendaftaran Beasiswa Prestasi Prestasi Kita Batch #8." },
    ],
  }),
  component: () => <RegistrationForm kind="prestasi" />,
});
