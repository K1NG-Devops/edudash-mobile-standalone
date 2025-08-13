-- Add additional tables and columns referenced by the app code
begin;

-- assessments
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  preschool_id uuid references public.preschools(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  assessment_type text,
  score numeric,
  grade text,
  skills_assessed text[],
  notes text,
  created_at timestamptz default now()
);

-- message threads & participants
create table if not exists public.message_threads (
  id uuid primary key default gen_random_uuid(),
  participants uuid[] not null default '{}',
  preschool_id uuid not null references public.preschools(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  last_message_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.message_participants (
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  last_read_at timestamptz,
  is_muted boolean default false,
  primary key (thread_id, user_id)
);

-- announcements
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  preschool_id uuid not null references public.preschools(id) on delete cascade,
  title text not null,
  content text not null,
  priority text,
  created_at timestamptz default now()
);

-- simple notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  message_id uuid references public.messages(id) on delete set null,
  title text not null,
  message text not null,
  type text,
  data jsonb default '{}'::jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- support tickets & system logs
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  subject text not null,
  status text default 'open',
  created_at timestamptz default now()
);

create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  log_type text,
  severity text,
  message text,
  created_at timestamptz default now()
);

-- learning_activities used on parent dashboard
create table if not exists public.learning_activities (
  id uuid primary key default gen_random_uuid(),
  preschool_id uuid references public.preschools(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  activity_type text,
  title text,
  description text,
  completed_at timestamptz
);

-- view to satisfy code referencing 'assignments' (map to homework_assignments)
do $$
begin
  if not exists (
    select 1 from pg_views where schemaname = 'public' and viewname = 'assignments'
  ) then
    execute 'create view public.assignments as
      select id, class_id, title, description, due_date_offset_days as due_date, created_at
      from public.homework_assignments';
  end if;
end$$;

-- payment related adjustments
alter table if exists public.payment_fees
  add column if not exists title text,
  add column if not exists is_overdue boolean default false,
  add column if not exists is_paid boolean default false;

alter table if exists public.payments
  add column if not exists status text,
  add column if not exists paid_at timestamptz,
  add column if not exists due_date date;

-- payment methods config
create table if not exists public.payment_methods_config (
  id uuid primary key default gen_random_uuid(),
  preschool_id uuid references public.preschools(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  display_name text not null,
  is_enabled boolean default true,
  is_default boolean default false,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

-- messages extra preview column
alter table if exists public.messages
  add column if not exists preview text;

-- students/avatar
alter table if exists public.students
  add column if not exists avatar_url text;

-- classes extra info
alter table if exists public.classes
  add column if not exists age_min integer,
  add column if not exists age_max integer,
  add column if not exists description text;

-- users first/last name support
alter table if exists public.users
  add column if not exists first_name text,
  add column if not exists last_name text;

commit;

