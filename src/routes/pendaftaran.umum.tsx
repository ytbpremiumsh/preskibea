import { createFileRoute } from "@tanstack/react-router";
import { RegistrationForm } from "@/components/RegistrationForm";
import { z } from "zod";

const searchSchema = z.object({
  type: z.enum(["reguler", "fast_track"]).optional().default("reguler"),
});

export const Route = createFileRoute("/pendaftaran/umum")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Pendaftaran Beasiswa Umum — Prestasi Kita Batch #8" },
      { name: "description", content: "Formulir pendaftaran Beasiswa Umum Prestasi Kita Batch #8." },
    ],
  }),
  component: () => {
    const { type } = Route.useSearch();
    return <RegistrationForm kind="umum" initialType={type} />;
  },
});
