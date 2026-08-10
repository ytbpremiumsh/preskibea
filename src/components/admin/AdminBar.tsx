import { useEffect, useMemo, useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Shield,
  LayoutDashboard,
  Users,
  Wrench,
  Settings,
  Pencil,
  ChevronDown,
  LogOut,
  EyeOff,
  Eye,
  ExternalLink,
  Menu as MenuIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type AdminLink = { to: string; label: string };

function getContextLinks(pathname: string): { title: string; links: AdminLink[] } {
  if (pathname === "/" || pathname === "") {
    return {
      title: "Edit Halaman Utama",
      links: [
        { to: "/admin/branding", label: "Branding & Logo" },
        { to: "/admin/formulir", label: "Benefit & Info Beasiswa" },
        { to: "/admin/artikel", label: "Artikel" },
        { to: "/admin/bagikan-poster", label: "Bagikan Poster" },
        { to: "/admin/donasi", label: "Transaksi Mayar" },
        
      ],
    };
  }
  if (pathname.startsWith("/beasiswa-")) {
    return {
      title: "Edit Halaman Beasiswa",
      links: [
        { to: "/admin/formulir", label: "Formulir Pendaftaran" },
        { to: "/admin/berkas", label: "Berkas & Ketentuan" },
        { to: "/admin/branding", label: "Branding" },
      ],
    };
  }
  if (pathname.startsWith("/berkas")) {
    return {
      title: "Edit Berkas",
      links: [
        { to: "/admin/berkas", label: "Berkas Builder" },
        { to: "/admin/formulir", label: "Formulir" },
        { to: "/admin/pendaftar", label: "Pendaftar" },
      ],
    };
  }
  if (pathname.startsWith("/bagikan-poster")) {
    return {
      title: "Edit Bagikan Poster",
      links: [
        { to: "/admin/bagikan-poster", label: "Pengaturan Poster" },
        { to: "/admin/ai-balasan", label: "Balasan AI WhatsApp" },
      ],
    };
  }
  if (pathname.startsWith("/artikel")) {
    return {
      title: "Edit Artikel",
      links: [
        { to: "/admin/artikel", label: "Kelola Artikel" },
        { to: "/admin/media", label: "Media" },
      ],
    };
  }
  if (pathname.startsWith("/daftar") || pathname.startsWith("/pendaftaran")) {
    return {
      title: "Edit Pendaftaran",
      links: [
        { to: "/admin/formulir", label: "Formulir" },
        { to: "/admin/pendaftar", label: "Daftar Pendaftar" },
      ],
    };
  }
  if (pathname.startsWith("/tentang")) {
    return {
      title: "Edit Tentang",
      links: [
        { to: "/admin/branding", label: "Branding" },
        { to: "/admin/pengaturan", label: "Pengaturan Umum" },
      ],
    };
  }
  return {
    title: "Edit Konten",
    links: [
      { to: "/admin", label: "Dashboard" },
      { to: "/admin/pengaturan", label: "Pengaturan" },
      { to: "/admin/branding", label: "Branding" },
    ],
  };
}

const STORAGE_KEY = "kp_admin_bar_hidden";

export function AdminBar() {
  const { loading, isAdmin, email } = useIsAdmin();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [maintenance, setMaintenance] = useState<boolean>(false);
  const [hidden, setHidden] = useState<boolean>(false);

  // Hide on admin/login routes
  const onAdminArea =
    pathname.startsWith("/admin") || pathname.startsWith("/login");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHidden(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "maintenance")
        .maybeSingle();
      if (!active) return;
      const v = (data?.value as { enabled?: boolean }) || {};
      setMaintenance(!!v.enabled);
    };
    if (isAdmin) load();

    const channel = supabase
      .channel("admin_bar_maintenance")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "site_settings",
          filter: "key=eq.maintenance",
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as
            | { value: { enabled?: boolean } }
            | null;
          setMaintenance(!!row?.value?.enabled);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const ctx = useMemo(() => getContextLinks(pathname), [pathname]);

  if (loading || !isAdmin || onAdminArea) return null;

  const toggleHidden = (v: boolean) => {
    setHidden(v);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Anda telah keluar");
    navigate({ to: "/login" });
  };

  if (hidden) {
    return (
      <button
        type="button"
        onClick={() => toggleHidden(false)}
        className="fixed left-3 top-3 z-[60] inline-flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow-lg backdrop-blur transition hover:bg-accent"
        aria-label="Tampilkan Admin Bar"
      >
        <Eye className="h-3.5 w-3.5" /> Admin
      </button>
    );
  }

  return (
    <>
      {/* Spacer so page content isn't covered */}
      <div aria-hidden className="h-10" />
      <div className="fixed inset-x-0 top-0 z-[60] h-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-full w-full max-w-[1600px] items-center gap-2 px-3 text-xs">
          {/* Brand */}
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 font-semibold text-foreground"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Shield className="h-3.5 w-3.5" />
            </span>
            <span className="hidden sm:inline">PK Admin</span>
          </Link>

          {/* Status badge */}
          <span
            className={cn(
              "ml-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              maintenance
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                maintenance ? "bg-amber-500" : "bg-emerald-500",
              )}
            />
            {maintenance ? "Maintenance" : "Live"}
          </span>

          {/* Desktop menu */}
          <div className="ml-2 hidden items-center gap-1 md:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {ctx.title}
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>{ctx.title}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ctx.links.map((l) => (
                  <DropdownMenuItem key={l.to} asChild>
                    <Link to={l.to}>{l.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
            >
              <Link to="/admin">
                <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
            >
              <Link to="/admin/pendaftar">
                <Users className="h-3.5 w-3.5" /> Pendaftar
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 gap-1 px-2 text-xs",
                maintenance && "text-amber-600 dark:text-amber-400",
              )}
            >
              <Link to="/admin/maintenance">
                <Wrench className="h-3.5 w-3.5" /> Maintenance
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
            >
              <Link to="/admin/pengaturan">
                <Settings className="h-3.5 w-3.5" /> Pengaturan
              </Link>
            </Button>
          </div>

          {/* Mobile sheet */}
          <div className="ml-2 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
                  <MenuIcon className="h-3.5 w-3.5" /> Menu
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="pt-10">
                <SheetHeader>
                  <SheetTitle>Menu Admin</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {ctx.title}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {ctx.links.map((l) => (
                        <Button
                          key={l.to}
                          asChild
                          variant="outline"
                          size="sm"
                          className="justify-start"
                        >
                          <Link to={l.to}>
                            <Pencil className="mr-1.5 h-3.5 w-3.5" /> {l.label}
                          </Link>
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Pintasan
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button asChild variant="outline" size="sm" className="justify-start">
                        <Link to="/admin">
                          <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" /> Dashboard
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="justify-start">
                        <Link to="/admin/pendaftar">
                          <Users className="mr-1.5 h-3.5 w-3.5" /> Pendaftar
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="justify-start">
                        <Link to="/admin/maintenance">
                          <Wrench className="mr-1.5 h-3.5 w-3.5" /> Maintenance
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="justify-start">
                        <Link to="/admin/pengaturan">
                          <Settings className="mr-1.5 h-3.5 w-3.5" /> Pengaturan
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full"
                  >
                    <LogOut className="mr-1.5 h-3.5 w-3.5" /> Keluar
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex-1" />

          {/* Right side */}
          <span className="hidden max-w-[180px] truncate text-muted-foreground lg:inline">
            {email}
          </span>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            title="Buka di tab baru"
          >
            <a href="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => toggleHidden(true)}
            title="Sembunyikan Admin Bar"
          >
            <EyeOff className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hidden h-7 gap-1 px-2 text-xs md:inline-flex"
            onClick={handleLogout}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Keluar</span>
          </Button>
        </div>
      </div>
    </>
  );
}
