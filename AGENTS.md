# Project Architecture Rules

- Registration confirmation email is triggered only by the registration function after persistence; this prevents duplicate sends and keeps delivery failures separate from registration success.
