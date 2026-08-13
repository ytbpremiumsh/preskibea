# Plan: Add Category Button Widget Slot

The user wants to add a new widget slot in the "Category Page" (Benefit Page) specifically above the action buttons (Daftar Sekarang / Kirim Berkas), manageable from the admin dashboard.

## User Review Required
> [!IMPORTANT]
> This will add a new "Above Button" slot in the admin dashboard under the Category Page settings.

## Proposed Changes

### Backend / Data Structures
- Update `BrandingSettings` type in `src/hooks/use-branding.ts` to include `above_button` in `category_widgets`.

### Admin Dashboard
- Update `src/routes/admin.widgets.tsx` to include a new text area for the "Category Above Button" widget slot under the "Halaman Benefit (Kategori)" tab.
- Update the save logic to handle this new field.

### Frontend
- Update `src/components/CategoryPage.tsx` to fetch the `above_button` widget from `categoryWidgets` and render it right above the "CTA — Pendaftaran" section.

## Technical Details
- **File**: `src/hooks/use-branding.ts` -> Add `above_button?: string` to `category_widgets`.
- **File**: `src/routes/admin.widgets.tsx` -> Add `above_button` to the `CategoryWidgets` type and the UI.
- **File**: `src/components/CategoryPage.tsx` -> Inject `<RawHtmlWidget html={categoryWidgets.above_button} />` before line 206.
