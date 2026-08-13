import { useEffect, useRef } from "react";

interface RawHtmlWidgetProps {
  html: string;
  className?: string;
  id?: string;
}

/**
 * RawHtmlWidget - A lightweight component to render any raw HTML/Scripts.
 * Perfect for manual AdSense placement, custom tracking scripts, or raw HTML banners.
 * Bypasses the standard admin settings to give full "Elementor-like" control in code.
 */
export function RawHtmlWidget({ html, className = "", id }: RawHtmlWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !html.trim()) return;

    // Clear existing content
    containerRef.current.innerHTML = "";

    // Create a container for the HTML
    const wrapper = document.createElement("div");
    wrapper.className = "w-full flex justify-center items-center overflow-visible text-center clear-both";
    
    // We use a template to parse the HTML string
    const tpl = document.createElement("template");
    tpl.innerHTML = html.trim();

    // Process nodes, specifically re-executing scripts
    Array.from(tpl.content.childNodes).forEach((node) => {
      if (node.nodeType === 1 && (node as HTMLElement).tagName === "SCRIPT") {
        const origScript = node as HTMLScriptElement;
        const newScript = document.createElement("script");
        
        // Copy attributes
        Array.from(origScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        
        // Copy inline content
        newScript.textContent = origScript.textContent;
        
        wrapper.appendChild(newScript);
      } else {
        wrapper.appendChild(node.cloneNode(true));
      }
    });

    containerRef.current.appendChild(wrapper);

    // If it's AdSense, try to trigger adsbygoogle.push
    const hasAdSense = html.includes("adsbygoogle");
    if (hasAdSense) {
      const pushAds = () => {
        const ads = containerRef.current?.querySelectorAll("ins.adsbygoogle:not([data-ad-status])");
        if (ads && ads.length > 0) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).adsbygoogle = (window as any).adsbygoogle || [];
            ads.forEach(() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (window as any).adsbygoogle.push({});
            });
          } catch (e) {
            console.warn("[RawHtmlWidget] AdSense push failed", e);
          }
        }
      };

      // Delay slightly to ensure DOM is ready and width is measurable
      const t1 = setTimeout(pushAds, 200);
      const t2 = setTimeout(pushAds, 1000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [html]);

  if (!html.trim()) return null;

  return (
    <div 
      ref={containerRef} 
      id={id}
      className={`raw-html-widget-container my-8 w-full overflow-visible ${className}`}
      data-widget-id={id}
    />
  );
}
