# Android 1.3.0 — mobile UI and date filters

The native app follows the supplied pastel dashboard reference with a dismissible first-run cover, a cover while session initialization runs, gradient revenue/metric cards, line/area charts, revenue composition, and a five-position bottom navigation with a central filter button. Subsequent launches do not add a forced delay.

A shared filter controls the dashboard, statistics, valid-payment list, and participant list. Presets: Semua Hari (default), Hari Ini, Minggu Ini, Bulan Ini; a native calendar sheet selects start/end dates. End dates are inclusive in Asia/Jakarta. The earliest registration/payment supplies the start of Semua Hari. Payments are filtered by transaction date; participant rows by registration date. Revenue, chart, breakdown, and transaction rows share the same filter. The chart groups long ranges by month or year without dropping transactions.

Payment and registration history are both paginated in batches of 500, removing the former current-month and 300-registration limits. Registration fields are minimized to the displayed profile and tier. Lists remain virtualized. Preset/date changes filter the cached snapshot without making a new request. Realtime updates and the active-app polling fallback are retained; polling skips an in-flight load.

Validation: TypeScript; eight finance tests (WIB boundaries, inclusive end dates, invalid/reversed ranges, all history, month/year grouping, and more than 2,000 transactions); Android prebuild/Metro export. Browser screenshots could not run because the Chromium download was unavailable; native device/emulator UI, calendar gestures and screen-size acceptance still require device testing.

Retained limitations: background payment push still needs Expo/Firebase credentials and backend deployment described in android-payment-notifications.md. This UI release does not configure or verify those services.
