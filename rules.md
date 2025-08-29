# EduDash Pro — Strict Engineering Rules (Aug 2025)

Rule precedence
- 1) WARP.md is the ultimate source of truth (highest precedence)
- 2) This rules.md augments WARP.md with enforcement for current issues
- 3) .cursorrules provides a concise, tool-facing subset of these rules
- If any rule conflicts, follow the earlier rule in this list

Critical production constraints
- No database resets. All schema changes via migrations only
- No mock data in DB or code. Always handle empty/loading/error states
- Do not modify working auth configuration (contexts/SimpleWorkingAuth.tsx)
- RLS must remain secure and enforced for all tenant data access

AI and secrets hardening
- Do not call Anthropic from the client. All AI requests must go through Supabase Edge Function: functions/v1/ai-proxy
- Never bundle AI keys. Use server-side env (SERVER_ANTHROPIC_API_KEY) in edge functions only
- All AI usage must be logged server-side to ai_usage_logs with: user_id, feature, created_at, tokens_used, cost_usd (if known)
- Client-side AsyncStorage usage tracking is allowed for UX only, not billing or limits
- Enforce subscription-tier usage limits in the ai-proxy function before invoking AI
- AI prompts must be child-safe, age-appropriate, and South Africa–contextual
- Strictly redact PII before sending to AI; never include auth tokens or secrets in prompts

Server-state and offline policy
- All server state fetching must use TanStack Query. Do not fetch directly in components with useEffect
- Provide tenant-aware query keys: include preschool_id and user role in the key
- Enable offline persistence with AsyncStorage and backoff retries
- Mutations must use optimistic updates where safe, and gracefully reconcile on failure

Observability and privacy
- Sentry and PostHog are required in production builds, disabled by default in development
- Do not send PII to analytics. Identify users via hashed IDs only (e.g., sha256 of auth_user_id)
- Tag all events with: role, preschool_id (hashed), app version, platform, network status
- All critical admin and superadmin actions must write to audit_logs with timestamp and actor

RLS and data access
- Every query that reads tenant data must scope by preschool_id; prefer RPCs or views that enforce RLS
- Super-admin operations must run through server functions with service role; never bypass RLS in the client
- The client must not include service role keys. Dev-only admin client must be disabled in production

Internationalization
- All new UI strings must be externalized and routed through i18n. Default English with Afrikaans and isiZulu stubs
- AI-generated parent output should support the requested language when available

Performance and mobile-first
- Use FlashList for any list that can exceed 20 items and provide estimatedItemSize
- Prefer expo-image with caching for remote images; never render unbounded images
- Code-split heavy screens (e.g., super-admin) with lazy routing
- Keep production console output minimal and avoid noisy logging

Advertising and safety
- Ads must never render during learning interactions or on children’s content screens
- Ads are allowed for freemium only and must be educational, age-appropriate, and non-intrusive
- Ad placement must be gated behind EXPO_PUBLIC_ENABLE_ADS and use test IDs in non-production

Testing and environments
- All new features must ship with unit tests. Critical flows must have at least one e2e test
- Tests must use a local/test Supabase instance. Never run destructive tests against production
- Protect internal scripts with environment checks to prevent accidental prod operations

Notifications
- Push notifications must be opt-in, localized, and respect quiet hours where applicable
- No promotional notifications to child accounts; promotions target parents/guardians only

Security hygiene
- Never log secrets or tokens. Never output secrets to console or errors
- Use HTTPS for all network requests. Validate inputs and sanitize outputs in edge functions
- On sign-out, ensure all tokens are cleared across SecureStore and AsyncStorage (already implemented)

Implementation checklists
- AI proxy function
  - Validate user via supabase.auth.getUser() using request Authorization header
  - Load user profile and subscription tier via service role client
  - Enforce monthly usage limits based on ai_usage_logs
  - Invoke Anthropic with server-side API key
  - Insert ai_usage_logs with tokens and optional cost
  - Return minimal content payload to client
- React Query
  - Add QueryClient with sensible defaults (staleTime, retry/backoff)
  - Add persisted cache via AsyncStorage persister
  - Provide a tenant-aware QueryProvider and wrap root layout
- Monitoring
  - Initialize Sentry and PostHog on app bootstrap, gated by EXPO_PUBLIC_ENABLE_* envs
  - Scrub PII and avoid storing sensitive payloads in breadcrumbs/events

How to propose changes
- Reference this rules.md in PR descriptions when adding AI endpoints, new data fetches, or analytics
- Include a brief “Rules compliance” section in PRs covering AI, RLS, state management, and observability

