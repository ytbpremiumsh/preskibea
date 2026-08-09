import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type Performance = { lite_mode?: boolean; disable_ads?: boolean; disable_animations?: boolean };

export function CustomCodeInjector() {
  useEffect(() => {
    let active = true;
    const apply = (perf: Performance | null) => {
      if (!active) return;
      
      // Performance / Lite mode
      const lite = !!(perf?.lite_mode || perf?.disable_animations);
      document.documentElement.classList.toggle("lite-mode", lite);
      if (perf?.disable_ads) {
        document.documentElement.setAttribute("data-disable-ads", "1");
      } else {
        document.documentElement.removeAttribute("data-disable-ads");
      }
    };

    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key,value")
        .eq("key", "performance")
        .maybeSingle();
      
      if (data) apply(data.value as Performance);
    })();

    // Realtime updates from admin
    const channel = supabase
      .channel("custom_perf")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings" },
        (payload) => {
          const row = (payload.new ?? payload.old) as { key: string; value: unknown } | null;
          if (!row || row.key !== "performance") return;
          apply(row.value as Performance);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
