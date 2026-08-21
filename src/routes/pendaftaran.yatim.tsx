import { createFileRoute } from "@tanstack/react-router";
import { RegistrationForm } from "@/components/RegistrationForm";
import { z } from "zod";

const searchSchema = z.object({
  type: z.enum(["reguler", "fast_track"]).optional().default("reguler"),
  ft_type: z.enum(["standard", "premium"]).optional().default("standard"),
});

export const Route = createFileRoute("/pendaftaran/yatim")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Pendaftaran Beasiswa Yatim — Prestasi Kita Batch #8" },
      { name: "description", content: "Formulir pendaftaran Beasiswa Yatim Prestasi Kita Batch #8." },
    ],
  }),
  component: () => {
    const { type, ft_type } = Route.useSearch();
    return <RegistrationForm kind="yatim" initialType={type} initialFastTrackType={ft_type} />;
  },
});
