import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Server, CheckCircle2, RefreshCcw, Rocket, Layers } from "lucide-react";
import { CodeBlock, PageHeader, Step } from "@/components/admin/InstallDocs";

export const Route = createFileRoute("/admin/instalasi/vps")({
  component: VpsInstallPage,
});

function VpsInstallPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        icon={Server}
        badge="VPS · aaPanel · Nginx"
        title="Instalasi di VPS (aaPanel & Standar)"
        desc="Deploy Prestasi Kita ke VPS Linux melalui aaPanel atau instalasi standar. Build hasilnya dipublikasikan sebagai static site di webroot Nginx."
      />

      {/* Arsitektur */}
      <Card className="rounded-2xl p-6">
        <h2 className="mb-2 text-lg font-semibold text-foreground flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" /> Alur Singkat
        </h2>
        <CodeBlock
          code={`Source code: /var/www/prestasikita  (git clone)
    └── npm run build  →  ./dist/

Web publik:  /www/wwwroot/prestasikita.com  (webroot Nginx / aaPanel)
    └── isi: assets/, index.html, favicon.ico, dll.`}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Repository disimpan terpisah dari webroot. Hasil <code className="rounded bg-muted px-1">dist/</code>
          {" "}disalin ke webroot setiap kali deploy.
        </p>
      </Card>

      {/* Langkah Install */}
      <Card className="rounded-2xl p-6 md:p-8">
        <div className="space-y-8">
          <Step n={1} title="Prasyarat">
            <ul className="list-disc space-y-1 pl-5">
              <li>VPS Ubuntu 20.04+ / Debian 11+ dengan akses <strong>root / sudo</strong></li>
              <li>aaPanel terpasang (atau Nginx + Git manual)</li>
              <li>Node.js <strong>20+</strong> dan npm (install via aaPanel App Store atau NodeSource)</li>
              <li>Domain <code className="rounded bg-muted px-1">prestasikita.com</code> sudah point ke IP VPS</li>
              <li>Webroot site di aaPanel: <code className="rounded bg-muted px-1">/www/wwwroot/prestasikita.com</code></li>
            </ul>
          </Step>

          <Step n={2} title="Clone Repository ke /var/www/kejarprestasi">
            <CodeBlock
              code={`sudo mkdir -p /var/www
cd /var/www
sudo git clone -b main <REPO_URL> prestasikita
cd /var/www/prestasikita`}
            />
            <p className="text-xs text-muted-foreground">
              Ganti <code className="rounded bg-muted px-1">&lt;REPO_URL&gt;</code> dengan URL GitHub project Anda.
            </p>
          </Step>

          <Step n={3} title="Isi File .env">
            <CodeBlock code={`sudo nano /var/www/prestasikita/.env`} />
            <p>Minimum yang harus ada:</p>
            <CodeBlock
              code={`VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOi...
VITE_SUPABASE_PROJECT_ID=xxxxx`}
            />
          </Step>

          <Step n={4} title="Install Dependency & Build">
            <CodeBlock
              code={`cd /var/www/kejarprestasi
npm install --legacy-peer-deps
npm run build`}
            />
            <p className="text-xs text-muted-foreground">
              Hasil build akan tersedia di folder <code className="rounded bg-muted px-1">dist/</code>.
            </p>
          </Step>

          <Step n={5} title="Publikasikan ke Webroot Nginx / aaPanel">
            <CodeBlock
              code={`rm -rf /www/wwwroot/kejarprestasi.id/*
cp -r dist/* /www/wwwroot/kejarprestasi.id/
chown -R www:www /www/wwwroot/kejarprestasi.id
nginx -s reload`}
            />
            <p className="text-xs text-muted-foreground">
              Owner <code className="rounded bg-muted px-1">www:www</code> adalah user default aaPanel.
              Pada Nginx non-aaPanel gunakan <code className="rounded bg-muted px-1">www-data:www-data</code>.
            </p>
          </Step>

          <Step n={6} title="Konfigurasi Nginx (SPA fallback)">
            <p>Di aaPanel: <em>Website → Settings → Config File</em>, tambahkan dalam blok <code>server</code>:</p>
            <CodeBlock
              code={`root /www/wwwroot/prestasikita.com;
index index.html;

# SPA fallback untuk TanStack Router
location / {
  try_files $uri $uri/ /index.html;
}

# Cache aset statis 1 tahun
location ~* \\.(?:css|js|woff2?|ttf|otf|eot|ico|svg|png|jpg|jpeg|gif|webp|avif)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
  access_log off;
}`}
            />
            <p className="text-xs text-muted-foreground">
              Simpan, lalu jalankan <code className="rounded bg-muted px-1">nginx -t &amp;&amp; nginx -s reload</code>.
            </p>
          </Step>

          <Step n={7} title="HTTPS (SSL)">
            <p>aaPanel: <em>Website → SSL → Let's Encrypt → Apply</em>.</p>
            <p>Atau manual via certbot:</p>
            <CodeBlock
              code={`sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d prestasikita.com -d www.prestasikita.com`}
            />
          </Step>

          <Step n={8} title="Verifikasi">
            <CodeBlock
              code={`# 1. Webroot terisi
ls /www/wwwroot/prestasikita.com
# → assets/  index.html  favicon.ico  ...

# 2. Nginx OK
nginx -t

# 3. Site respond 200 OK
curl -I https://prestasikita.com`}
            />
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-foreground">
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-medium">Hasil yang benar:</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
                    <li><code>curl -I https://prestasikita.com</code> → <code>HTTP/2 200</code></li>
                    <li>Webroot berisi <code>assets/</code>, <code>index.html</code>, <code>favicon.ico</code></li>
                  </ul>
                </div>
              </div>
            </div>
          </Step>
        </div>
      </Card>

      {/* Update / Deploy ulang */}
      <Card className="rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <RefreshCcw className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Update / Deploy Ulang</h2>
            <p className="text-xs text-muted-foreground">
              Jalankan perintah ini setiap kali ada perubahan kode dari GitHub.
            </p>
          </div>
        </div>

        <CodeBlock
          code={`cd /var/www/prestasikita

git pull origin main

npm install --legacy-peer-deps

npm run build

rm -rf /www/wwwroot/prestasikita.com/*

cp -r dist/* /www/wwwroot/prestasikita.com/

chown -R www:www /www/wwwroot/prestasikita.com

nginx -s reload`}
        />

        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-foreground">
          <div className="flex gap-2">
            <Rocket className="h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Opsional — simpan jadi script <code>deploy.sh</code>:</p>
              <p className="mt-1 text-muted-foreground">
                Buat file <code className="rounded bg-muted px-1">/var/www/prestasikita/deploy.sh</code>{" "}
                dengan isi perintah di atas, lalu chmod +x. Cukup jalankan{" "}
                <code className="rounded bg-muted px-1">bash deploy.sh</code> setiap update.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Troubleshooting */}
      <Card className="rounded-2xl p-6">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Troubleshooting</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                <th className="py-2 pr-4">Gejala</th>
                <th className="py-2 pr-4">Penyebab</th>
                <th className="py-2">Solusi</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b">
                <td className="py-2 pr-4">404 saat refresh di halaman dalam</td>
                <td className="py-2 pr-4">SPA fallback belum dipasang</td>
                <td className="py-2">Tambahkan <code>try_files $uri /index.html</code> di Nginx</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">403 Forbidden</td>
                <td className="py-2 pr-4">Permission webroot salah</td>
                <td className="py-2"><code>chown -R www:www /www/wwwroot/prestasikita.com</code></td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4"><code>npm run build</code> gagal / OOM</td>
                <td className="py-2 pr-4">RAM VPS terbatas</td>
                <td className="py-2"><code>NODE_OPTIONS=--max-old-space-size=2048 npm run build</code></td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Halaman blank / asset 404</td>
                <td className="py-2 pr-4">Cache lama / file <code>dist</code> belum tersalin</td>
                <td className="py-2">Ulangi langkah 5, lalu hard refresh (Ctrl+Shift+R)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Perubahan tidak muncul</td>
                <td className="py-2 pr-4">Nginx cache / browser cache</td>
                <td className="py-2"><code>nginx -s reload</code> &amp; clear cache aaPanel</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
