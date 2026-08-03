import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Globe, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/admin/InstallDocs";

export const Route = createFileRoute("/admin/instalasi/hosting")({
  component: HostingInstallPage,
});

function HostingInstallPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        icon={Globe}
        tone="gold"
        badge="Shared Hosting / cPanel"
        title="Tidak Didukung untuk Versi Ini"
        desc="Aplikasi Prestasi Kita (TanStack Start SSR) tidak bisa dijalankan di shared hosting cPanel standar."
      />

      <Card className="rounded-2xl border-amber-500/40 bg-amber-500/5 p-6">
        <div className="flex gap-3 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="space-y-3 text-foreground">
            <p className="font-semibold">Kenapa cPanel tidak cocok?</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                Build menghasilkan <code className="rounded bg-muted px-1">dist/server/server.node.js</code>{" "}
                (custom Node entry), bukan <code className="rounded bg-muted px-1">.output/server/index.mjs</code>{" "}
                yang biasa diharapkan "Setup Node.js App" cPanel.
              </li>
              <li>
                Membutuhkan <strong>PM2 cluster mode</strong> + <strong>Nginx reverse proxy</strong> dengan
                config khusus untuk static <code>/assets/</code> alias — tidak ada akses sudo di shared hosting.
              </li>
              <li>
                Butuh akses penuh ke <code className="rounded bg-muted px-1">process.env</code>,
                long-running websocket/SSE, dan port arbitrary (3000) yang tidak dijamin di shared hosting.
              </li>
              <li>
                Memory footprint Node SSR cluster &gt; 512 MB; quota shared hosting umumnya lebih kecil.
              </li>
            </ul>

            <p className="font-semibold mt-4">Solusi: gunakan VPS</p>
            <p className="text-muted-foreground">
              VPS murah (DigitalOcean, Vultr, Contabo, Biznet Gio, IDCloudHost ~Rp 50–80rb/bulan)
              sudah lebih dari cukup. Panduan lengkap:
            </p>
            <Link
              to="/admin/instalasi/vps"
              className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Lihat Panduan VPS →
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
