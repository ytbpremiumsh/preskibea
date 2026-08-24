import { useEffect } from "react";

/**
 * TextScrubber component
 * Automatically hides specific text patterns that are injected via database/widgets
 * to ensure the UI remains clean without requiring direct database edits for every change.
 */
export function TextScrubber() {
  useEffect(() => {
    const scrub = () => {
      // 1. Scrub "terbatas Kuota Sisa 8"
      // 2. Scrub "ditegas kan lagi"
      const targets = ["terbatas Kuota Sisa 8", "ditegas kan lagi"];
      
      const walk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          let content = node.textContent || "";
          let changed = false;
          
          for (const target of targets) {
            if (content.includes(target)) {
              content = content.split(target).join("");
              changed = true;
            }
          }
          
          if (changed) {
            node.textContent = content;
          }
        } else {
          node.childNodes.forEach(walk);
        }
      };

      walk(document.body);
    };

    // Run immediately
    scrub();

    // Also run on a short interval to catch content loaded via widgets/async
    const interval = setInterval(scrub, 1000);
    
    // Also run on DOM changes
    const observer = new MutationObserver(scrub);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return null;
}
