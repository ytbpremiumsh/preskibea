import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/logo-prestasi-kita.png.asset.json";

const defaultLogo = logoAsset.url;


export type BrandingSettings = {
  header_logo_url?: string;
  footer_logo_url?: string;
};

export function useBranding() {
  const [branding, setBranding] = useState<BrandingSettings>({});

  useEffect(() => {
    let active = true;

    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "branding")
        .maybeSingle();
      if (active && data?.value) setBranding(data.value as BrandingSettings);
    })();

    return () => {
      active = false;
    };
  }, []);

  return {
    headerLogo: branding.header_logo_url || defaultLogo,
    footerLogo: branding.footer_logo_url || branding.header_logo_url || defaultLogo,
  };
}
