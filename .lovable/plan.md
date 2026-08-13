# Plan: Expand Admin Widget Management

The user wants to add widget (HTML/AdSense) management for four additional pages: **Berkas**, **Pendaftaran**, **Bagikan Poster**, and **Benefit**. These slots will be manageable from the "Pengaturan Widget & Iklan" admin dashboard.

## User Review Required

> [!IMPORTANT]
> - I will add "Top" and "Bottom" slots for these new pages.
> - The "Benefit" page refers to the category-specific landing pages (e.g., `/beasiswa-prestasi`) which already have some slots, but I will ensure they are fully configurable.
> - For "Berkas" and "Pendaftaran", the slots will appear on the main entry points of these processes.

## Proposed Changes

### 1. Branding Hook Update
- Add `registration_widgets`, `berkas_widgets`, `poster_widgets`, and `benefit_widgets` to `BrandingSettings` in `src/hooks/use-branding.ts`.

### 2. Admin Dashboard Update
- Modify `src/routes/admin.widgets.tsx` to include the new page options in the dropdown:
    - Pendaftaran
    - Berkas
    - Bagikan Poster
    - Benefit (Kategori)
- Add the corresponding `WidgetEditor` components for each new category.

### 3. Page Integrations
- **Pendaftaran**: Integrate `RawHtmlWidget` into `src/components/RegistrationForm.tsx` (or `src/routes/daftar.tsx`).
- **Berkas**: Integrate into `src/routes/berkas.index.tsx` (or specific track index pages).
- **Bagikan Poster**: Integrate into `src/components/SharePosterPage.tsx`.
- **Benefit (Category)**: Refine integration in `src/components/CategoryPage.tsx`.

## Technical Details

- **Database**: The `site_settings` table stores branding config. I will update the JSON structure under the `branding` key.
- **Components**: I will use the existing `RawHtmlWidget` component to safely render the provided HTML strings.
- **Safety**: Widgets will be wrapped in `overflow-visible` containers to ensure AdSense ads are not clipped.
