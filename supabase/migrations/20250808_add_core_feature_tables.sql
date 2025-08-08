-- Add core feature tables and columns required by app code
-- Safe to run multiple times (IF NOT EXISTS / guards)

begin;

-- classroom_reports
create table if not exists public.classroom_reports (
  id uuid primary key default gen_random_uuid(),
  preschool_id uuid not null references public.preschools(id) on delete cascade,
  teacher_id uuid not null references public.users(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid null references public.classes(id) on delete set null,
  report_type text not null check (report_type in ('daily','weekly','monthly')),
  report_date date not null,
  activities_summary jsonb not null default '{}'::jsonb,
  total_activities integer not null default 0,
  behavior_notes text,
  mood_rating integer,
  participation_level text check (participation_level in ('low','moderate','high','excellent')),
  social_interactions text,
  learning_highlights text,
  skills_developed text[],
  areas_for_improvement text,
  achievement_badges text[],
  meals_eaten text[],
  nap_time_start timestamptz,
  nap_time_end timestamptz,
  diaper_changes integer,
  bathroom_visits integer,
  health_observations text,
  incidents text,
  medications_given text[],
  temperature_checks jsonb,
  parent_message text,
  follow_up_needed boolean,
  next_steps text,
  media_highlights text[],
  photo_count integer,
  is_sent_to_parents boolean not null default false,
  sent_at timestamptz,
  parent_viewed_at timestamptz,
  parent_acknowledgment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- events
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  preschool_id uuid not null references public.preschools(id) on delete cascade,
  title text not null,
  description text,
  event_date date not null,
  event_time text,
  event_type text,
  location text,
  is_mandatory boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  preschool_id uuid not null references public.preschools(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  subject text,
  preview text,
  content text,
  sent_at timestamptz,
  is_read boolean not null default false,
  priority text,
  created_at timestamptz not null default now()
);

-- video call sessions
create table if not exists public.video_call_sessions (
  id uuid primary key default gen_random_uuid(),
  preschool_id uuid not null references public.preschools(id) on delete cascade,
  host_id uuid not null references public.users(id) on delete cascade,
  status text,
  started_at timestamptz,
  ended_at timestamptz,
  joined_participants jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- payments core
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  preschool_id uuid not null references public.preschools(id) on delete cascade,
  parent_id uuid references public.users(id) on delete set null,
  student_id uuid references public.students(id) on delete set null,
  fee_ids uuid[] default '{}',
  amount numeric not null default 0,
  currency text not null default 'ZAR',
  payment_method text,
  payment_reference text,
  status text not null default 'pending',
  failure_reason text,
  processed_at timestamptz,
  attachment_url text,
  submitted_at timestamptz,
  description text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_fees (
  id uuid primary key default gen_random_uuid(),
  preschool_id uuid not null references public.preschools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  fee_type text not null,
  title text not null,
  description text,
  amount numeric not null,
  currency text not null default 'ZAR',
  due_date date not null,
  is_recurring boolean not null default false,
  recurring_frequency text,
  is_overdue boolean not null default false,
  is_paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_receipts (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  preschool_id uuid not null references public.preschools(id) on delete cascade,
  receipt_number text not null,
  amount numeric not null,
  currency text not null default 'ZAR',
  fees_breakdown jsonb,
  payment_date timestamptz,
  payment_method text,
  receipt_data jsonb,
  created_at timestamptz not null default now()
);

-- add helpful generated columns if missing
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'students' and column_name = 'full_name'
  ) then
    alter table public.students
      add column full_name text generated always as (first_name || ' ' || last_name) stored;
  end if;
end$$;

-- Age: cannot use generated column with non-immutable expression; use trigger to maintain instead
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'students' and column_name = 'age'
  ) then
    alter table public.students add column age integer;
    -- backfill
    update public.students
      set age = date_part('year', age(current_date, date_of_birth))::int
      where age is null;
    -- create or replace trigger function
    create or replace function public.set_student_age()
    returns trigger
    language plpgsql
    as $fn$
    begin
      new.age := date_part('year', age(current_date, new.date_of_birth))::int;
      return new;
    end;
    $fn$;
    -- attach triggers
    drop trigger if exists trg_set_student_age_ins on public.students;
    create trigger trg_set_student_age_ins
      before insert on public.students
      for each row execute function public.set_student_age();
    drop trigger if exists trg_set_student_age_upd on public.students;
    create trigger trg_set_student_age_upd
      before update of date_of_birth on public.students
      for each row execute function public.set_student_age();
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'classes' and column_name = 'grade_level'
  ) then
    alter table public.classes add column grade_level text;
  end if;
end$$;

commit;


