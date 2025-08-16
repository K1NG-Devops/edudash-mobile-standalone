# EduDash Pro Database Fix Instructions

Your database diagnostic revealed several issues that need to be fixed:

## 🔍 **Issues Found:**
- ❌ Infinite recursion in RLS policies on `users` table
- ❌ Missing 4 tables: `classroom_reports`, `invitation_codes`, `events`, `video_call_sessions`
- ❌ No superadmin user exists

## 🛠️ **Step-by-Step Fix Process:**

### **Option 1: Use Supabase SQL Editor (Recommended)**

1. **Open your Supabase dashboard**
   - Go to https://app.supabase.com
   - Navigate to your EduDash Pro project
   - Click on "SQL Editor" in the left sidebar

2. **Execute the fix script**
   - Copy the entire contents of `scripts/fix-database-issues.sql`
   - Paste it into the SQL editor
   - Click "Run" button
   - Watch the console for success messages

3. **Verify the fix**
   - Run the diagnostic script: `node scripts/diagnose-database.js`
   - All issues should now be resolved

### **Option 2: Use Supabase CLI (Alternative)**

If you have Supabase CLI installed:

```bash
# Navigate to your project directory
cd /home/king/Desktop/edudash-mobile-standalone

# Execute the SQL file
supabase db psql < scripts/fix-database-issues.sql
```

### **Option 3: Manual Execution (Fallback)**

If the above methods don't work, execute these commands one by one in your SQL editor:

#### **Step 1: Fix RLS Policies**
```sql
-- Disable RLS and drop problematic policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON users;
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Superadmin can do everything" ON users;

-- Re-enable RLS with simple policy
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_data" ON users
    FOR ALL USING (
        auth.uid()::text = auth_user_id
        OR 
        auth.uid()::text IN (
            SELECT auth_user_id FROM users 
            WHERE role = 'superadmin' AND is_active = true
        )
    );
```

#### **Step 2: Create Missing Tables**

Execute the table creation statements from `scripts/fix-database-issues.sql` for:
- `classroom_reports`
- `invitation_codes` 
- `events`
- `video_call_sessions`

#### **Step 3: Create Superadmin User**
```sql
INSERT INTO users (
    auth_user_id,
    email,
    name,
    role,
    is_active,
    profile_completion_status,
    profile_completed_at
) VALUES (
    'temp_superadmin_' || extract(epoch from now())::bigint,
    'superadmin@edudashpro.org.za',
    'EduDash Pro Super Administrator',
    'superadmin',
    true,
    'complete',
    now()
) ON CONFLICT (email) DO UPDATE SET
    role = 'superadmin',
    is_active = true,
    updated_at = now();
```

## 🧪 **Verification Steps:**

1. **Run the diagnostic script:**
   ```bash
   node scripts/diagnose-database.js
   ```

2. **Expected results:**
   - ✅ All 31 tables should exist
   - ✅ Regular client access: ✅ (no more infinite recursion)
   - ✅ Admin client access: ✅
   - ✅ Superadmin user exists: `superadmin@edudashpro.org.za`

3. **Test authentication:**
   - Start your app: `npx expo start --web`
   - Navigate to sign-in page
   - Use credentials:
     - **Email:** `superadmin@edudashpro.org.za`  
     - **Password:** `#Olivia@17`
   - You should be able to sign in without infinite recursion errors

## 🔐 **Important Notes:**

- The superadmin user has a temporary `auth_user_id` that starts with `temp_`
- When you sign up with the email/password, the system will automatically link the real auth account to the existing user record
- The RLS policies are now simplified and non-recursive
- All missing tables have been created with proper relationships and indexes

## 🆘 **Troubleshooting:**

If you still encounter issues:

1. **Check Supabase logs** in your dashboard under "Logs" section
2. **Verify environment variables** in your `.env.local` file
3. **Run the diagnostic again** to see current state
4. **Contact support** if problems persist

## 🎉 **Success Indicators:**

You'll know the fix worked when:
- ✅ No more "infinite recursion" errors
- ✅ You can sign in with the superadmin credentials
- ✅ All expected tables exist in the database
- ✅ Your authentication context loads user profiles successfully

---

**Next Steps After Fix:**
1. Test sign-in functionality 
2. Create a preschool/tenant for testing
3. Create sample users (teachers, parents)
4. Test the full EduDash Pro workflow
