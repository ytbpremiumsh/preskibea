import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
} from "@tanstack/react-router";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Toaster } from "@/components/ui/sonner";
import { AdSettingsProvider, AdsenseLoader } from "@/components/ads/AdSettings";
import { AutoAdInjector } from "@/components/ads/AutoAdInjector";
import { CustomAdInjector } from "@/components/ads/CustomAdInjector";
import { CustomCodeInjector } from "@/components/CustomCodeInjector";
import { AnalyticsInjector } from "@/components/AnalyticsInjector";
import { ForceReloadNavigation } from "@/components/ForceReloadNavigation";
import { MaintenanceGate } from "@/components/MaintenanceGate";
import { AdminBar } from "@/components/admin/AdminBar";
import { useBranding } from "@/hooks/use-branding";
import { RawHtmlWidget } from "@/components/ads/RawHtmlWidget";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { title: "Beasiswa Pendidikan Prestasi Kita Batch #8" },
      { name: "description", content: "Program beasiswa nasional untuk pelajar dan mahasiswa Indonesia dengan total beasiswa Rp17.000.000 per semester. Tidak dipungut biaya." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
      },
    ],
  }),

  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isBareLayout = pathname.startsWith("/admin") || pathname.startsWith("/login");
  const isPublic = !isBareLayout;
  const { globalWidgets } = useBranding();

  return (
    <QueryClientProvider client={queryClient}>
      <HeadContent />
      <AdSettingsProvider>
        {isPublic && (
          <>
            <AdsenseLoader />
            <AutoAdInjector />
            <CustomAdInjector />
          </>
        )}
        <CustomCodeInjector />
        <AnalyticsInjector />
        <ForceReloadNavigation />
        {isBareLayout ? (
          <Outlet />
        ) : (
          <MaintenanceGate>
            <AdminBar />
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              
              {/* Global Top Widget */}
              {globalWidgets.top && (
                <div className="container-page py-4 overflow-visible">
                  <RawHtmlWidget id="global-top-widget" html={globalWidgets.top} />
                </div>
              )}

              <main className="flex-1">
                <Outlet />
              </main>

              {/* Global Bottom Widget */}
              {globalWidgets.bottom && (
                <div className="container-page py-4 overflow-visible">
                  <RawHtmlWidget id="global-bottom-widget" html={globalWidgets.bottom} />
                </div>
              )}

              <SiteFooter />
            </div>
          </MaintenanceGate>
        )}
        <Toaster richColors position="top-center" />
      </AdSettingsProvider>
    </QueryClientProvider>
  );
}
