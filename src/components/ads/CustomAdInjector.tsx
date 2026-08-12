import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type CustomAds = {
  enabled: boolean;
  default_code: string;
  header_html: string;
  footer_html: string;
};

const MARK = "data-custom-ad-injection";

function extractPublisherId(html: string) {
  return html.match(/(?:client=|data-ad-client=["'])(ca-pub-[0-9]+)/)?.[1] || "";
}

function ensureAdSenseScript(htmlSnippets: string[]) {
  if (typeof document === "undefined") return;
  const client = htmlSnippets.map(extractPublisherId).find(Boolean);
  if (!client) return;
  if (
    document.querySelector(
      `script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`,
    )
  ) {
    return;
  }
  const script = document.createElement("script");
  script.id = "adsense-script";
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
  document.head.appendChild(script);
}

function isManagedAdSenseScript(script: HTMLScriptElement) {
  const src = script.getAttribute("src") || "";
  const text = script.textContent || "";
  return (
    src.includes("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js") ||
    /adsbygoogle\s*=|adsbygoogle\.push|\.push\s*\(\s*\{\s*\}\s*\)/.test(text)
  );
}

function inject(target: HTMLElement, html: string, where: "prepend" | "append") {
  if (!html?.trim()) return;
  const wrapper = document.createElement("div");
  wrapper.setAttribute(MARK, "1");
  wrapper.className = "custom-ad-block my-6 w-full flex justify-center items-center overflow-visible text-center clear-both";
  wrapper.style.width = "100%";
  wrapper.style.minWidth = "250px";
  wrapper.style.minHeight = "90px";
  wrapper.style.display = "flex";
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  Array.from(tpl.content.childNodes).forEach((node) => {
    if (node.nodeType === 1 && (node as HTMLElement).tagName === "SCRIPT") {
      const orig = node as HTMLScriptElement;
      if (isManagedAdSenseScript(orig)) return;
      const s = document.createElement("script");
      for (const a of Array.from(orig.attributes)) s.setAttribute(a.name, a.value);
      s.text = orig.textContent || "";
      wrapper.appendChild(s);
    } else {
      wrapper.appendChild(node.cloneNode(true));
    }
  });
  if (where === "prepend") target.prepend(wrapper);
  else target.append(wrapper);
}

function clearOld() {
  document.querySelectorAll(`[${MARK}]`).forEach((n) => n.remove());
}

function pushAdsbygoogle() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  const ins = document.querySelectorAll<HTMLElement>(
    `[${MARK}] ins.adsbygoogle:not([data-ad-pushed])`,
  );
  if (!ins.length) return;
  w.adsbygoogle = w.adsbygoogle || [];
  ins.forEach((el) => {
    el.style.display = "block";
    el.style.width = "100%";
    el.style.minWidth = "250px";
    el.style.minHeight = "50px";
    el.style.overflow = "visible";
    el.style.margin = "0 auto";
    el.style.clear = "both";
    const tryPush = (attempt = 0) => {
      if (el.getAttribute("data-ad-pushed") === "1") return;
      if (el.offsetWidth < 1) {
        if (attempt < 8) window.setTimeout(() => tryPush(attempt + 1), 250);
        return;
      }
      try {
        el.setAttribute("data-ad-pushed", "1");
        w.adsbygoogle.push({});
      } catch (error) {
        el.removeAttribute("data-ad-pushed");
        console.warn("[custom-ads] push failed", error);
      }
    };
    tryPush();
  });
}

export function CustomAdInjector() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [cfg, setCfg] = useState<CustomAds | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "custom_ads")
        .maybeSingle();
      if (!active) return;
      setCfg((data?.value as CustomAds) || null);
    };
    load();
    const ch = supabase
      .channel("custom_ads_rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings", filter: "key=eq.custom_ads" },
        (payload) => {
          const row = (payload.new ?? payload.old) as { value: unknown } | null;
          setCfg((row?.value as CustomAds) || null);
        },
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, []);

  useEffect(() => {
    clearOld();
    if (!cfg?.enabled) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/login")) return;
    ensureAdSenseScript([cfg.default_code, cfg.header_html, cfg.footer_html]);

    let attempts = 0;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      attempts++;
      const main = document.querySelector("main") as HTMLElement | null;
      if (!main && attempts < 20) {
        window.setTimeout(run, 200);
        return;
      }
      clearOld();
      if (main) {
        inject(main, cfg.header_html, "prepend");
        inject(main, cfg.footer_html, "append");
      }
      // default_code injected once at top of main as well
      if (main && cfg.default_code?.trim()) {
        inject(main, cfg.default_code, "append");
      }
      window.setTimeout(pushAdsbygoogle, 100);
      window.setTimeout(pushAdsbygoogle, 700);
    };
    const t = window.setTimeout(run, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [pathname, cfg]);

  return null;
}
