# Archived Migration Files

This folder contains SQL migration files that were moved from the root directory and database-migrations folder during cleanup on 2025-08-31.

## Contents

### Root Directory Files (Archived)
- `COMPLETE_DATABASE_RESET.sql` - Complete database schema reset script
- `COMPREHENSIVE_DATABASE_FIX.sql` - Comprehensive database fixes
- `create_*.sql` - Super admin creation scripts
- `fix_*.sql` - Various database fixes
- `REMOTE_DATABASE_FIX.sql` - Remote database fixes

### Database-Migrations Folder (Archived)
- `006_messaging_system.sql` - Comprehensive messaging system (different from current Supabase implementation)
- `007_add_missing_columns.sql` - Missing column additions
- `008_advanced_ai_features.sql` - Advanced AI features
- `db_audit.sql` - Database audit functionality

### Database/Migrations Folder (Archived)
- `notifications_and_activity.sql` - Notifications and activity tracking

## Note

The canonical database migrations are now located in `/supabase/migrations/` which follows the standard Supabase migration structure. The enhanced events system is fully implemented in the migration `20250831164218_enhanced_events_system.sql`.

These archived files are kept for reference but should not be used for active development.
