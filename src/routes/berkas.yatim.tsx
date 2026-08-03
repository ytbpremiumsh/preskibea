import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/berkas/yatim")({
  component: () => <Outlet />,
});
