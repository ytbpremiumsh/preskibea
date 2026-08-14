# Plan: Integration of Doku Payment Gateway

Add Doku as a third payment provider alongside Mayar and Aulaa.co for Fast Track registration fees.

## User Review Required

> [!IMPORTANT]
> The user must provide the Doku API documentation or specific API details (Client ID, Secret Key, Base URL) if they are different from the standard Doku JOKKA/Direct API. I will assume the standard Doku Checkout/Payment Link API for this implementation.

- **Clarification**: Should Doku be a toggleable provider in the admin dashboard just like Mayar and Aulaa? (Assumed: Yes)
- **Credential Storage**: Doku requires `Client ID` and `Shared Key`. I will add these to the `doku_config` in `site_settings`.

## Technical Details

### 1. Database & Settings
- Update `site_settings` to handle `doku_config`.
- Update `payments` table (if needed) to recognize `doku` as a provider.

### 2. Admin Dashboard
- **File**: `src/routes/admin.integrasi.tsx`
- Add "Doku" tab to the payment provider settings.
- Add inputs for `Doku Client ID`, `Doku Shared Key`, and `Doku Mall ID` (if required).
- Update the saving logic to include `doku_config`.

### 3. Registration Edge Function
- **File**: `supabase/functions/submit-registration/index.ts`
- Implement Doku invoice/payment link creation logic.
- Doku typically uses a HMAC-SHA256 signature for requests.
- Generate a payment URL using Doku's API and return it to the frontend.

### 4. Webhook Handler
- **File**: `supabase/functions/mayar-webhook/index.ts` (Renaming or keeping as generic webhook)
- Add logic to handle Doku's notification payload.
- Verify Doku's signature to ensure authenticity.
- Update registration and payment status upon successful payment.

### 5. Frontend Integration
- Ensure the `invoice_url` returned from `submit-registration` works correctly for Doku (likely a redirect to Doku's hosted checkout).

## Steps
1. Add Doku UI to Admin Integrasi page.
2. Update `submit-registration` Edge Function with Doku API integration.
3. Update `mayar-webhook` (generic webhook handler) to support Doku notifications.
4. Test the flow (mocking API responses if live credentials aren't provided yet).
