import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AdSenseConfig = {
  enabled: boolean;
  publisher_id: string;
  ads_txt: string;
  /** Kode custom yang disuntikkan ke <head> di semua halaman publik */
  header_code?: string;
  /** Kode custom yang disuntikkan sebelum </body> di semua halaman publik */
  footer_code?: string;
};

export type AdPosition =
  | "top_of_page"
  | "bottom_of_page"
  | "after_first_section"
  | "sticky_bottom"
  | "before_each_image"
  | "after_each_image"
  | "before_each_heading"
  | "after_each_heading"
  | "after_each_paragraph"
  | "between_sections"
  | "before_timeline_button"
  | "before_each_button"
  | "before_each_nav_link"
  | "after_each_nav_link"
  | "before_each_card"
  | "after_each_card";

export type AdSlotConfig = {
  id: string;
  name: string;
  /** Full ad HTML/script snippet (e.g. <ins class="adsbygoogle" .../> + <script>(adsbygoogle=...).push({})</script>) */
  code: string;
  position: AdPosition;
  /** Inject only on every Nth matching node (default 1 = every match) */
  every_nth?: number;
  /** Cap how many times this slot is injected per page (default 3) */
  max_per_page?: number;
  enabled: boolean;
  // Legacy fields (kept optional so old data still parses; ignored at runtime)
  slot_id?: string;
  placement?: string;
  format?: "auto" | "horizontal" | "rectangle" | "vertical";
};

type Ctx = {
  adsense: AdSenseConfig;
  slots: AdSlotConfig[];
  loaded: boolean;
};

const AdSettingsContext = createContext<Ctx>({
  adsense: { enabled: false, publisher_id: "", ads_txt: "" },
  slots: [],
  loaded: false,
});

export function AdSettingsProvider({ children }: { children: ReactNode }) {
  const [adsense, setAdsense] = useState<AdSenseConfig>({
    enabled: false,
    publisher_id: "",
    ads_txt: "",
  });
  const [slots, setSlots] = useState<AdSlotConfig[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("site_settings")
      .select("key,value")
      .in("key", ["adsense", "ad_slots"])
      .then(({ data }) => {
        if (cancelled || !data) return;
        const a = data.find((d) => d.key === "adsense")?.value as AdSenseConfig | undefined;
        const s = data.find((d) => d.key === "ad_slots")?.value as AdSlotConfig[] | undefined;
        if (a) setAdsense(a);
        if (Array.isArray(s)) setSlots(s);
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdSettingsContext.Provider value={{ adsense, slots, loaded }}>
      {children}
    </AdSettingsContext.Provider>
  );
}

export function useAdSettings() {
  return useContext(AdSettingsContext);
}

/**
 * Loads the AdSense script tag once when AdSense is enabled and a publisher ID is set.
 * Safe to mount once at the application root.
 */
export function AdsenseLoader() {
  const { adsense, loaded } = useAdSettings();

  useEffect(() => {
    if (!loaded) return;
    if (!adsense.enabled || !adsense.publisher_id) return;
    if (typeof document === "undefined") return;
    if (document.getElementById("adsense-script")) return;

    const s = document.createElement("script");
    s.id = "adsense-script";
    s.async = true;
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsense.publisher_id)}`;
    s.crossOrigin = "anonymous";
    document.head.appendChild(s);
  }, [loaded, adsense.enabled, adsense.publisher_id]);

  return null;
}
