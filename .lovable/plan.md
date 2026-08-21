# Plan - Dual Fast Track Tracks (Standard & Premium)

Implement "Fast Track Premium" as a new registration type that offers automatic document selection approval (lolos administrasi berkas) in addition to existing Fast Track benefits.

## User Review Required

> [!IMPORTANT]
> - **Fast Track Premium** automatically sets the document status to `approved`, effectively bypassing the manual verification stage for documents.
> - The admin can configure separate fees for "Fast Track" (Standard) and "Fast Track Premium" in the dashboard.

- Does the "Fast Track Premium" also need a different set of benefits in the UI (e.g., extra E-Books or exclusive merchandise) or is the "Auto Lolos Administrasi" the only functional difference?
- Should the "Premium" status be visible on the generated e-certificate?

## Proposed Changes

### Database & Schema
- Update `site_settings` to include `fast_track_premium_fee`.
- The `registrations` table already has `fast_track` (boolean). We will use the `extra` JSON column to store `fast_track_type` ('standard' | 'premium') to avoid schema migrations, or check if a new column is preferred. Given the prompt, using `extra` is safer and faster.

### Backend (Edge Functions)
- **submit-registration**: Update to handle `fast_track_type`. If 'premium', record it in `extra`. Fetch `fast_track_premium_fee` from settings if applicable.
- **check-payment-status** & **mayar-webhook**: When a payment is successful, if `fast_track_type` is 'premium', automatically set `candidate_status` to 'approved' (which corresponds to Seleksi Administrasi in this app's logic).

### Admin Dashboard
- **admin.integrasi.tsx**: Add a new input field for "Biaya Fast Track Premium".
- **admin.pendaftar.tsx**: Update the "Jalur" column to distinguish between Standard and Premium.
- **admin.index.tsx**: Update statistics to show counts for both Fast Track types.

### Frontend
- **pendaftaran.pilih-tipe.tsx**: 
    - Split the Fast Track card into two or add a selector.
    - Add "Fast Track Premium" with the "Auto Lolos Administrasi" highlight.
- **RegistrationForm.tsx**: Pass the selected track type to the submission function.
- **cek-status.tsx**: Update the timeline to show "⚡ Auto Lolos (Premium)" for the Seleksi Administrasi stage if the user is a Premium member.

## Technical Details
- `registrations.extra.fast_track_type` values: `standard`, `premium`.
- Payment logic will pull `fast_track_fee` or `fast_track_premium_fee` based on the selection.
