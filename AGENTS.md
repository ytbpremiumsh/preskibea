# Project Architecture Rules

- Registration confirmation email is triggered only by the registration function after persistence; this prevents duplicate sends and keeps delivery failures separate from registration success.
- All managed email paths use `notify.mail.prestasikita.com` as the sender domain because it is the delegated, verified sending subdomain.
