import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { useBranding } from "@/hooks/use-branding";

const nav = [
  { to: "/", label: "Beranda" },
  { to: "/artikel", label: "Artikel" },
  { to: "/tentang", label: "Tentang" },
  { to: "/cek-status", label: "Cek Status" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { headerLogo } = useBranding();

  const goToTimeline = async () => {
    setOpen(false);
    if (window.location.pathname !== "/") {
      await navigate({ to: "/" });
    }
    setTimeout(() => {
      const el = document.getElementById("timeline");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="container-page flex h-[72px] items-center justify-between gap-4">
        <Link to="/" className="flex shrink-0 items-center" aria-label="Prestasi Kita">
          <img src={headerLogo} alt="Logo Prestasi Kita" className="h-9 w-auto md:h-10" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1 rounded-full border border-border bg-secondary/60 p-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "bg-card text-primary shadow-card" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Link
            to="/cek-status"
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-foreground/80 transition hover:text-primary"
          >
            Cek Status
          </Link>
          <button
            type="button"
            onClick={goToTimeline}
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition hover:opacity-95"
          >
            Daftar Sekarang
            <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
          </button>
        </div>

        <button
          aria-label="Toggle menu"
          className="lg:hidden rounded-xl border border-border p-2 text-foreground"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <div className="container-page py-4 flex flex-col gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground/80 hover:bg-secondary"
              >
                {n.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={goToTimeline}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
            >
              Daftar Sekarang <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
