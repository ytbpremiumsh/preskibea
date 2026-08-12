import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Memaksa setiap navigasi internal melakukan full page reload
 * (bukan SPA navigation) supaya Google AdSense memuat iklan baru
 * di setiap halaman. Dinonaktifkan di area /admin dan /login agar
 * pengalaman admin tetap cepat.
 */
export function ForceReloadNavigation() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Disable ForceReload completely to keep SPA benefits (lightweight & fast)
  const disabled = true; 


  useEffect(() => {
    if (disabled) return;
    if (typeof window === "undefined") return;

    const handler = (e: MouseEvent) => {
      // Hanya intercept left-click tanpa modifier
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "" && anchor.target !== "_self") return;

      const href = anchor.getAttribute("href");
      if (!href) return;
      // Skip hash-only, tel:, mailto:, javascript:, dll
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      )
        return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      // Hanya same-origin
      if (url.origin !== window.location.origin) return;

      // Skip admin/login — biarkan SPA
      if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/login")) return;

      // Skip kalau hanya beda hash di halaman yang sama
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search &&
        url.hash
      )
        return;

      e.preventDefault();
      e.stopPropagation();
      window.location.assign(url.href);
    };

    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [disabled]);

  // Tangani tombol back/forward agar AdSense tetap fetch iklan baru
  useEffect(() => {
    if (disabled) return;
    if (typeof window === "undefined") return;
    const onPopState = () => {
      window.location.reload();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [disabled]);

  return null;
}
