# Project Architecture Rules

- Registration confirmation email is triggered only by the registration function after persistence; this prevents duplicate sends and keeps delivery failures separate from registration success.
- All managed email paths use `notify.mail.prestasikita.com` as the sender domain because it is the delegated, verified sending subdomain.
- Participant notifications require service-role authentication and a deterministic event idempotency key; admin sessions can only send explicit tests, preventing public sends and duplicate payment confirmations.
- Email attempts are recorded before delivery and outcomes use allowlisted safe explanations; admin-only read access preserves participant privacy while service-role code alone writes logs.
