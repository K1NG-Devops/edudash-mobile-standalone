-- 2025-08-27: Enable RLS and user-scoped policies for message drafts
-- Safely idempotent: only create policies if table exists; drop-if-exists guards retained.

begin;

alter table if exists public.message_drafts enable row level security;

-- Create policies only if the table exists
do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'message_drafts'
  ) then
    -- Drop existing policies if present
    if exists (
      select 1 from pg_policies
      where schemaname='public' and tablename='message_drafts' and policyname='md_select_self'
    ) then
      execute 'drop policy md_select_self on public.message_drafts';
    end if;

    if exists (
      select 1 from pg_policies
      where schemaname='public' and tablename='message_drafts' and policyname='md_cud_self'
    ) then
      execute 'drop policy md_cud_self on public.message_drafts';
    end if;

    -- Select: only the sender can read their drafts
    if not exists (
      select 1 from pg_policies
      where schemaname='public' and tablename='message_drafts' and policyname='md_select_self'
    ) then
      execute $policy$create policy md_select_self
        on public.message_drafts
        for select
        to authenticated
        using (
          sender_id = (select id from public.users where auth_user_id = auth.uid())
        )$policy$;
    end if;

    -- Insert/Update/Delete: only the sender can manage their drafts
    if not exists (
      select 1 from pg_policies
      where schemaname='public' and tablename='message_drafts' and policyname='md_cud_self'
    ) then
      execute $policy$create policy md_cud_self
        on public.message_drafts
        for all
        to authenticated
        using (
          sender_id = (select id from public.users where auth_user_id = auth.uid())
        )
        with check (
          sender_id = (select id from public.users where auth_user_id = auth.uid())
        )$policy$;
    end if;
  else
    raise notice 'message_drafts table not found, skipping policy creation';
  end if;
end$$;

commit;

