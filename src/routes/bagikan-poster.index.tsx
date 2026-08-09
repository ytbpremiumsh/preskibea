import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/bagikan-poster/")({
  loader: () => {
    throw redirect({ to: "/bagikan-poster", replace: true });
  },
  component: () => null,
});

function PosterSelector() {
  return null;
}

function Card({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="card-block p-6 flex flex-col">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">{icon}</div>
      <h2 className="mt-3 text-xl font-bold text-foreground">{title}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground flex-1">{desc}</p>
      <Link
        to={to as any}
        className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition"
      >
        <Share2 size={14} /> Lanjut <ArrowRight size={14} />
      </Link>
    </div>
  );
}
