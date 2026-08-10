import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  Search, 
  RotateCcw, 
  CreditCard, 
  ExternalLink, 
  Calendar,
  Settings,
  Webhook,
  Key,
  Copy,
  Save
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/donasi")({
  component: AdminDonasi,
});

type Transaction = {
  id: string;
  registration_id: string;
  amount: number;
  status: string;
  payment_url: string;
  created_at: string;
  registrations: {
    full_name: string;
    email: string;
    token: string;
    kind: string;
  };
};

function AdminDonasi() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [mayarApiKey, setMayarApiKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  const load = async () => {
    setLoading(true);
    // Load transactions
    const { data, error } = await supabase
      .from("payments" as any)
      .select("*, registrations(full_name, email, token, kind)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Gagal memuat data transaksi");
    } else {
      setTransactions((data as any) || []);
    }

    // Load Mayar API Key from site_settings
    const { data: settings } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "mayar_config")
      .single();
    
    if (settings?.value) {
      const config = settings.value as { api_key?: string };
      setMayarApiKey(config.api_key || "");
    }

    // Set Webhook URL
    const baseUrl = window.location.origin.includes("localhost") 
      ? "https://ltmfvbcazebowndigkyi.supabase.co" 
      : `${window.location.origin.replace(".lovable.app", ".lovable.app")}`;
    
    // In production, we usually want the Supabase edge function URL directly
    setWebhookUrl("https://ltmfvbcazebowndigkyi.supabase.co/functions/v1/mayar-webhook");

    setLoading(false);
  };

  const saveConfig = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ 
        key: "mayar_config", 
        value: { api_key: mayarApiKey } 
      }, { onConflict: "key" });

    if (error) {
      toast.error("Gagal menyimpan API Key");
    } else {
      toast.success("Konfigurasi Mayar berhasil disimpan");
    }
    setSaving(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = transactions.filter((t) => {
    const s = q.toLowerCase();
    return (
      t.registrations?.full_name?.toLowerCase().includes(s) ||
      t.registrations?.email?.toLowerCase().includes(s) ||
      t.registrations?.token?.toLowerCase().includes(s) ||
      t.status.toLowerCase().includes(s)
    );
  });

  const stats = {
    total: transactions.length,
    success: transactions.filter(t => t.status === 'success' || t.status === 'paid').length,
    pending: transactions.filter(t => t.status === 'pending').length,
    totalAmount: transactions
      .filter(t => t.status === 'success' || t.status === 'paid')
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Integrasi Mayar</h1>
          <p className="text-sm text-muted-foreground">
            Monitoring pembayaran Fast Track dan Donasi melalui Mayar.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RotateCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Transaksi" value={stats.total} />
        <StatCard label="Berhasil" value={stats.success} color="text-emerald-600" />
        <StatCard label="Pending" value={stats.pending} color="text-amber-600" />
        <StatCard 
          label="Total Pendapatan" 
          value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(stats.totalAmount)} 
        />
      </div>

      <Card className="p-4 shadow-soft">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, email, token..."
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </Card>

      <Card className="shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            Tidak ada data transaksi ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">Peserta</th>
                  <th className="px-4 py-3">Token</th>
                  <th className="px-4 py-3">Nominal</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{t.registrations?.full_name}</div>
                      <div className="text-xs text-muted-foreground">{t.registrations?.email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{t.registrations?.token}</td>
                    <td className="px-4 py-3 font-semibold">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(t.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge 
                        variant="outline" 
                        className={
                          t.status === 'success' || t.status === 'paid' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : t.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }
                      >
                        {t.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {new Date(t.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {t.payment_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={t.payment_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink size={14} className="mr-1" /> Link
                          </a>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <Card className="p-4 shadow-soft">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color || 'text-foreground'}`}>{value}</div>
    </Card>
  );
}
