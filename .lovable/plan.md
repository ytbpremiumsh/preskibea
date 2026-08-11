# Plan: Admin Dashboard for Fast Track Fee Configuration

I will implement a way for administrators to change the Fast Track fee directly from the dashboard and ensure this dynamic fee is used throughout the registration and payment process.

## User Review Required

> [!IMPORTANT]
> The current hardcoded fee is **Rp15.000**. I will set this as the default value in the database, which you can then modify from the admin panel.

## Proposed Changes

### Database & Backend
- Add a migration to seed `fast_track_fee` in the `site_settings` table (default: 15000).
- Update the `submit-registration` Edge Function to fetch this value from `site_settings` instead of using a hardcoded constant.

### Admin Dashboard
- Modify `src/routes/admin.integrasi.tsx` to include a new input field for the Fast Track fee.
- Allow administrators to save the new fee value to the `site_settings` table.

### Frontend
- Update `src/components/RegistrationForm.tsx` to display the dynamic fee from the database in the UI (if applicable) to ensure consistency.

## Technical Details

### Database (SQL)
```sql
INSERT INTO public.site_settings (key, value)
VALUES ('fast_track_fee', '15000')
ON CONFLICT (key) DO NOTHING;
```

### Edge Function (`submit-registration`)
```typescript
const feeSetting = settings?.find(s => s.key === "fast_track_fee")?.value;
const amount = feeSetting ? Number(feeSetting) : 15000;
```

### Admin UI
Adding a "Biaya Fast Track" section in the Integration dashboard with a numeric input and "Save" functionality.
