import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MaintenancePage, type MaintenanceConfig } from "./MaintenancePage";

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<MaintenanceConfig | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [{ data: settings }, { data: sess }] = await Promise.all([
        supabase.from("site_settings").select("value").eq("key", "maintenance").maybeSingle(),
        supabase.auth.getSession(),
      ]);
      if (!active) return;
      setConfig((settings?.value as MaintenanceConfig) || null);
      if (sess.session) {
        const { data: role } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", sess.session.user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (active && role) setIsAdmin(true);
      }
      setLoaded(true);
    };
    load();

    const channel = supabase
      .channel("maintenance_mode")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings", filter: "key=eq.maintenance" },
        (payload) => {
          const row = (payload.new ?? payload.old) as { value: MaintenanceConfig } | null;
          setConfig((row?.value as MaintenanceConfig) || null);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  if (!loaded) return <>{children}</>;
  if (config?.enabled && !isAdmin) return <MaintenancePage config={config} />;
  return <>{children}</>;
}
