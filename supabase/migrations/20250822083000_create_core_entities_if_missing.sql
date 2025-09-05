-- Create core entities if missing to satisfy downstream migrations and app logic
-- This migration is idempotent and only creates tables that are missing in some environments.

begin;

-- Classes table (minimal schema aligned with app expectations)
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age_group text,
  preschool_id uuid not null references public.preschools(id) on delete cascade,
  teacher_id uuid references public.users(id) on delete set null,
  capacity integer default 20,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  room_number text,
  current_enrollment integer not null default 0,
  max_capacity integer not null default 20,
  age_min integer,
  age_max integer,
  age_group_id uuid
);

create index if not exists idx_classes_preschool_id on public.classes(preschool_id);
create index if not exists idx_classes_teacher_id on public.classes(teacher_id);

-- Students table (minimal schema aligned with app expectations)
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  preschool_id uuid not null references public.preschools(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  parent_id uuid references public.users(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_students_preschool_id on public.students(preschool_id);
create index if not exists idx_students_class_id on public.students(class_id);
create index if not exists idx_students_parent_id on public.students(parent_id);

commit;

