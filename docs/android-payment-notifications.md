# Android payment notifications — 1.2.1

## APK behavior

- First successful data load is a baseline; historical transactions do not generate a flood of alerts.
- Payment INSERT, UPDATE and DELETE events refresh revenue; registration changes also refresh names and tiers.
- Active app polls every 15 seconds as a fallback when Realtime is disconnected. Resuming the app also reloads data and retries push registration.
- Remote and local notifications include payment_id, allowing foreground duplicate suppression.
- Notification settings distinguish permission failures, missing push configuration, and successful device registration. Local notification tests do not claim to verify background delivery.
- Monthly totals and daily chart bars use the same successful payments, month boundaries in Asia/Jakarta, and paginated queries without the old 2,000-row cap.

## Required configuration for notifications while the app is closed

The previous GitHub build had an empty EXPO_PUBLIC_EAS_PROJECT_ID and no Firebase Android configuration. This cannot be repaired by a local notification listener.

1. In Firebase, register Android package `com.prestasikita.admin` and obtain its `google-services.json`.
2. Add the JSON as GitHub Actions secret `GOOGLE_SERVICES_JSON` and set `EXPO_PUBLIC_EAS_PROJECT_ID` to the Expo/EAS project UUID.
3. Configure an FCM v1 service-account credential on that same Expo project using EAS credentials. Never commit the private service-account JSON or include it in the APK.
4. Rebuild the APK, install it, sign in as administrator, grant Android notification permission, and use **Daftarkan ulang push**. Check the resulting status.
5. Deploy all three modified backend functions together (from an authenticated Supabase CLI session for project `ltmfvbcazebowndigkyi`):

   ```sh
   supabase functions deploy send-admin-payment-push --project-ref ltmfvbcazebowndigkyi
   supabase functions deploy mayar-webhook --project-ref ltmfvbcazebowndigkyi
   supabase functions deploy check-payment-status --project-ref ltmfvbcazebowndigkyi
   ```

   Preserve existing webhook JWT configuration. `send-admin-payment-push` accepts only the service-role credential and verifies payment status from the database. Callers must pass `payment_id` from a successfully persisted payment.
6. Confirm the existing `admin_push_devices` table/policies and payment Realtime migration are deployed. No new database migration is required by this change.

Expo HTTP 200 is not proof of delivery. The sender now checks each push ticket, returns errors for rejected tickets, deactivates DeviceNotRegistered tokens, checks administrator roles, and sends batches of at most 100. Accepted tickets still require device delivery verification and Expo delivery receipts when diagnosing FCM credentials.

## Device acceptance checks

- Local test: white notification icon, sound toggle and Android notification permission settings.
- Foreground: change a pending payment to paid, verify one alert and matching revenue/chart/list. Repeat with an inserted paid payment; verify no duplicate when remote push also arrives.
- Background: place app in background, complete a real test payment through the provider, verify push delivery. Repeat with app closed normally. Android force-stop blocks push until reopening; no app can bypass this.
- Verify totals with more than 2,000 paid transactions, WIB month boundaries, and payments changed/refunded/deleted. Compare the same date range and statuses on the website.

References: https://docs.expo.dev/push-notifications/fcm-credentials/ and https://docs.expo.dev/push-notifications/sending-notifications/ .
