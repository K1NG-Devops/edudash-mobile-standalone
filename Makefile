# Makefile for Supabase Edge Functions helpers
# Usage examples:
#  make func-serve FN=send-email [ENV=.env.server.local]
#  make func-invoke FN=send-email DATA='{"to":"me@example.com","subject":"Hi","html":"<b>Test</b>"}' [ENV=.env.server.local]
#  make func-deploy FN=send-email PROJECT_REF=abc123
#  make secrets PROJECT_REF=abc123 SERVER_SUPABASE_SERVICE_ROLE_KEY=... SERVER_RESEND_API_KEY=... SERVER_NOTIFY_FUNCTION_TOKEN=...
#  make secrets-legacy PROJECT_REF=abc123 SUPABASE_SERVICE_ROLE_KEY=... RESEND_API_KEY=... NOTIFY_FUNCTION_TOKEN=...

ENV ?= .env.server.local
FN ?=
PROJECT_REF ?=
DATA ?=

.PHONY: func-serve func-invoke func-deploy secrets secrets-legacy

func-serve:
	@if [ -z "$(FN)" ]; then echo "FN is required, e.g. make func-serve FN=send-email"; exit 1; fi
	supabase functions serve $(FN) --env-file $(ENV)

func-invoke:
	@if [ -z "$(FN)" ]; then echo "FN is required, e.g. make func-invoke FN=send-email DATA='{}'"; exit 1; fi
	@if [ -z "$(DATA)" ]; then echo "DATA is required, e.g. DATA='{"to":"..."}'"; exit 1; fi
	supabase functions invoke $(FN) --env-file $(ENV) --data '$(DATA)'

func-deploy:
	@if [ -z "$(FN)" ]; then echo "FN is required, e.g. make func-deploy FN=send-email PROJECT_REF=..."; exit 1; fi
	@if [ -z "$(PROJECT_REF)" ]; then echo "PROJECT_REF is required"; exit 1; fi
	supabase functions deploy $(FN) --project-ref $(PROJECT_REF)

secrets:
	@if [ -z "$(PROJECT_REF)" ]; then echo "PROJECT_REF is required"; exit 1; fi
	supabase secrets set --project-ref $(PROJECT_REF) \
		SERVER_SUPABASE_SERVICE_ROLE_KEY='$(SERVER_SUPABASE_SERVICE_ROLE_KEY)' \
		SERVER_RESEND_API_KEY='$(SERVER_RESEND_API_KEY)' \
		SERVER_NOTIFY_FUNCTION_TOKEN='$(SERVER_NOTIFY_FUNCTION_TOKEN)' \
		FROM_EMAIL='$(FROM_EMAIL)'

secrets-legacy:
	@if [ -z "$(PROJECT_REF)" ]; then echo "PROJECT_REF is required"; exit 1; fi
	supabase secrets set --project-ref $(PROJECT_REF) \
		SUPABASE_SERVICE_ROLE_KEY='$(SUPABASE_SERVICE_ROLE_KEY)' \
		RESEND_API_KEY='$(RESEND_API_KEY)' \
		NOTIFY_FUNCTION_TOKEN='$(NOTIFY_FUNCTION_TOKEN)'

