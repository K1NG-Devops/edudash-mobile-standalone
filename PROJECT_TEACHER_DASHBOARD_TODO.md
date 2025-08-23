## EduDash Pro — Teacher Dashboard Hardening Checklist

Audience: Frontend + DB engineers

Scope: Ensure teacher experience is tenant-safe, routes are valid, and bottom nav is role-aware.

### 1) Role-Aware Bottom Navigation
- File: `components/navigation/GlobalBottomNav.tsx`
- Change: Implemented role-aware tabs.
  - Teachers see: Overview (teacher dashboard), Students, Activities, Messages, Settings.
  - Admin/Principal see: Overview, Teachers, Students, Messages, Settings.
- Action: Verify UX and routing for teacher tabs.

### 2) Teacher Dashboard Queries — Tenant Isolation
- File: `app/screens/teacher-dashboard.tsx`
- Current safeguards:
  - Classes: filtered by `teacher_id` and `preschool_id`.
  - Students: filtered by class IDs and `is_active`.
  - Lessons: filtered by `preschool_id`.
  - Homework: filtered by `teacher_id` and `preschool_id` (added).
  - Activities: filtered by `preschool_id` if column exists; else RLS restricts by `lesson_id` linkage.
- Actions:
  - Confirm `activities` has `preschool_id`. If not, rely on RLS-by-lesson and keep code as is (filter tolerated by PostgREST if column exists only).
  - Confirm no 400s on lessons/activities/homework queries in web logs.

### 3) Broken/Missing Routes
- File: `app/screens/teacher-dashboard.tsx` (Quick Actions)
- Targets:
  - `/screens/ai/lesson-generator`
  - `/screens/ai/homework-grader`
  - `/screens/ai/stem-activities`
  - `/screens/analytics`
- Actions:
  - Ensure these screens exist under `app/screens/ai/` and `app/screens/analytics.tsx`, or update routes to existing alternatives.
  - Acceptance: Navigating from quick actions does not 404.

### 4) RLS Policies — Verify and Add Where Needed
Tables: `classes`, `students`, `lessons`, `homework_assignments`, `activities`

Recommended policies (pseudo-SQL using existing patterns):

1. Lessons (teacher read)
```
CREATE POLICY teacher_read_lessons ON public.lessons
FOR SELECT TO authenticated
USING (
  preschool_id = (SELECT u.preschool_id FROM public.users u WHERE u.auth_user_id = auth.uid())
);
```

2. Homework assignments (teacher read/write)
```
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
```

3. Activities (read via accessible lessons)
```
CREATE POLICY teacher_read_activities ON public.activities
FOR SELECT TO authenticated
USING (
  lesson_id IN (
    SELECT l.id FROM public.lessons l
    WHERE l.preschool_id = (SELECT u.preschool_id FROM public.users u WHERE u.auth_user_id = auth.uid())
  )
);
```

4. Classes (teacher read own)
```
CREATE POLICY teacher_read_classes ON public.classes
FOR SELECT TO authenticated
USING (
  teacher_id = (SELECT u.id FROM public.users u WHERE u.auth_user_id = auth.uid())
  AND preschool_id = (SELECT u.preschool_id FROM public.users u WHERE u.auth_user_id = auth.uid())
);
```

5. Students (teacher read for their classes)
```
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

Deployment: add policies via Supabase migration; do not reset DB. Verify with a teacher JWT.

### 5) Header Tenant Display
- Files: `app/(tabs)/dashboard.tsx`, `app/screens/teacher-dashboard.tsx`
- Status: Teacher header shows school name. Principal/Admin header already shows school.
- Action: Confirm correct school name on both dashboards.

### 6) Testing Checklist
- Sign-in as a teacher invited to a school.
- Observe school name in header.
- Teacher dashboard loads (no blocking errors); empty states appear if no data.
- Bottom nav shows teacher-specific tabs; all tabs navigate correctly.
- API calls return 200 and only tenant data.

### 7) Follow-ups
- Add teacher-focused screens for “My Classes” and “Class Management” if missing.
- Implement teacher analytics slice if `/screens/analytics` is shared.


