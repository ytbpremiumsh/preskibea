import { createFileRoute } from "@tanstack/react-router";
import { RegistrationForm } from "@/components/RegistrationForm";

export const Route = createFileRoute("/pendaftaran/ekonomi")({
  head: () => ({
    meta: [
      { title: "Pendaftaran Beasiswa Ekonomi — Prestasi Kita Batch #8" },
      { name: "description", content: "Formulir pendaftaran Beasiswa Ekonomi Prestasi Kita Batch #8." },
    ],
  }),
  component: () => <RegistrationForm kind="ekonomi" />,
});
