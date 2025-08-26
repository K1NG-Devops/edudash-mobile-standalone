# Ops Scripts Index (Archived/Disabled)

This document inventories high-risk operational scripts found in the repository and documents their status and safe handling procedures.

IMPORTANT
- Never run destructive or RLS-bypassing scripts against production.
- All scripts listed below have been archived/disabled or flagged for removal from the repository to prevent accidental execution.
- If you truly need to run one of these scripts, copy it OUTSIDE this repository into a private ops vault, review it carefully, and remove the guard header. Ensure you are NOT connected to production.

How scripts are disabled
- SQL files: a guard block at the top raises an exception immediately:
  DO $$ BEGIN RAISE EXCEPTION 'Archived script disabled by default'; END $$;
- Shell scripts: a top-of-file guard exits unless ALLOW_DANGEROUS_SCRIPTS=true is set in the environment.

Archived/disabled in-repo (guard added)
- COMPLETE_DATABASE_RESET.sql
- COMPREHENSIVE_DATABASE_FIX.sql
- REMOTE_DATABASE_FIX.sql
- create_complete_superadmin.sql
- create_superadmin.sql
- create_superadmin_profile.sql
- fix_preschools_schema.sql
- update_superadmin_password.sql
- scripts/fix-rls-policies.sql
- optimize-system.sh
- verify-gpu.sh
- scripts/clean-console-logs.sh
- scripts/start-with-logs.sh

Pending review (move out of repo or add guards)
- disable_rls_and_create_user.sql
- disable_users_rls_test.sql
- remove_all_policies_and_test.sql
- reset_users_and_create_superadmin.sql
- reset_users_and_create_superadmin_fixed.sql
- create_users_table_no_rls.sql
- create_users_table_with_triggers.sql
- debug_users_table.sql
- patch_preschools_and_auth.sql
- fix_remote_rls.sql
- fix_teacher_creation_rls.sql
- restore_missing_tables.sql
- deploy.sh

Notes
- supabase/migrations and database-migrations directories contain historical migrations. These MUST NOT be altered, even if they look risky; they are part of schema history. Only run them as part of the controlled migration workflow.
- See .cursorrules for project-wide production safety rules (especially the strict no supabase db reset on production).

Procedure to run intentionally (local only)
1) Copy the needed script into a private ops location outside this repository.
2) Remove the guard header (SQL: the DO $$ ... $$ block; Shell: the ALLOW_DANGEROUS_SCRIPTS guard).
3) Verify your target is a local or staging environment and you’ve backed up data.
4) Have a second person review and approve.
5) Execute and capture logs for auditing.

