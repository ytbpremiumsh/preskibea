import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/logo-prestasi-kita-atskolla.png";

const defaultLogo = logoAsset;



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
  home_widgets?: {
    widget1?: string;
    widget2?: string;
    widget3?: string;
  };
  article_widgets?: {
    top?: string;
    bottom?: string;
  };
  category_widgets?: {
    top?: string;
    above_button?: string;
    bottom?: string;
  };
  global_widgets?: {
    top?: string;
    bottom?: string;
  };
  registration_widgets?: {
    top?: string;
    bottom?: string;
  };
  berkas_widgets?: {
    top?: string;
    bottom?: string;
  };
  poster_widgets?: {
    top?: string;
    bottom?: string;
  };
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
    homeWidgets: branding.home_widgets || {},
    articleWidgets: branding.article_widgets || {},
    categoryWidgets: branding.category_widgets || {},
    globalWidgets: branding.global_widgets || {},
    registrationWidgets: branding.registration_widgets || {},
    berkasWidgets: branding.berkas_widgets || {},
    posterWidgets: branding.poster_widgets || {},
  };
}
