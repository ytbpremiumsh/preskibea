# Analysis and Bug Fix Plan

Comprehensive analysis and refinement of all pages and the database to ensure high precision and robust performance.

## User Review Required

> [!IMPORTANT]
> This plan focuses on identifying and fixing potential edge cases, UI inconsistencies, and database integrity issues across the platform.

- **Fast Track Verification**: Should the system automatically verify all fast track payments, or do we want an optional manual approval step for certain payment methods? (Currently, it's automatic via webhook).
- **Document Requirements**: Confirm if "Gap Year" students should follow the same requirements as "Pelajar" for all categories, or if there are specific "Gap Year" documents (e.g., Graduation Certificate).

## Proposed Changes

### Database & Backend
- **Data Integrity**: Add a cleanup routine or check for registration orphans (registrations without corresponding documents or payment records).
- **RLS Reinforcement**: Verify that all new tracks (Umum, Yatim) have correct RLS policies and that `GRANT` statements are applied to all public tables.
- **Webhook Robustness**: Improve the `mayar-webhook` to handle retries and log detailed failure reasons to the database for easier debugging.

### Registration Flow & Logic
- **Conditional Validation**: Refine `BerkasPage.tsx` to strictly enforce Track + Educational Level logic (e.g., ensuring Mahasiswa in "Ekonomi" track also get KHS requirements).
- **Fast Track Gate**: Ensure the "Fast Track" status correctly propagates through the Esai and Berkas stages without manual overrides.
- **Email Delivery**: Verify that the `notify-user` function correctly waits for payment confirmation for Fast Track before sending the final registration token.

### UI & UX Refinement
- **Asset Fallbacks**: Standardize `onError` handlers for all branding assets (Logo, Hero, Benefits) to prevent broken images if external URLs fail.
- **Mobile Responsiveness**: Audit the "Batch #8" 2x2 grid on mobile vs. desktop to ensure optimal readability.
- **Admin Dashboard**: Enhance the pendaftar detail view to clearly highlight track-specific missing documents.
- **Visual Consistency**: Ensure the Navy/Gold branding is consistently applied to all new components (PDF Certificates, AI Article cards, etc.).

## Technical Details

- **Supabase Functions**: Update `lookup-pendaftar` and `cek-status-pendaftar` to handle the new track enums consistently.
- **React Components**: 
    - `RegistrationForm.tsx`: Fix schema dynamic updates.
    - `BerkasPage.tsx`: Improve document list generation based on `registrant` data.
    - `SiteHeader.tsx` & `SiteFooter.tsx`: Ensure logo fallbacks are robust.
- **Database**: Run a migration to add missing `GRANT` statements if any table was missed in previous iterations.
