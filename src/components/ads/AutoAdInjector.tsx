import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useAdSettings, type AdPosition, type AdSlotConfig } from "./AdSettings";

const MARK_ATTR = "data-auto-ad-injected";
const SLOT_ATTR = "data-auto-ad-slot";

function extractPublisherId(html: string) {
  return html.match(/(?:client=|data-ad-client=["'])(ca-pub-[0-9]+)/)?.[1] || "";
}

function ensureAdSenseScript(publisherId: string, htmlSnippets: string[] = []) {
  if (typeof document === "undefined") return;
  const client = publisherId || htmlSnippets.map(extractPublisherId).find(Boolean) || "";
  if (!client) return;

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`,
  );
  if (existing) return;

  const script = document.createElement("script");
  script.id = "adsense-script";
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
  document.head.appendChild(script);
}

function prepareAdSenseIns(root: HTMLElement, fallbackClient: string) {
  root.querySelectorAll<HTMLElement>(`[${MARK_ATTR}] ins.adsbygoogle`).forEach((ins) => {
    if (fallbackClient && !ins.getAttribute("data-ad-client")) {
      ins.setAttribute("data-ad-client", fallbackClient);
    }
    ins.style.display = "block";
    ins.style.width = "100%";
    ins.style.minWidth = "250px";
    ins.style.minHeight = "50px";
    ins.style.overflow = "visible";
    ins.style.margin = "0 auto";
    ins.style.clear = "both";
    
    // Ensure parent doesn't restrict the ad height or width berantakan
    const parent = ins.parentElement;
    if (parent) {
      parent.style.overflow = "visible";
      parent.style.minHeight = "auto";
      parent.style.height = "auto";
      parent.style.width = "100%";
    }
  });
}

function buildAdNode(slot: AdSlotConfig): HTMLElement | null {
  const tpl = document.createElement("template");
  tpl.innerHTML = (slot.code || "").trim();
  if (!tpl.content.childNodes.length) return null;

  const wrapper = document.createElement("div");
  wrapper.className = "my-8 w-full flex justify-center items-center overflow-visible text-center clear-both px-4 box-border";
  wrapper.style.width = "100%";
  wrapper.style.minWidth = "250px";
  wrapper.style.minHeight = "100px";
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.setAttribute(MARK_ATTR, "1");
  wrapper.setAttribute(SLOT_ATTR, slot.id);
  wrapper.setAttribute("aria-label", "Iklan");

  // Copy only non-script nodes (typically <ins class="adsbygoogle">).
  tpl.content.childNodes.forEach((node) => {
    if (node.nodeType === 1 && (node as HTMLElement).tagName === "SCRIPT") return;
    wrapper.appendChild(node.cloneNode(true));
  });

  if (!wrapper.childNodes.length) return null;
  return wrapper;
}

const CARD_SELECTOR =
  "div.rounded-3xl.bg-card, div.rounded-2xl.bg-card, div[class*='shadow-card']";

/**
 * Untuk posisi "card": iklan TIDAK pernah dimasukkan ke dalam card.
 * Jika card berada di dalam grid/flex, iklan diletakkan setelah container grid-nya
 * supaya layout tidak berantakan.
 */
function cardAnchorFor(card: HTMLElement, root: HTMLElement): HTMLElement | null {
  // Naik ke card terluar
  let outer: HTMLElement = card;
  let p = card.parentElement?.closest<HTMLElement>(CARD_SELECTOR) || null;
  while (p && root.contains(p)) {
    outer = p;
    p = p.parentElement?.closest<HTMLElement>(CARD_SELECTOR) || null;
  }
  // Jika berada di grid/flex, pakai container-nya sebagai anchor
  let anchor: HTMLElement = outer;
  let parent = anchor.parentElement;
  while (parent && parent !== root) {
    const cs = window.getComputedStyle(parent);
    if (cs.display.includes("grid") || cs.display.includes("flex")) {
      anchor = parent;
      parent = anchor.parentElement;
      continue;
    }
    break;
  }
  if (!anchor.parentNode || anchor === root) return null;
  if (anchor.closest("form, aside, header, footer, nav")) return null;
  return anchor;
}

function selectorFor(position: AdPosition): string | null {
  switch (position) {
    case "before_each_image":
    case "after_each_image":
      return "img";
    case "before_each_heading":
    case "after_each_heading":
      return "h1, h2, h3";
    case "after_each_paragraph":
      return "p";
    case "between_sections":
      return "section";
    case "before_timeline_button":
      return "#timeline a[class*='rounded-full'], #timeline button";
    case "before_each_button":
      return "button, a[role='button'], a[class*='rounded-full']";
    case "before_each_nav_link":
    case "after_each_nav_link":
      return "a[href]:not([href^='#']):not([href^='mailto']):not([href^='tel']):not([href^='http']):not([href^='javascript'])";
    case "before_each_card":
    case "after_each_card":
      return CARD_SELECTOR;
    default:
      return null;
  }
}

function buildStickyAnchor(slot: AdSlotConfig): HTMLElement | null {
  const inner = buildAdNode(slot);
  if (!inner) return null;
  const bar = document.createElement("div");
  bar.setAttribute(MARK_ATTR, "1");
  bar.setAttribute(SLOT_ATTR, slot.id);
  bar.className =
    "fixed bottom-0 left-0 right-0 z-40 flex justify-center bg-background/95 backdrop-blur border-t border-border p-1";
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "×";
  close.setAttribute("aria-label", "Tutup iklan");
  close.className =
    "absolute -top-6 right-2 h-6 w-6 rounded-t-md border border-b-0 border-border bg-background text-sm leading-none text-muted-foreground";
  close.onclick = () => bar.remove();
  inner.classList.remove("my-8");
  bar.appendChild(close);
  bar.appendChild(inner);
  return bar;
}

function injectSlot(root: HTMLElement, slot: AdSlotConfig) {
  if (!slot.enabled || !slot.code?.trim()) return 0;
  const everyNth = Math.max(1, Number(slot.every_nth) || 1);
  const maxPer = Math.max(1, Number(slot.max_per_page) || 3);

  if (slot.position === "top_of_page") {
    const node = buildAdNode(slot);
    if (node) root.prepend(node);
    return node ? 1 : 0;
  }
  if (slot.position === "bottom_of_page") {
    const node = buildAdNode(slot);
    if (node) root.append(node);
    return node ? 1 : 0;
  }
  if (slot.position === "sticky_bottom") {
    if (document.querySelector(`[${SLOT_ATTR}="${slot.id}"]`)) return 0;
    const bar = buildStickyAnchor(slot);
    if (!bar) return 0;
    document.body.appendChild(bar);
    return 1;
  }
  if (slot.position === "after_first_section") {
    const first = root.querySelector<HTMLElement>("section");
    const node = first ? buildAdNode(slot) : null;
    if (first && node) {
      first.parentNode?.insertBefore(node, first.nextSibling);
      return 1;
    }
    return 0;
  }

  const sel = selectorFor(slot.position);
  if (!sel) return 0;
  const isCardPos = slot.position === "before_each_card" || slot.position === "after_each_card";

  if (isCardPos) {
    const anchors: HTMLElement[] = [];
    root.querySelectorAll<HTMLElement>(sel).forEach((card) => {
      if (card.closest(`[${MARK_ATTR}]`) || card.closest("[data-no-ads]")) return;
      const anchor = cardAnchorFor(card, root);
      if (anchor && !anchors.includes(anchor)) anchors.push(anchor);
    });
    let injected = 0;
    anchors.forEach((anchor, idx) => {
      if (injected >= maxPer) return;
      if (idx % everyNth !== 0) return;
      const node = buildAdNode(slot);
      if (!node) return;
      // Selalu di LUAR card: sebelum/sesudah blok card, bukan di dalamnya.
      if (slot.position === "before_each_card") anchor.parentNode?.insertBefore(node, anchor);
      else anchor.parentNode?.insertBefore(node, anchor.nextSibling);
      injected++;
    });
    return injected;
  }

  const candidates = Array.from(root.querySelectorAll<HTMLElement>(sel)).filter((el) => {
    if (el.closest(`[${MARK_ATTR}]`)) return false;
    if (el.closest("[data-no-ads]")) return false;
    // Jangan pernah menyisipkan iklan di dalam card / form supaya tidak merusak layout.
    if (el.closest(CARD_SELECTOR) || el.closest("form")) return false;
    const parent = el.parentElement;
    if (parent) {
      const cs = window.getComputedStyle(parent);
      if (cs.display.includes("grid") || cs.display.includes("flex")) return false;
    }
    return true;
  });
  let injected = 0;
  candidates.forEach((el, idx) => {
    if (injected >= maxPer) return;
    if (idx % everyNth !== 0) return;
    const node = buildAdNode(slot);
    if (!node) return;
    if (slot.position.startsWith("before_")) el.parentNode?.insertBefore(node, el);
    else el.parentNode?.insertBefore(node, el.nextSibling);
    injected++;
  });
  return injected;
}

function pushAds(root: HTMLElement) {
  const insList = root.querySelectorAll<HTMLElement>(
    `[${MARK_ATTR}] ins.adsbygoogle:not([data-ad-pushed])`,
  );
  if (!insList.length) return;
  const w = window as any;
  w.adsbygoogle = w.adsbygoogle || [];
  insList.forEach((ins) => {
    const tryPush = (attempt = 0) => {
      if (ins.getAttribute("data-ad-pushed") === "1") return;
      
      // Being extra careful: check visibility and measurable width
      const rect = ins.getBoundingClientRect();
      const style = window.getComputedStyle(ins);
      const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0;

      if (!isVisible) {
        if (attempt < 10) {
          window.setTimeout(() => tryPush(attempt + 1), 300);
        }
        return;
      }
      
      try {
        ins.setAttribute("data-ad-pushed", "1");
        // Only push if the API is ready
        if (typeof w.adsbygoogle.push === 'function') {
          w.adsbygoogle.push({});
        }
      } catch (e) {
        ins.removeAttribute("data-ad-pushed");
        console.warn("[adsense] push failed", e);
      }
    };
    tryPush();
  });
}

export function AutoAdInjector() {
  const { adsense, slots, loaded } = useAdSettings();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loaded) return;
    if (!adsense.enabled) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/login")) return;

    const enabledSlots = slots.filter((s) => s.enabled && s.code?.trim());
    if (!enabledSlots.length) return;
    ensureAdSenseScript(
      adsense.publisher_id,
      enabledSlots.map((s) => s.code),
    );

    let cancelled = false;
    const injectedPerSlot = new Map<string, number>();
    let observer: MutationObserver | null = null;
    let scheduled = false;

    const runInjection = () => {
      if (cancelled) return;
      const root = document.querySelector("main") as HTMLElement | null;
      if (!root) return;

      let injectedThisPass = 0;
      enabledSlots.forEach((s) => {
        const prev = injectedPerSlot.get(s.id) || 0;
        const cap = Math.max(1, Number(s.max_per_page) || 3);
        if (prev >= cap) return;

        root
          .querySelectorAll<HTMLElement>(`[${SLOT_ATTR}="${s.id}"]`)
          .forEach((n) => {
            const hasLiveAd = n.querySelector(
              "ins.adsbygoogle[data-ad-pushed], ins.adsbygoogle[data-ad-status], ins.adsbygoogle iframe",
            );
            if (!hasLiveAd) n.remove();
          });

        const n = injectSlot(root, s);
        injectedPerSlot.set(s.id, prev + n);
        injectedThisPass += n;
      });

      if (injectedThisPass > 0) {
        prepareAdSenseIns(root, adsense.publisher_id);
        window.setTimeout(() => pushAds(root), 100);
        window.setTimeout(() => pushAds(root), 1000);
      }
    };

    const scheduleRun = (delay = 0) => {
      if (cancelled || scheduled) return;
      scheduled = true;
      window.setTimeout(() => {
        scheduled = false;
        runInjection();
      }, delay);
    };

    const tryInject = () => {
      if (cancelled) return;
      const root = document.querySelector("main") as HTMLElement | null;
      if (!root) {
        window.setTimeout(tryInject, 500);
        return;
      }
      runInjection();
    };

    const t = window.setTimeout(tryInject, 200);

    const mainEl = document.querySelector("main");
    if (mainEl && typeof MutationObserver !== "undefined") {
      observer = new MutationObserver((mutations) => {
        const relevant = mutations.some((m) => {
          const tgt = m.target as HTMLElement | null;
          if (!tgt) return false;
          if (tgt.closest?.(`[${MARK_ATTR}]`)) return false;
          if (tgt.closest?.("ins.adsbygoogle")) return false;
          return true;
        });
        if (relevant) scheduleRun(300);
      });
      observer.observe(mainEl, { childList: true, subtree: true });
    }

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      observer?.disconnect();
    };
  }, [pathname, loaded, adsense.enabled, slots]);

  return null;
}