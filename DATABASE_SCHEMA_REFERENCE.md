# EduDash Pro Database Schema Reference

## 🔐 **CRITICAL DATABASE CONNECTION RULES**

### **Strict Database Connection Protocol:**
```bash
# ALWAYS use Supabase local connection (when running locally):
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# NEVER use:
# psql "postgresql://postgres:postgres@localhost:5432/edudash_pro"  # ❌ Wrong
# psql "postgresql://postgres:postgres@localhost:54322/postgres"   # ❌ Wrong host

# Check Supabase status first:
npx supabase status

# Connection format:
# postgresql://[user]:[password]@[host]:[port]/[database]
# WHERE:
# - user: postgres
# - password: postgres  
# - host: 127.0.0.1 (NOT localhost)
# - port: 54322 (Supabase local DB port, NOT 5432)
# - database: postgres (Supabase uses postgres as main DB name)
```

## 📊 **CURRENT DATABASE TABLES & SCHEMAS**

### **Core Tables (public schema):**

#### **preschools** table:
```sql
id                      uuid PRIMARY KEY
name                    varchar NOT NULL
address                 text
phone                   varchar
email                   varchar NOT NULL UNIQUE
logo_url                text
subscription_plan       varchar (trial, basic, premium)
subscription_status     varchar (pending, active, inactive, cancelled)
subscription_start_date date
subscription_end_date   date
billing_email           varchar
max_students            integer (DEFAULT 50)
max_teachers            integer (DEFAULT 10)
onboarding_status       varchar (requested, approved, setup, completed)
setup_completed         boolean (DEFAULT false)
tenant_slug             varchar UNIQUE
domain                  varchar
timezone                varchar (DEFAULT 'UTC')
created_at              timestamptz (DEFAULT now())
updated_at              timestamptz (DEFAULT now())
```

#### **users** table:
```sql
id                               uuid PRIMARY KEY
email                            varchar NOT NULL UNIQUE
password_hash                    varchar
name                             varchar NOT NULL
role                             varchar NOT NULL (superadmin, admin, principal, teacher, parent)
preschool_id                     uuid REFERENCES preschools(id)
avatar_url                       text
phone                            varchar
address                          text
home_address                     text
is_active                        boolean (DEFAULT true)
auth_user_id                     uuid REFERENCES auth.users(id)
profile_completion_status        varchar (DEFAULT 'incomplete')
profile_completed_at             timestamptz
subscription_tier                varchar (DEFAULT 'free')
subscription_features            jsonb (DEFAULT '{}')
subscription_expires_at          timestamptz
work_company                     varchar
work_position                    varchar
work_address                     text
work_phone                       varchar
relationship_to_child            varchar (DEFAULT 'parent')
pickup_authorized                text
emergency_contact_1_name         varchar
emergency_contact_1_phone        varchar
emergency_contact_1_relationship varchar
emergency_contact_2_name         varchar
emergency_contact_2_phone        varchar
emergency_contact_2_relationship varchar
home_city                        varchar
home_postal_code                 varchar
created_at                       timestamptz (DEFAULT now())
updated_at                       timestamptz (DEFAULT now())
first_name                       text
last_name                        text
```

#### **preschool_onboarding_requests** table:
```sql
id                  uuid PRIMARY KEY
preschool_name      varchar NOT NULL
admin_name          varchar NOT NULL
admin_email         varchar NOT NULL
phone               varchar
address             text
number_of_students  integer
number_of_teachers  integer
message             text
status              varchar (pending, approved, rejected)
created_at          timestamptz (DEFAULT now())
reviewed_by         uuid REFERENCES users(id)
reviewed_at         timestamptz
```

### **System Tables:**
- `students` - Student records
- `classes` - Class management
- `age_groups` - Age group definitions
- `lessons` - Lesson content
- `lesson_categories` - Lesson categorization
- `notifications` - System notifications
- `activity_logs` - User activity tracking
- `system_logs` - System-wide logging

### **Auth Schema Tables (Supabase managed):**
- `auth.users` - Supabase authentication users
- `auth.sessions` - User sessions
- `auth.refresh_tokens` - Token management

## 🚨 **CRITICAL DEVELOPMENT RULES**

### **1. Column Naming Conventions:**
- Use `snake_case` for all column names
- Use `created_at` and `updated_at` for timestamps
- Use `is_active` for status flags
- Use `preschool_id` for school references
- Use `auth_user_id` for auth user references

### **2. Required Columns for New Tables:**
```sql
id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
created_at timestamptz DEFAULT now(),
updated_at timestamptz DEFAULT now()
```

### **3. Foreign Key Standards:**
- `preschool_id uuid REFERENCES preschools(id) ON DELETE CASCADE`
- `user_id uuid REFERENCES users(id) ON DELETE CASCADE`  
- `auth_user_id uuid REFERENCES auth.users(id)`

### **4. RLS (Row Level Security) Policy Requirements:**
- ALL tables MUST have RLS enabled
- Super admin bypass: `(auth.jwt() ->> 'role' = 'superadmin')`
- Tenant isolation: `preschool_id = (auth.jwt() ->> 'preschool_id')::uuid`

## 📝 **MIGRATION STANDARDS**

### **Migration File Naming:**
```
YYYYMMDD_HHMMSS_descriptive_name.sql
Example: 20250814_065000_add_missing_user_columns.sql
```

### **Migration Template:**
```sql
-- Description: [What this migration does]
-- Date: [YYYY-MM-DD]
-- Author: [Your name]

-- Add new columns/tables
CREATE TABLE IF NOT EXISTS new_table (...);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_table_column ON table(column);

-- Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "policy_name" ON new_table FOR SELECT USING (condition);

-- Add comments
COMMENT ON TABLE new_table IS 'Description of table purpose';
```

## ⚠️ **COMMON PITFALLS TO AVOID**

1. **Never use `localhost`** - always use `127.0.0.1`
2. **Never use port `5432`** - always use `54322` for local Supabase
3. **Never create columns without checking existing schema first**
4. **Never skip RLS policies on new tables**
5. **Always check for existing constraints before adding new ones**
6. **Always use transactions for multi-step operations**

## 🔍 **Database Verification Commands**

```bash
# Check all tables
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname IN ('public', 'auth') ORDER BY schemaname, tablename;"

# Check specific table schema
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'table_name' AND table_schema = 'public' ORDER BY ordinal_position;"

# Check data
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "SELECT * FROM public.table_name ORDER BY created_at DESC LIMIT 5;"
```

## 🏥 **Current Database State (as of 2025-08-14)**

- ✅ **Super admin users exist:** 2 users with role 'superadmin'
- ✅ **Onboarding request exists:** 1 approved request for "Young Eagles"
- ❌ **No schools created:** preschools table is empty 
- ❌ **No principal users created:** no principal role users exist
- 🔧 **Issue:** School creation process failing after approval

## 📋 **Next Actions Required**

1. Debug why school creation is failing in `SuperAdminDataService.createSchool()`
2. Test the resend instructions functionality 
3. Verify auth user creation process
4. Ensure proper error handling and logging in school creation
