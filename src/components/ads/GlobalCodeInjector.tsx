import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useAdSettings } from "./AdSettings";

const MARK = "data-global-code";

function injectHtml(target: HTMLElement, html: string, slot: "head" | "footer") {
  if (!html?.trim()) return;
  const holder = document.createElement("div");
  holder.setAttribute(MARK, slot);
  holder.style.width = "100%";
  const tpl = document.createElement("template");
  tpl.innerHTML = html.trim();
  Array.from(tpl.content.childNodes).forEach((node) => {
    if (node.nodeType === 1 && (node as HTMLElement).tagName === "SCRIPT") {
      const orig = node as HTMLScriptElement;
      const s = document.createElement("script");
      for (const a of Array.from(orig.attributes)) s.setAttribute(a.name, a.value);
      s.text = orig.textContent || "";
      holder.appendChild(s);
    } else {
      holder.appendChild(node.cloneNode(true));
    }
  });
  target.appendChild(holder);
}

function clear(slot: "head" | "footer") {
  document.querySelectorAll(`[${MARK}="${slot}"]`).forEach((n) => n.remove());
}

/**
 * Menyuntikkan kode custom (AdSense / verifikasi / tracking) dari dashboard admin
 * ke <head> dan sebelum </body> pada semua halaman publik.
 */
export function GlobalCodeInjector() {
  const { adsense, loaded } = useAdSettings();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loaded) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/login")) return;

    clear("head");
    clear("footer");
    injectHtml(document.head, adsense.header_code || "", "head");
    injectHtml(document.body, adsense.footer_code || "", "footer");

    return () => {
      clear("head");
      clear("footer");
    };
  }, [loaded, pathname, adsense.header_code, adsense.footer_code]);

  return null;
}
