# Plan: Implement Doku Wallet Payment Integration

Add Doku Wallet as a third payment gateway option alongside Mayar and Aulaa.co. This involves updating the admin settings UI, the registration processing logic (Edge Function), and the webhook handler to support Doku's verification.

## User Review Required

> [!IMPORTANT]
> To fully integrate Doku Wallet, you will need to provide the **Doku Client ID**, **Secret Key**, and **Merchant Code** in the Admin Dashboard once the update is live.

- Do you have a specific Doku integration type in mind (e.g., Checkout, Hosted Page, or Direct API)? I will assume a Hosted/Link-based approach similar to Mayar and Aulaa.co for consistency.

## Proposed Changes

### Database & Settings
- Update `site_settings` logic to handle `doku_config`.
- Add "doku" as a valid option for `payment_provider`.

### Admin Dashboard
- **Integrasi Pembayaran (`src/routes/admin.integrasi.tsx`)**:
    - Add a "Doku" tab in the Payment Provider settings.
    - Fields: Client ID, Secret Key, Merchant Code, and Environment toggle (Sandbox/Production).
    - Update state management and save logic to include Doku configuration.

### Edge Functions (Backend)
- **Submit Registration (`supabase/functions/submit-registration/index.ts`)**:
    - Add logic to generate a Doku payment link when `doku` is the active provider.
    - Implement HMAC-SHA256 signature generation required by Doku for request headers.
- **Webhook Handler (`supabase/functions/mayar-webhook/index.ts`)**:
    - Detect incoming webhooks from Doku.
    - Implement Doku signature verification (HMAC-SHA256) to ensure security.
    - Map Doku's success status to the application's registration approval flow.

### Optimization & Cleanup
- Fix the accidental instruction text in `src/routes/index.tsx`.
- Ensure all three providers are manageable via the dashboard.

## Technical Details

- **Doku API Endpoint**: `https://api.doku.com/checkout/v1/payment` (or sandbox equivalent).
- **Authentication**: Doku requires specific headers: `Client-Id`, `Request-Id`, `Request-Timestamp`, and `Signature`.
- **Signature Calculation**: `HMAC-SHA256` using the Secret Key over a string composed of Client-Id, Request-Id, Timestamp, and Request-Target (URI + Body digest).
- **Webhook**: Doku sends a POST request with specific headers for verification.
