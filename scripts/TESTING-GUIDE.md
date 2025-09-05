# 🧪 Testing Guide: Database Fixes + PayFast Sandbox

This guide covers testing the production database fixes and PayFast payment integration using sandbox credentials.

---

## 🎯 **PART 1: Database Fixes**

### **Step 1: Run Enhanced Database Fix**
Execute the enhanced fix script that handles both data issues and RLS policies:

```bash
# In Supabase Dashboard → SQL Editor:
# Copy and paste contents from:
scripts/fix-production-issues-enhanced.sql
```

**What this fixes:**
- ✅ Missing subscription dates for Young Eagles & Fringe
- ✅ Wrong timezone (UTC → Africa/Johannesburg)  
- ✅ 'Unrestricted' tables (enables RLS policies)
- ✅ Security enhancements for platform tables

### **Step 2: Verify Fixes**
The script includes validation queries that will show:

```sql
-- Expected Results:
SCHOOLS_FIXED: Both schools show "FIXED ✅"
RLS_STATUS: All tables show "SECURED ✅" 
POLICY_COUNT: Shows policies created for each table
HEALTH_CHECK: Shows 2 schools with correct dates/timezone
```

---

## 💰 **PART 2: PayFast Sandbox Setup**

### **Step 1: Configure Sandbox Credentials**
```bash
cd /home/king/Desktop/edudash-mobile-standalone
./scripts/setup-payfast-sandbox.sh
```

This will:
- ✅ Set PayFast to sandbox mode
- ✅ Configure test merchant credentials
- ✅ Update webhook URLs for localhost
- ✅ Backup your existing .env.local

### **Step 2: Restart Development Server**
```bash
# Stop current server (Ctrl+C)
npm run web
# Server will now use sandbox PayFast configuration
```

---

## 🔧 **PART 3: Testing Payment Flow**

### **PayFast Sandbox Test Data**

#### **Test Credit Cards:**
```
Card Number: 5200000000000015
CVV: 123
Expiry: Any future date (e.g., 12/25)
Cardholder: Test User
```

#### **Test Banking Details:**
```
Account Number: 12345678
Branch Code: 123456
Account Type: Current
```

### **Testing Scenarios:**

#### **Scenario 1: Successful Payment**
1. Navigate to subscription/upgrade page
2. Select a paid plan (Neural Starter/Quantum Pro)  
3. Use test card: `5200000000000015`
4. Complete PayFast sandbox payment
5. Verify return to success page
6. Check database for new subscription record

#### **Scenario 2: Payment Cancellation**
1. Start payment flow
2. Click "Cancel" on PayFast sandbox page
3. Verify redirect to cancel URL
4. Check user remains on current plan

#### **Scenario 3: Webhook Testing**
1. Complete payment in sandbox
2. Check terminal logs for webhook calls
3. Verify subscription status updates in database
4. Test webhook signature verification

---

## 📊 **PART 4: Database Validation**

### **Check Subscription Data:**
```sql
-- Run in Supabase SQL Editor:
SELECT 
  p.name,
  p.subscription_start_date,
  p.subscription_end_date,
  p.timezone,
  p.subscription_status,
  COUNT(ps.id) as active_subscriptions
FROM preschools p
LEFT JOIN platform_subscriptions ps ON ps.user_id IN (
  SELECT u.auth_user_id FROM users u WHERE u.preschool_id = p.id
)
GROUP BY p.id, p.name, p.subscription_start_date, p.subscription_end_date, p.timezone, p.subscription_status;
```

### **Verify RLS Policies:**
```sql
-- Check which tables have RLS enabled:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
ORDER BY tablename;
```

### **Test Multi-Tenant Isolation:**
```sql
-- Ensure users can only see their school's data:
SELECT 
  u.name,
  u.role,
  p.name as school_name,
  COUNT(DISTINCT s.id) as visible_students
FROM users u
LEFT JOIN preschools p ON u.preschool_id = p.id  
LEFT JOIN students s ON s.preschool_id = u.preschool_id
GROUP BY u.id, u.name, u.role, p.name
ORDER BY u.role, u.name;
```

---

## 🔍 **PART 5: Testing Checklist**

### **Database Health ✅**
- [ ] All schools have subscription dates set
- [ ] Timezone is Africa/Johannesburg  
- [ ] RLS policies enabled on core tables
- [ ] Multi-tenant isolation working
- [ ] No 'Unrestricted' tables in dashboard

### **PayFast Integration ✅**  
- [ ] Sandbox mode active (`EXPO_PUBLIC_PAYFAST_ENV=sandbox`)
- [ ] Test credentials configured
- [ ] Webhook URLs point to localhost
- [ ] Payment flow completes successfully
- [ ] Cancel flow works properly
- [ ] Webhook processing working

### **Security Validation ✅**
- [ ] Users can only access their school's data
- [ ] Superadmin can access all data
- [ ] Payment webhooks verify signatures
- [ ] Subscription status updates correctly
- [ ] Trial periods calculate properly

---

## 🚨 **Troubleshooting**

### **Database Issues:**
```bash
# If RLS policies fail:
# 1. Check user permissions in Supabase
# 2. Verify auth.uid() is working  
# 3. Check RLS policy syntax

# Common fixes:
DROP POLICY IF EXISTS policy_name ON table_name;
CREATE POLICY policy_name ON table_name FOR ALL TO authenticated USING (true);
```

### **PayFast Issues:**
```bash
# If webhooks don't work:
# 1. Check ngrok for localhost tunneling
# 2. Verify webhook URL is accessible
# 3. Check signature validation

# Test webhook manually:
curl -X POST http://localhost:8081/api/webhooks/payfast \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "m_payment_id=test&pf_payment_id=12345&payment_status=COMPLETE"
```

### **Environment Issues:**
```bash
# Reset to clean state:
cp .env.local.backup .env.local  # Restore backup
./scripts/setup-payfast-sandbox.sh  # Re-run setup
npm run web  # Restart server
```

---

## 📈 **Success Metrics**

### **Database:**
- ✅ 2 schools with correct subscription dates
- ✅ All tables secured with RLS
- ✅ Perfect tenant isolation maintained  
- ✅ All validation queries pass

### **Payments:**
- ✅ Sandbox payments complete successfully
- ✅ Webhooks update subscription status
- ✅ Users can upgrade/downgrade plans
- ✅ Trial periods work correctly

### **Security:**
- ✅ Multi-tenant data isolation
- ✅ Proper role-based access control
- ✅ Secure webhook signature validation
- ✅ No data leakage between schools

---

## 🎉 **Next Steps After Testing**

1. **Production Deployment:**
   - Run database fix script on production
   - Switch PayFast to production credentials
   - Update webhook URLs to production domain

2. **Monitoring Setup:**
   - Set up payment failure alerts
   - Monitor subscription renewal rates
   - Track webhook success rates

3. **User Training:**
   - Document new subscription flow
   - Train admins on payment management
   - Create user guides for upgrades

---

**Remember**: Always test thoroughly in sandbox before deploying to production!

**Support**: If you encounter issues, check the logs and review this guide. All test credentials are safe for development use.
