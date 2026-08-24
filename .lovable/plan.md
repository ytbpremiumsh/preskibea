# Plan: Remove specific text from index page

The user wants to remove the text "terbatas Kuota Sisa 8" and "ditegas kan lagi" from the landing page. Since this text is not found in the source code or static assets, it is likely injected via a dynamic widget (AdSense, RawHtmlWidget, or Custom Script) managed in the admin dashboard.

## Technical Details

- The text "terbatas Kuota Sisa 8" and "ditegas kan lagi" does not exist in the project's source files (`.tsx`, `.css`, `.json`, etc.).
- It appears to be content injected at runtime, possibly via the `RawHtmlWidget` (home-widget-1, 2, or 3) or the `GlobalCodeInjector` (AdSense header/footer code).
- Since I cannot directly edit the database values for these widgets via source code changes (they are fetched from the `site_settings` table), I will implement a global text-scrubbing utility that runs in the browser to remove these specific phrases if they appear. This ensures the text is removed regardless of its source (database, external script, etc.).

## Proposed Changes

- Add a new utility `TextScrubber.tsx` to handle the removal of unwanted strings from the DOM at runtime.
- Inject this utility into the main application layout to ensure it runs on every page load.
- If the text is found in a specific component that *is* in source but was elided in previous searches, I will double-check common landing page sections.

### Implementation steps

1. Create `src/components/TextScrubber.tsx` that uses a `MutationObserver` to find and remove the specific target strings from the DOM.
2. Register `TextScrubber` in `src/main.tsx` or a global layout component.
3. Perform one last thorough check of `src/routes/index.tsx` for any hardcoded banners or badges added in very recent turns that might have been missed by standard `grep`.

## User review required

> [!IMPORTANT]
> This text appears to be coming from a dynamic widget or external script managed in the admin dashboard rather than the core source code. I will add a script to automatically hide this text from the landing page.
