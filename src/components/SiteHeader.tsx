import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
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
    // Defer to next tick so the section is mounted before scrolling
    setTimeout(() => {
      const el = document.getElementById("timeline");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center" aria-label="Prestasi Kita x Atskolla">
          <img src={headerLogo} alt="Logo Prestasi Kita x Atskolla" className="h-10 w-auto" />
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <button
            type="button"
            onClick={goToTimeline}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition"
          >
            Daftar Sekarang
          </button>
        </div>

        <button
          aria-label="Toggle menu"
          className="lg:hidden rounded-md p-2 text-foreground"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <div className="container-page py-4 flex flex-col gap-3">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="text-sm font-medium py-2 text-foreground/80"
              >
                {n.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={goToTimeline}
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Daftar Sekarang
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
