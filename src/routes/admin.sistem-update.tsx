import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Server, AlertTriangle, Terminal } from "lucide-react";

export const Route = createFileRoute("/admin/sistem-update")({
  component: AdminSistemUpdate,
});

function AdminSistemUpdate() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sistem Update</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pembaruan sistem dari panel admin.
        </p>
      </div>

      <Card className="border-amber-300/40 bg-amber-50/40 p-6 dark:bg-amber-950/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              Fitur ini tidak tersedia di mode SPA
            </h2>
            <p className="text-sm text-muted-foreground">
              Aplikasi sekarang berjalan sebagai static SPA (Vite + React Router).
              Tidak ada Node.js runtime di server, sehingga panel ini tidak bisa
              menjalankan <code className="rounded bg-muted px-1.5 py-0.5 text-xs">git pull</code>,
              <code className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs">npm install</code>,
              atau restart proses.
            </p>
            <p className="text-sm text-muted-foreground">
              Untuk update di VPS, jalankan manual dari SSH:
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-foreground/95 p-3 text-xs text-background">
              <code>{`cd /www/wwwroot/prestasikita.com
git pull origin main
npm ci
npm run build
# salin output ke webroot
rsync -a --delete dist/ /www/wwwroot/prestasikita.com/`}</code>
            </pre>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start gap-3">
          <Server className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Saran: pakai GitHub Actions atau webhook eksternal
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Untuk auto-deploy, set up CI yang push ke server via SSH (
              <code className="rounded bg-muted px-1 py-0.5">rsync</code>) atau
              workflow GitHub Actions yang build &amp; sync ke webroot otomatis tiap
              push ke branch <code className="rounded bg-muted px-1 py-0.5">main</code>.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start gap-3">
          <Terminal className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Script deploy disediakan
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              File <code className="rounded bg-muted px-1 py-0.5">deploy/update.sh</code> di
              repo melakukan git pull + build + sync dist ke webroot. Jalankan dari
              SSH atau panggil via cron / webhook eksternal.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
