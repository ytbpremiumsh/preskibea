import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/berkas/umum")({
  component: () => <Outlet />,
});
