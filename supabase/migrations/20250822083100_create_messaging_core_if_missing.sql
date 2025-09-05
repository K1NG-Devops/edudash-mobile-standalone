-- Create minimal messaging core tables if missing to satisfy downstream migrations
begin;

-- Messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.users(id) on delete cascade,
  preschool_id uuid references public.preschools(id) on delete cascade,
  subject text not null,
  content text not null,
  message_type text default 'private' check (message_type in ('announcement','private','group','emergency')),
  priority text default 'normal' check (priority in ('low','normal','high','urgent')),
  sent_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Message recipients
create table if not exists public.message_recipients (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.messages(id) on delete cascade,
  recipient_id uuid references public.users(id) on delete cascade,
  read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz default now()
);

commit;

