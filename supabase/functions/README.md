# Supabase Edge Functions

This directory contains server-side functions. These use server-only environment variables prefixed with `SERVER_` to avoid accidental exposure to the client bundle.

## Environment variables

Required at runtime (local or remote):
- `SUPABASE_URL` (non-secret; provided by Supabase automatically in production)
- `SUPABASE_ANON_KEY` (non-secret in client, but needed locally for some flows)
- `SERVER_SUPABASE_SERVICE_ROLE_KEY` (secret)

Function-specific secrets:
- `SERVER_RESEND_API_KEY` (send-email)
- `SERVER_NOTIFY_FUNCTION_TOKEN` (notify-user)
- `FROM_EMAIL` (optional; non-secret sender address used by send-email)

Note: For a transition period, functions also fall back to legacy names (e.g. `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `NOTIFY_FUNCTION_TOKEN`) if the new `SERVER_*` vars are not set.

## Local development

Quick helpers via Makefile and npm scripts are available:
- make func-serve FN=send-email [ENV=.env.server.local]
- make func-invoke FN=send-email DATA='{"to":"test@example.com","subject":"Hello","html":"<strong>Test</strong>"}' [ENV=.env.server.local]
- make func-deploy FN=send-email PROJECT_REF=<your-project-ref>

Or via npm scripts (pass vars as env):
- FN=send-email ENV=.env.server.local npm run func:serve
- FN=send-email ENV=.env.server.local DATA='{"to":"test@example.com","subject":"Hello","html":"<strong>Test</strong>"}' npm run func:invoke
- FN=send-email PROJECT_REF=<your-project-ref> npm run func:deploy

1) Create your local server env file from the template:
   cp .env.server.local.example .env.server.local
   # Fill in values in .env.server.local

2) Start the local Supabase stack (if not already running):
   supabase start

3) Serve a function locally with your local env file:
   supabase functions serve send-email --env-file ./.env.server.local
   supabase functions serve notify-user --env-file ./.env.server.local
   supabase functions serve notify-user-auth --env-file ./.env.server.local
   # ...and so on for other functions

4) Invoke a function locally (from another terminal):
   supabase functions invoke send-email \
     --env-file ./.env.server.local \
     --data '{"to":"test@example.com","subject":"Hello","html":"<strong>Test</strong>"}'

Notes:
- Never put server secrets in `.env.local` or any client env files.
- Keep `EXPO_PUBLIC_*` for client-visible values only.

## Deploying and setting remote secrets

1) Set secrets in your Supabase project (migration-friendly: set both legacy and new keys during transition):
   supabase secrets set --project-ref <your-project-ref> \
     SERVER_SUPABASE_SERVICE_ROLE_KEY=... \
     SERVER_RESEND_API_KEY=... \
     SERVER_NOTIFY_FUNCTION_TOKEN=... \
     FROM_EMAIL=noreply@edudashpro.org.za

   # Optionally set legacy names during migration window
   supabase secrets set --project-ref <your-project-ref> \
     SUPABASE_SERVICE_ROLE_KEY=... \
     RESEND_API_KEY=... \
     NOTIFY_FUNCTION_TOKEN=...

2) Deploy functions:
   supabase functions deploy send-email --project-ref <your-project-ref>
   supabase functions deploy notify-user --project-ref <your-project-ref>
   supabase functions deploy notify-user-auth --project-ref <your-project-ref>
   # ...and other functions as needed

## Security

Additionally, you can set secrets and deploy via npm scripts or Makefile:

- PROJECT_REF=<your-project-ref> SERVER_SUPABASE_SERVICE_ROLE_KEY=... SERVER_RESEND_API_KEY=... SERVER_NOTIFY_FUNCTION_TOKEN=... FROM_EMAIL=noreply@edudashpro.org.za npm run func:secrets
- PROJECT_REF=<your-project-ref> SUPABASE_SERVICE_ROLE_KEY=... RESEND_API_KEY=... NOTIFY_FUNCTION_TOKEN=... npm run func:secrets-legacy

- PROJECT_REF=<your-project-ref> FN=send-email npm run func:deploy
- Do not use `EXPO_PUBLIC_` for server secrets.
- Avoid logging secrets. Error logs in the code are structured to not print secret values.
- Prefer invoking privileged operations via Edge Functions rather than the client app.

