# EduDash Pro - Multi-Tenant Security Implementation

## 🔒 Row Level Security (RLS) Documentation

This document outlines the comprehensive Row Level Security (RLS) implementation for EduDash Pro, ensuring strict tenant isolation and preventing data leaks between schools.

---

## 📋 Table of Contents

1. [Security Overview](#security-overview)
2. [RLS Policy Structure](#rls-policy-structure)
3. [Tenant Isolation Model](#tenant-isolation-model)
4. [Helper Functions](#helper-functions)
5. [Policy Details by Table](#policy-details-by-table)
6. [Security Testing](#security-testing)
7. [Deployment Instructions](#deployment-instructions)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## 🛡️ Security Overview

### What is Row Level Security?

Row Level Security (RLS) is a PostgreSQL feature that allows database administrators to control which rows a user can access or modify. It works by adding conditions to SQL queries that filter results based on the current user's permissions.

### Why RLS for Multi-Tenant Applications?

- **Tenant Isolation**: Ensures schools can only access their own data
- **Defense in Depth**: Security at the database level, not just application level
- **Compliance**: Helps meet data privacy regulations (POPIA, GDPR)
- **Zero Trust**: Even if application code has bugs, the database enforces security

### EduDash Pro Security Model

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SuperAdmin    │    │  School Admin   │    │     Parent      │
│                 │    │                 │    │                 │
│ • All Schools   │    │ • Own School    │    │ • Own Children  │
│ • All Users     │    │ • School Users  │    │ • Own Data      │
│ • Platform Mgmt │    │ • School Data   │    │ • Limited Access│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🏗️ RLS Policy Structure

### Policy Categories

1. **Self-Access Policies**: Users can access their own data
2. **Tenant-Scoped Policies**: Users can access data within their school
3. **Role-Based Policies**: Different permissions based on user role
4. **Superadmin Policies**: Platform administrators with full access

### Security Principles Applied

- **Principle of Least Privilege**: Users get minimum necessary access
- **Role-Based Access Control (RBAC)**: Permissions based on user roles
- **Tenant Isolation**: Schools cannot access other schools' data
- **Data Sovereignty**: Users own and control their data

---

## 🔧 Helper Functions

Our RLS implementation uses optimized helper functions to avoid circular dependencies:

### Core Functions

```sql
-- Get current user's role (cached)
public.get_current_user_role() → TEXT

-- Get current user's school ID (cached)
public.get_current_user_preschool_id() → UUID

-- Check if current user is superadmin
public.is_superadmin() → BOOLEAN

-- Check if current user is school admin
public.is_school_admin() → BOOLEAN

-- Check if current user is teacher
public.is_teacher() → BOOLEAN

-- Check if user can access specific school
public.can_access_preschool(UUID) → BOOLEAN
```

### Function Benefits

- **Performance**: `STABLE` functions are cached per query
- **Security**: `SECURITY DEFINER` ensures consistent execution
- **Maintainability**: Centralized logic for role checking

---

## 📊 Policy Details by Table

### 👤 Users Table

**Security Goal**: Users can see their own profile + school members based on role

| Policy | Role | Action | Access |
|--------|------|---------|---------|
| `users_read_own_profile` | All | SELECT | Own profile only |
| `users_update_own_profile` | All | UPDATE | Own profile only |
| `users_insert_own_profile` | All | INSERT | During signup only |
| `superadmins_access_all_users` | SuperAdmin | ALL | All users |
| `school_admins_read_preschool_users` | School Admin | SELECT | School users |
| `school_admins_create_preschool_users` | School Admin | INSERT | Teachers/Parents in school |
| `school_admins_update_preschool_users` | School Admin | UPDATE | Non-admin users in school |
| `teachers_read_preschool_users` | Teacher | SELECT | School users |

### 🏫 Preschools Table

**Security Goal**: Users can only access their own school's information

| Policy | Role | Action | Access |
|--------|------|---------|---------|
| `users_read_own_preschool` | All | SELECT | Own school only |
| `superadmins_access_all_preschools` | SuperAdmin | ALL | All schools |
| `school_admins_update_own_preschool` | School Admin | UPDATE | Own school only |

### 👶 Students Table

**Security Goal**: Parents see their children, staff see school students

| Policy | Role | Action | Access |
|--------|------|---------|---------|
| `parents_read_own_children` | Parent | SELECT | Own children only |
| `school_staff_read_preschool_students` | School Staff | SELECT | School students |
| `school_admins_manage_preschool_students` | School Admin | ALL | School students |
| `superadmins_manage_all_students` | SuperAdmin | ALL | All students |

### 📚 Lessons Table

**Security Goal**: Public lessons for all, private lessons for school only

| Policy | Role | Action | Access |
|--------|------|---------|---------|
| `anyone_read_public_lessons` | All | SELECT | Public lessons |
| `users_read_preschool_lessons` | All | SELECT | School/global lessons |
| `teachers_manage_preschool_lessons` | Teachers/Admins | ALL | School lessons |
| `superadmins_manage_all_lessons` | SuperAdmin | ALL | All lessons |

### 💰 Payment Tables

**Security Goal**: Parents see their payments, school admins manage school payments

| Policy | Role | Action | Access |
|--------|------|---------|---------|
| `parents_read_own_fees` | Parent | SELECT | Own child's fees |
| `parents_read_own_payments` | Parent | SELECT | Own payments |
| `parents_create_own_payments` | Parent | INSERT | Own payments |
| `school_staff_manage_preschool_fees` | School Staff | ALL | School fees |
| `school_staff_manage_preschool_payments` | School Staff | ALL | School payments |

---

## 🧪 Security Testing

### Automated Testing

We've created comprehensive test scripts that:

1. **Create minimal test data** with clear "DELETE ME" markers
2. **Test tenant isolation** by attempting cross-tenant access
3. **Verify role-based permissions** across all user types
4. **Check for security vulnerabilities** like overly permissive policies
5. **Automatically clean up** all test data after completion

### Test Execution

```bash
# Run the RLS security test suite
psql -f supabase/migrations/20250806_secure_rls_policies.sql
psql -f test_rls_policies.sql
```

### Test Coverage

- ✅ Helper function existence
- ✅ RLS policy creation
- ✅ RLS enablement on tables
- ✅ Tenant isolation validation
- ✅ Role-based access control
- ✅ Dangerous policy detection
- ✅ Automatic test data cleanup

---

## 🚀 Deployment Instructions

### Prerequisites

- Supabase project with service role access
- PostgreSQL 12+ with RLS support
- Existing EduDash Pro database schema

### Deployment Steps

1. **Backup Current Database**
   ```bash
   pg_dump your_database > backup_before_rls.sql
   ```

2. **Apply RLS Policies**
   ```bash
   # Run the main RLS migration
   psql -f supabase/migrations/20250806_secure_rls_policies.sql
   ```

3. **Verify Implementation**
   ```bash
   # Run security tests
   psql -f test_rls_policies.sql
   ```

4. **Update Application Code** (if needed)
   - Ensure app uses authenticated users
   - Update any admin functions to work with RLS
   - Test all user flows

### Rollback Plan

If issues occur, you can temporarily disable RLS:

```sql
-- EMERGENCY: Disable RLS (use with caution!)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.preschools DISABLE ROW LEVEL SECURITY;
-- ... repeat for other tables

-- Then restore from backup if needed
```

---

## 📊 Monitoring and Maintenance

### Security Monitoring

1. **Policy Violations**: Monitor for RLS policy failures
2. **Performance Impact**: Watch for query performance changes
3. **User Access Patterns**: Audit unusual access attempts
4. **Helper Function Performance**: Monitor function execution times

### Regular Security Audits

Run these queries monthly:

```sql
-- Check for overly permissive policies
SELECT policyname, tablename 
FROM pg_policies 
WHERE cmd LIKE '%USING (true)%' 
  AND tablename NOT IN ('lesson_categories');

-- Verify RLS is enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname IN ('users', 'students', 'preschools') 
  AND relrowsecurity = false;

-- Count policies per table
SELECT tablename, COUNT(*) as policy_count 
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename 
ORDER BY policy_count;
```

### Performance Optimization

1. **Index Optimization**: Ensure indexes exist for RLS filter columns
2. **Function Caching**: Helper functions use `STABLE` for caching
3. **Query Planning**: Monitor execution plans for RLS-enabled queries
4. **Connection Pooling**: Use connection pooling to reduce function overhead

---

## 🔐 Security Best Practices

### Application Integration

1. **Always Use Authenticated Requests**: Never bypass authentication
2. **Validate User Context**: Ensure `auth.uid()` is set correctly
3. **Handle RLS Errors Gracefully**: Catch and handle permission errors
4. **Audit Trail**: Log security-relevant actions
5. **Regular Testing**: Test with different user roles regularly

### Database Maintenance

1. **Regular Backups**: Backup before any RLS changes
2. **Policy Documentation**: Document any custom policy changes
3. **Security Reviews**: Regular security audits and penetration testing
4. **Monitoring**: Set up alerts for RLS policy violations
5. **Updates**: Keep PostgreSQL and Supabase updated

---

## 🚨 Security Incident Response

### If Data Leak Suspected

1. **Immediate Response**:
   - Identify affected tables/users
   - Document the scope of potential exposure
   - Notify relevant stakeholders

2. **Investigation**:
   - Check RLS policy configurations
   - Review application logs
   - Analyze database access patterns

3. **Containment**:
   - Temporarily restrict access if needed
   - Fix policy vulnerabilities
   - Update application code if required

4. **Recovery**:
   - Verify fix effectiveness
   - Re-test all security controls
   - Document lessons learned

---

## 📞 Support and Contact

For security-related questions or concerns:

- **Email**: security@edudashpro.org.za
- **Documentation**: This file and inline code comments
- **Testing**: Run `test_rls_policies.sql` for validation

---

## 📝 Change Log

### Version 1.0 (2025-01-06)
- Initial RLS implementation
- Comprehensive tenant isolation
- Automated security testing
- Full documentation

### Future Enhancements
- [ ] Audit table for security events
- [ ] Real-time monitoring dashboard
- [ ] Advanced threat detection
- [ ] Compliance reporting tools

---

**🔒 Remember: Security is everyone's responsibility. When in doubt, ask questions and test thoroughly!**
