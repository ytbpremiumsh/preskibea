import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  FileEdit,
  FileText,
  FolderArchive,
  Settings,
  Megaphone,
  Code2,
  MessageCircle,
  Bot,
  ShieldCheck,
  ChevronRight,
  Trophy,
  Heart,
  Server,
  Globe,
  BarChart3,
  Share2,
  Image as ImageIcon,
  Mail,
  HardDrive,
  Rocket,
  Wrench,
  CreditCard,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type Item = { title: string; url: string; icon: React.ComponentType<{ className?: string }> };

const groups: { label: string; items: Item[] }[] = [
  {
    label: "Dashboard",
    items: [
      { title: "Ringkasan", url: "/admin", icon: LayoutDashboard },
      { title: "Google Analytics", url: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Pendaftaran",
    items: [
      { title: "Pendaftar", url: "/admin/pendaftar", icon: Users },
      { title: "Pengiriman Berkas", url: "/admin/berkas", icon: FolderArchive },
      { title: "Kandidat Lolos", url: "/admin/kandidat", icon: Trophy },
    ],
  },
  {
    label: "Konten & Formulir",
    items: [
      { title: "Artikel", url: "/admin/artikel", icon: FileText },
      { title: "Formulir", url: "/admin/formulir", icon: FileEdit },
      { title: "Bagikan Poster", url: "/admin/bagikan-poster", icon: Share2 },
      { title: "Media & File", url: "/admin/media", icon: HardDrive },
    ],
  },
  {
    label: "Komunikasi",
    items: [
      { title: "WhatsApp", url: "/admin/whatsapp", icon: MessageCircle },
      { title: "Balasan AI", url: "/admin/ai-balasan", icon: Bot },
    ],
  },
  {
    label: "Integrasi & Pengaturan",
    items: [
      { title: "Pengaturan Situs", url: "/admin/pengaturan", icon: Settings },
      { title: "Integrasi Mayar", url: "/admin/donasi", icon: CreditCard },
      { title: "Logo Situs", url: "/admin/branding", icon: ImageIcon },
      { title: "Template Email", url: "/admin/email-template", icon: Mail },
      { title: "Keamanan (2FA)", url: "/admin/keamanan", icon: ShieldCheck },
      { title: "AdSense", url: "/admin/adsense", icon: Megaphone },
      { title: "Iklan Kustom", url: "/admin/iklan-kustom", icon: Megaphone },
      { title: "Kode & Performa", url: "/admin/kode-kustom", icon: Code2 },
    ],
  },
  {
    label: "Sistem",
    items: [
      { title: "Sistem Update", url: "/admin/sistem-update", icon: Rocket },
      { title: "Mode Maintenance", url: "/admin/maintenance", icon: Wrench },
    ],
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (url: string) =>
    url === "/admin" ? currentPath === "/admin" : currentPath.startsWith(url);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/60">
      <SidebarHeader className="border-b border-sidebar-border/60 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/30 ring-1 ring-primary/20">
            <ShieldCheck className="h-5 w-5" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight text-sidebar-foreground">
                Admin Panel
              </p>
              <p className="text-[11px] font-medium text-sidebar-foreground/60">
                Prestasi Kita
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {groups.map((g, gi) => (
          <SidebarGroup key={g.label} className={cn(gi > 0 && "mt-1")}>
            {!collapsed && (
              <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {g.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {g.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        className={cn(
                          "group/btn relative h-10 rounded-lg px-2.5 font-medium transition-all duration-200",
                          "hover:bg-sidebar-accent/70 hover:translate-x-0.5",
                          active &&
                            "bg-gradient-to-r from-primary to-primary/85 text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary hover:from-primary hover:to-primary/85 hover:text-primary-foreground hover:translate-x-0",
                        )}
                      >
                        <Link to={item.url} className="flex w-full items-center gap-3">
                          {active && !collapsed && (
                            <span className="absolute left-0 top-1/2 h-5 -translate-y-1/2 w-1 rounded-r-full bg-primary-foreground/90" />
                          )}
                          <span
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
                              active
                                ? "bg-primary-foreground/15 text-primary-foreground"
                                : "bg-sidebar-accent/40 text-sidebar-foreground/70 group-hover/btn:bg-sidebar-accent group-hover/btn:text-sidebar-foreground",
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                          </span>
                          {!collapsed && (
                            <>
                              <span className="flex-1 text-sm">{item.title}</span>
                              <ChevronRight
                                className={cn(
                                  "h-3.5 w-3.5 opacity-0 transition-all duration-200 -translate-x-1",
                                  active
                                    ? "opacity-100 translate-x-0 text-primary-foreground/80"
                                    : "group-hover/btn:opacity-60 group-hover/btn:translate-x-0",
                                )}
                              />
                            </>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
