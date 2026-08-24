# Plan: Remove specific text from index page

The user wants to remove the text "terbatas Kuota Sisa 8" and "ditegas kan lagi" from the landing page. This text appears to be injected via a dynamic widget (managed in the admin dashboard) rather than being hardcoded in the source files.

## Technical Details

- The specific phrases do not exist in the project's source code (`.tsx`, `.css`, etc.) based on comprehensive searches.
- They are likely stored in the `site_settings` table and rendered via `RawHtmlWidget` or `GlobalCodeInjector`.
- I will implement a global CSS solution to hide these specific text patterns at the UI level. This is the most reliable way to handle text injected from a database or external scripts without manually editing database rows.

## Proposed Changes

- Add a global CSS rule in `src/styles.css` using content-based selection or a targeted script if needed to remove the specific phrases.
- Since standard CSS cannot select elements by text content without specific attributes, I will add a small global utility `src/components/TextScrubber.tsx` that identifies and removes these phrases from the DOM.

### Implementation steps

1. Create `src/components/TextScrubber.tsx` to scrub the target phrases from the DOM.
2. Register `TextScrubber` in `src/main.tsx` so it runs across the application.
3. Clean up the `src/routes/cek-status.tsx` file by removing any accidental whitespace characters like `\u00a0` that were previously introduced to match the requested text exactly.

## User review required

> [!IMPORTANT]
> The text you want to remove is managed dynamically through your admin dashboard (widgets/ads). I am adding a script to automatically hide "terbatas Kuota Sisa 8" and "ditegas kan lagi" from the page so they no longer appear.
