import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, Server, Globe, Terminal, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Disalin");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Gagal menyalin");
    }
  };
  return (
    <div className="relative group">
      <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed font-mono text-foreground">
        <code>{code}</code>
      </pre>
      <Button
        size="sm"
        variant="secondary"
        onClick={copy}
        className="absolute right-2 top-2 h-7 gap-1 px-2 text-xs opacity-0 transition group-hover:opacity-100"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        <span className="sr-only">{lang}</span>
      </Button>
    </div>
  );
}

export function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative pl-12">
      <span className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-4 ring-background">
        {n}
      </span>
      <h3 className="mb-2 text-base font-semibold text-foreground">{title}</h3>
      <div className="space-y-3 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

export function PageHeader({
  icon: Icon,
  title,
  desc,
  badge,
  tone = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  badge: string;
  tone?: "primary" | "gold";
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-6 md:p-8",
        tone === "primary"
          ? "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent"
          : "bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent",
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl shadow-lg",
            tone === "primary"
              ? "bg-primary text-primary-foreground shadow-primary/30"
              : "bg-amber-500 text-white shadow-amber-500/30",
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <Badge variant="secondary" className="mb-2">
            {badge}
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
    </div>
  );
}

export function UpdateSection() {
  return (
    <Card className="rounded-2xl p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
          <RefreshCcw className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Update dari GitHub</h2>
          <p className="text-xs text-muted-foreground">
            Tarik perubahan terbaru, build ulang, lalu publikasikan ke webroot Nginx.
          </p>
        </div>
      </div>

      <div className="space-y-4 text-sm">
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

        <div>
          <p className="mb-2 font-medium text-foreground">Opsional — jadwalkan auto-update tiap malam (cron):</p>
          <CodeBlock
            code={`sudo crontab -e
# Tambahkan baris berikut:
0 3 * * * cd /var/www/prestasikita && bash deploy.sh >> /var/log/prestasikita-update.log 2>&1`}
          />
        </div>
      </div>
    </Card>
  );
}


export const Icons = { Server, Globe, Terminal };
