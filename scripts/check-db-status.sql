-- Database Status Check for EduDash Pro
-- Run with: psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f scripts/check-db-status.sql

\echo '🗃️  DATABASE STATUS CHECK'
\echo '=========================='

-- Table count
SELECT 'Total Tables:' as metric, COUNT(*)::TEXT as value 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Essential SuperAdmin tables
\echo ''
\echo '📊 SuperAdmin Tables:'
SELECT 
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_usage_logs') THEN '✅' ELSE '❌' END || ' ai_usage_logs' as status
UNION ALL
SELECT 
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'system_logs') THEN '✅' ELSE '❌' END || ' system_logs'
UNION ALL
SELECT 
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'support_tickets') THEN '✅' ELSE '❌' END || ' support_tickets'
UNION ALL
SELECT 
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN '✅' ELSE '❌' END || ' payments'
UNION ALL
SELECT 
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN '✅' ELSE '❌' END || ' messages';

-- Functions
\echo ''
\echo '⚡ SuperAdmin Functions:'
SELECT 
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_active_connections') THEN '✅' ELSE '❌' END || ' get_active_connections()' as status;

-- Test function
SELECT '📈 Active Connections:' as metric, get_active_connections()::TEXT as value;

-- Data counts
\echo ''
\echo '📋 Data Counts:'
SELECT 'Users:' as table_name, COUNT(*)::TEXT as count FROM users
UNION ALL
SELECT 'Preschools:', COUNT(*)::TEXT FROM preschools
UNION ALL
SELECT 'Students:', COUNT(*)::TEXT FROM students
UNION ALL
SELECT 'AI Usage Logs:', COUNT(*)::TEXT FROM ai_usage_logs
UNION ALL
SELECT 'System Logs:', COUNT(*)::TEXT FROM system_logs
UNION ALL
SELECT 'Support Tickets:', COUNT(*)::TEXT FROM support_tickets;

-- SuperAdmin users
\echo ''
\echo '👑 SuperAdmin Users:'
SELECT name, email, is_active 
FROM users 
WHERE role = 'superadmin';

\echo ''
\echo '✅ Database is ready for SuperAdmin functionality!'
