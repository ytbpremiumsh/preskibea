import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/bagikan-poster/")({
  loader: () => {
    throw redirect({ to: "/bagikan-poster", replace: true });
  },
  component: () => null,
});