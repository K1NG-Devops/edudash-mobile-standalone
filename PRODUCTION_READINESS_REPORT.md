## EduDash Pro — Production Readiness Report (Mobile-First, Multi‑Tenant)

Date: {{update when shared}}
Owner: Platform Engineering

This report summarizes the current production posture of the EduDash Pro app, highlights risks, and lists prioritized, actionable TODOs across Frontend, Supabase (DB/RLS), Edge Functions, DevOps, and Observability.

### High‑Level Status
- Authentication: Working and stable (email/password). Session lifecycle OK.
- Multi‑Tenancy: RLS present; teacher/principal policies need a final pass (see DB TODOs).
- Teacher Invitation Flow: Fixed (Edge Function `redeem-invitation`), still requires E2E validation.
- Navigation: Role-aware bottom nav implemented; teacher and principal differ, as required.
- SuperAdmin: Functional baseline; SaaS controls present (needs polish for support ops).
- Migrations: Production only, no resets. Recent RLS migrations applied.
- Observability/Analytics: Basic logs; PostHog/Mixpanel/Sentry not fully wired.
- Notifications/Ads/Billing: Placeholders; not production-configured.

---

### Architecture & Config
- Expo + Supabase + Edge Functions (Deno) + TypeScript.
- Global bottom nav component: `components/navigation/GlobalBottomNav.tsx` — now role-aware via `useAuth()`.
- Supabase client: `lib/supabase.ts` — service role client guarded by `EXPO_PUBLIC_ENABLE_ADMIN_CLIENT` (dev only). Good.
- Environment: Uses `EXPO_PUBLIC_*` for client values. Service role never in production app. Good.

Risks
- Missing CI gating for migrations prior to deploy.
- No environment schema check (dotenv validation).

TODOs
1) Add env validation (zod) for required keys; fail fast on boot.
2) Create CI job to run `npx supabase db push --dry-run` on PRs touching `/supabase/migrations`.

---

### Multi‑Tenancy & RLS (Supabase)
Current
- RLS enabled broadly. Invitation systems exist (`invitation_codes`, `school_invitation_codes`).
- Policies in `20250822083608_remote_schema.sql`; extra policies added for `school_invitation_codes`.

Gaps (Teacher flows)
- Lessons: Ensure teacher read policy by tenant.
- Homework assignments: Ensure teacher select/insert by `teacher_id` + tenant.
- Activities: Read access constrained via lesson membership/tenant (if table lacks `preschool_id`, restrict via join).
- Students: Teachers should only see students in their classes.
- Classes: Teachers read only own classes.

DB TODOs (copy/paste into migration; adjust names if policies exist)
```sql
-- Teacher read lessons by tenant
CREATE POLICY teacher_read_lessons ON public.lessons
FOR SELECT TO authenticated
USING (
  preschool_id = (SELECT u.preschool_id FROM public.users u WHERE u.auth_user_id = auth.uid())
);

-- Teacher manage homework by teacher + tenant
CREATE POLICY teacher_manage_homework ON public.homework_assignments
FOR ALL TO authenticated
USING (
  teacher_id = (SELECT u.id FROM public.users u WHERE u.auth_user_id = auth.uid())
  AND preschool_id = (SELECT u.preschool_id FROM public.users u WHERE u.auth_user_id = auth.uid())
)
WITH CHECK (
  teacher_id = (SELECT u.id FROM public.users u WHERE u.auth_user_id = auth.uid())
  AND preschool_id = (SELECT u.preschool_id FROM public.users u WHERE u.auth_user_id = auth.uid())
);

-- Activities read restricted via lessons within tenant
CREATE POLICY teacher_read_activities ON public.activities
FOR SELECT TO authenticated
USING (
  lesson_id IN (
    SELECT l.id FROM public.lessons l
    WHERE l.preschool_id = (SELECT u.preschool_id FROM public.users u WHERE u.auth_user_id = auth.uid())
  )
);

-- Teacher read own classes
CREATE POLICY teacher_read_classes ON public.classes
FOR SELECT TO authenticated
USING (
  teacher_id = (SELECT u.id FROM public.users u WHERE u.auth_user_id = auth.uid())
  AND preschool_id = (SELECT u.preschool_id FROM public.users u WHERE u.auth_user_id = auth.uid())
);

-- Students visible if in teacher's classes
CREATE POLICY teacher_read_students ON public.students
FOR SELECT TO authenticated
USING (
  class_id IN (
    SELECT c.id FROM public.classes c
    WHERE c.teacher_id = (SELECT u.id FROM public.users u WHERE u.auth_user_id = auth.uid())
      AND c.preschool_id = (SELECT u.preschool_id FROM public.users u WHERE u.auth_user_id = auth.uid())
  )
);
```

Validation Steps
- Use a teacher JWT; verify 200s for lessons/classes/students/homework/activities endpoints and that results are tenant-only.

---

### Edge Functions
- `supabase/functions/redeem-invitation/index.ts`:
  - Fixed RPC param mismatch; now creates/updates auth user and profile; marks code used; writes audit log.
  - Validates code against `school_invitation_codes` and legacy tables.

TODOs
1) Add structured error responses (code, message) and exhaustive unit tests (Deno) for all branches (expired, max_uses, mismatched email, already exists).
2) Rate-limit or add minimal abuse protection (e.g., IP window limit) via function-level logic.

---

### Frontend — Navigation & Role UX
Current
- Role-aware nav is implemented (`GlobalBottomNav`). Teacher tabs: Overview (Teacher), Students, Activities, Messages, Settings.
- Principal/Admin: Overview, Teachers, Students, Messages, Settings.

TODOs
1) Map `Teachers` tab to an Admin-only page; hide for teacher role (already hidden in role-aware nav).
2) Confirm quick actions routes in `app/screens/teacher-dashboard.tsx` exist; create stubs if needed.

---

### Frontend — Teacher Dashboard (Status)
- Queries hardened: tenant filters for homework; lessons include tenant; activities try tenant filter and rely on RLS via lessons.
- Header shows school name via `preschools` lookup.
- Errors no longer block the entire screen (warn and continue with empty lists).

TODOs
1) Add EmptyState components where lists are empty.
2) Add pull-to-refresh and shimmer loaders for each list region.
3) Replace random AI insights placeholders with real data or hide until available.

---

### Performance & Offline
Current
- Uses Expo; `FlashList` recommended pattern appears in codebase; ensure actual teacher lists use it where applicable.

TODOs
1) Confirm lists are `FlashList` (students/classes). If not, migrate to `@shopify/flash-list`.
2) Add react-query (or expo-query) for caching + stale-while-revalidate and offline retries.
3) Image optimization: ensure `expo-image` for any images; set cachePolicy.

---

### Observability & Analytics
Current
- Console logs present; no unified error tracking.

TODOs
1) Add Sentry for JS runtime + Edge Functions: release tagging, source maps.
2) Add PostHog/Mixpanel events for key funnels (invite redeem, first class created, lesson created, parent join).
3) Add Supabase log drains for auditing sensitive flows (invites, RLS denials).

---

### Notifications & Push
Current
- Expo Notifications scaffolding comment; not fully wired.

TODOs
1) Choose FCM or OneSignal; implement device token registration table and opt‑in flows per role.
2) Add server job/edge function to send transactional notifications (e.g., new homework assigned).

---

### Monetization (Subscriptions/Ads)
Current
- Ads not enabled in app; subscriptions not integrated.

TODOs
1) Stripe/PayFast integration per market decision; add subscription enforcement middleware (features by tier).
2) For free tier parents: integrate AdMob with child‑safe settings; ensure placement rules (never during learning activity).

---

### Security & Compliance
Current
- Service role key never shipped to production app. Good.
- RLS is the main guardrail; tenant scoping in code strengthened.

TODOs
1) SSO/Password reset flows — verify redirect URLs and domain allowlists.
2) PII review: ensure no sensitive fields in logs; add field-level encryption for highly sensitive notes if needed.
3) Add export/delete endpoints for data subject requests.

---

### Testing & QA
TODOs
1) Unit tests: Edge Functions (invite redemption), tenant helper policies.
2) E2E tests: Teacher invite → sign in → dashboard loads → class listing.
3) Snapshot tests for critical screens (teacher/principal dashboards).
4) Performance audits on low‑end Android devices (target 30–60 fps; measure list render times).

---

### DevOps & Release
TODOs
1) Setup EAS builds per environment; configure runtime envs via `app.config.js`.
2) Create GitHub Actions:
   - Lint/Typecheck.
   - Run `npx supabase db push --dry-run` for migration PRs.
   - Optional: run detox/maestro for smoke tests.
3) Release checklist: migrations applied → app release → smoke tests.

---

### Accessibility & Localization
TODOs
1) Add RN accessibility props for buttons and inputs (labels, roles).
2) Integrate `react-native-localize` and i18n scaffolding (EN, Afrikaans, isiZulu) for visible strings.

---

### Actionable, Prioritized Backlog

#### Critical (Blockers)
- [DB] Ensure final teacher RLS policies as listed above; migrate and verify with teacher JWT.
- [FE] Ensure all quick action routes exist (or update targets). Avoid 404s.

#### High
- [FE] Add EmptyStates + pull‑to‑refresh + loaders on Teacher Dashboard.
- [OBS] Add Sentry + PostHog wiring.
- [DEVOPS] Add CI migration gate + EAS profiles.

#### Medium
- [FE] Migrate heavy lists to FlashList where missing.
- [NOTIF] Implement push notifications MVP (device tokens + one transactional event).
- [SEC] Add env validation and secrets audit.

#### Low
- [MON] Ads integration plan for parent free tier.
- [BILL] Hook Stripe/PayFast with feature flag (off by default until QA complete).

---

### Verification Script Snippets (for DB Engineer)

Check a policy exists and is enabled:
```sql
SELECT policyname, permissive, roles
FROM pg_policies WHERE schemaname='public' AND tablename='lessons';
```

Run a scoped read as teacher (using psql with JWT):
```sql
-- Set request.jwt.claims to a teacher token, then
select count(*) from public.lessons;
```

---

### Final Notes
The app is close to production readiness for core flows. The remaining items are primarily policy hardening, role‑segmented UX, route hygiene, observability, and deploy automation. Once the Critical + High sections are closed and smoke tests pass on low‑end Android, we’re ready for a canary release.


