import { createFileRoute } from "@tanstack/react-router";
import { RegistrationForm } from "@/components/RegistrationForm";

export const Route = createFileRoute("/pendaftaran/yatim")({
  head: () => ({
    meta: [
      { title: "Pendaftaran Beasiswa Yatim — Prestasi Kita Batch #8" },
      { name: "description", content: "Formulir pendaftaran Beasiswa Yatim Prestasi Kita Batch #8." },
    ],
  }),
  component: () => <RegistrationForm kind="yatim" />,
});
