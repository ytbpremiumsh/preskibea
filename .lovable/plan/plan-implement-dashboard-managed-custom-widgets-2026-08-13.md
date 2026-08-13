# Plan: Implement Dashboard-Managed Custom Widgets

I will implement a feature that allows the administrator to manage custom HTML widgets (like AdSense, trackers, or banners) directly from the admin dashboard, eliminating the need for manual code edits in `src/routes/index.tsx`.

## User Interface Changes

- **Admin Dashboard**:
    - Create a new route `/admin/widgets` for managing home page widgets.
    - Add a "Widgets Home" item to the sidebar under "Integrasi & Pengaturan".
    - The new admin page will allow editing HTML content for three predefined slots:
        - Widget 1 (Below Hero)
        - Widget 2 (Below Categories)
        - Widget 3 (Below Benefits)
    - Each slot will have a title, description, and a code editor (textarea).

- **Home Page (`src/routes/index.tsx`)**:
    - Update `RawHtmlWidget` usage to fetch content from the database instead of using hardcoded strings.
    - Use the `useBranding` pattern or a similar hook to fetch these settings efficiently.

## Technical Details

- **Database**:
    - Use the existing `site_settings` table.
    - Store widget configuration under the key `home_widgets`.
    - Schema: `{ widget1: string, widget2: string, widget3: string }`.

- **Components**:
    - Update `src/hooks/use-branding.ts` to include `home_widgets`.
    - Create `src/routes/admin.widgets.tsx` for the management UI.
    - Modify `src/routes/index.tsx` to use dynamic content.

## User Review Required

> [!IMPORTANT]
> The widgets will support any HTML/JavaScript (including AdSense). Please ensure the code you paste is from trusted sources to avoid security risks.

- Are there any other pages besides the Home Page where you would like to manage widgets from the dashboard?
- Should we add a simple "Preview" feature in the admin dashboard to see how the HTML looks before saving?
