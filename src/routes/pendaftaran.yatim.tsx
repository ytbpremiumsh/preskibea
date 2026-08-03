import { createFileRoute } from "@tanstack/react-router";
import { RegistrationForm } from "@/components/RegistrationForm";

export const Route = createFileRoute("/pendaftaran/yatim")({
  head: () => ({
    meta: [
      { title: "Pendaftaran Beasiswa Yatim — Prestasi Kita Section #3" },
      { name: "description", content: "Formulir pendaftaran Beasiswa Yatim Prestasi Kita Section #3." },
    ],
  }),
  component: () => <RegistrationForm kind="yatim" />,
});
