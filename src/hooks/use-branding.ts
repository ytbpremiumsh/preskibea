import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/logo-prestasi-kita-atskolla.png.asset.json";

const defaultLogo = logoAsset.url;



export type BrandingSettings = {
  header_logo_url?: string;
  footer_logo_url?: string;
  hero_image_url?: string;
  benefit_image_url?: string;
  poster_image_url?: string;
  category_images?: {
    prestasi?: string;
    ekonomi?: string;
    umum?: string;
    yatim?: string;
  };
  alumni_images?: string[];
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
    heroImage: branding.hero_image_url || null,
    benefitImage: branding.benefit_image_url || null,
    posterImage: branding.poster_image_url || null,
    categoryImages: branding.category_images || {},
    alumniImages: branding.alumni_images || [],
  };
}
