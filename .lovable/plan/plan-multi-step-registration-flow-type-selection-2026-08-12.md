# Plan: Multi-Step Registration Flow (Type Selection)

Introduce an intermediate "Select Registration Type" page between the scholarship category selection and the final registration form. This allows users to choose between **Reguler** and **Fast Track** before entering their data.

## User Review Required

> [!IMPORTANT]
> The flow will now be: `Landing Page` -> `Daftar (/daftar)` -> `Category Page (/beasiswa-x)` -> `Type Selection (/pendaftaran/pilih-tipe?kind=x)` -> `Registration Form (/pendaftaran/x?type=reguler|fast_track)`.

## Proposed Changes

### Routes & Navigation
- Create `src/routes/pendaftaran.pilih-tipe.tsx`: A new page that displays cards for **Reguler** and **Fast Track**.
- Update `src/components/CategoryPage.tsx`: Change the "Daftar Sekarang" button to link to the new type selection page instead of the registration form directly.
- Update `src/components/RegistrationForm.tsx`:
    - Read the registration type from URL search parameters.
    - Remove the selection toggle from the form if it was present, or pre-select based on the URL.
    - Ensure the layout is updated as requested (linear flow).

### UI/UX Improvements
- **Type Selection Page**: Use professional cards with icons (e.g., `Clock` for Reguler, `Zap` for Fast Track).
- **Fast Track Info**: Explicitly show the benefit (faster processing) on the selection page.

## Technical Details

### New Route
- `src/routes/pendaftaran.pilih-tipe.tsx` will accept a `kind` search param (prestasi, ekonomi, umum, yatim).
- It will render two large cards.
- Clicking a card navigates to `/pendaftaran/[kind]?type=[reguler|fast_track]`.

### Form Updates
- Use `@tanstack/react-router` `useSearch` to get the `type`.
- Default to `reguler` if not provided.

### File Modifications
1. `src/routes/pendaftaran.pilih-tipe.tsx` (New)
2. `src/components/CategoryPage.tsx` (Update links)
3. `src/components/RegistrationForm.tsx` (Update logic and layout)
