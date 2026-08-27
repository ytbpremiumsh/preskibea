import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useAdSettings } from "./AdSettings";

const MARK = "data-global-code";

const HEAD_ONLY = new Set(["META", "LINK", "TITLE", "BASE"]);

function runScript(orig: HTMLScriptElement, target: HTMLElement) {
  const s = document.createElement("script");
  for (const a of Array.from(orig.attributes)) s.setAttribute(a.name, a.value);
  s.text = orig.textContent || "";
  s.setAttribute(MARK, target === document.head ? "head" : "footer");
  target.appendChild(s);
}

/**
 * Menyuntikkan kode custom dari dashboard admin.
 * - <script>, <style>, <meta>, <link> => <head> (agar dieksekusi/berlaku global)
 * - markup terlihat (div/ins/img/iframe dll) => body, supaya benar-benar tampil.
 */
function injectHtml(html: string, slot: "head" | "footer") {
  if (!html?.trim()) return;

  const visible = document.createElement("div");
  visible.setAttribute(MARK, slot);
  visible.className = "global-ad-block w-full";

  const tpl = document.createElement("template");
  tpl.innerHTML = html.trim();

  Array.from(tpl.content.childNodes).forEach((node) => {
    if (node.nodeType === 1) {
      const el = node as HTMLElement;
      if (el.tagName === "SCRIPT") {
        // scripts dieksekusi setelah markup terpasang (lihat di bawah)
        return;
      }
      if (el.tagName === "STYLE" || HEAD_ONLY.has(el.tagName)) {
        const clone = el.cloneNode(true) as HTMLElement;
        clone.setAttribute(MARK, slot);
        document.head.appendChild(clone);
        return;
      }
      visible.appendChild(el.cloneNode(true));
      return;
    }
    if (node.nodeType === 3 && !node.textContent?.trim()) return;
    visible.appendChild(node.cloneNode(true));
  });

  if (visible.childNodes.length) {
    const main = document.querySelector("main");
    if (slot === "head") {
      if (main) main.prepend(visible);
      else document.body.prepend(visible);
    } else {
      if (main) main.append(visible);
      else document.body.appendChild(visible);
    }
  }

  // Jalankan semua <script> setelah markup ada di DOM
  Array.from(tpl.content.querySelectorAll("script")).forEach((sc) =>
    runScript(sc, document.body),
  );

  // Dorong unit AdSense yang baru dimasukkan
  window.setTimeout(() => {
    const w = window as unknown as { adsbygoogle?: unknown[] };
    document
      .querySelectorAll<HTMLElement>(`[${MARK}] ins.adsbygoogle:not([data-ad-pushed])`)
      .forEach((el) => {
        try {
          el.setAttribute("data-ad-pushed", "1");
          w.adsbygoogle = w.adsbygoogle || [];
          w.adsbygoogle.push({});
        } catch (e) {
          el.removeAttribute("data-ad-pushed");
          console.warn("[global-code] adsense push failed", e);
        }
      });
  }, 300);
}

function clear(slot: "head" | "footer") {
  document.querySelectorAll(`[${MARK}="${slot}"]`).forEach((n) => n.remove());
}

export function GlobalCodeInjector() {
  const { adsense, loaded } = useAdSettings();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loaded) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/login")) return;

    let cancelled = false;
    clear("head");
    clear("footer");

    // tunggu <main> ter-render agar markup iklan tampil di dalam halaman
    let attempts = 0;
    const run = () => {
      if (cancelled) return;
      attempts++;
      if (!document.querySelector("main") && attempts < 20) {
        window.setTimeout(run, 150);
        return;
      }
      injectHtml(adsense.header_code || "", "head");
      injectHtml(adsense.footer_code || "", "footer");
    };
    const t = window.setTimeout(run, 100);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      clear("head");
      clear("footer");
    };
  }, [loaded, pathname, adsense.header_code, adsense.footer_code]);

  return null;
}
