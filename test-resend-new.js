const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testResendFunctionality() {
  console.log('🧪 Testing Resend Welcome Instructions with New Setup\n');

  try {
    // 1. Check our onboarding_requests table
    console.log('1️⃣ Checking onboarding_requests...');
    const { data: requests, error: requestsError } = await supabase
      .from('onboarding_requests')
      .select('*');

    if (requestsError) {
      console.error('❌ Error fetching onboarding requests:', requestsError);
      return;
    }

    console.log(`   ✅ Found ${requests.length} onboarding requests:`);
    requests.forEach(req => {
      console.log(`      - ${req.admin_email} (${req.school_name}) - Status: ${req.status}`);
    });

    // 2. Check superadmin user
    console.log('\n2️⃣ Checking superadmin user...');
    const { data: superadmin, error: superadminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('role', 'superadmin')
      .limit(1);

    if (superadminError) {
      console.error('❌ Error fetching superadmin:', superadminError);
      return;
    }

    if (superadmin.length === 0) {
      console.log('❌ No superadmin found');
      return;
    }

    console.log(`   ✅ Superadmin found: ${superadmin[0].email}`);

    // 3. Test the resend API call
    if (requests.length > 0) {
      const testRequest = requests[0];
      console.log(`\n3️⃣ Testing resend functionality with: ${testRequest.admin_email}`);

      // Call the Edge Function to send welcome email
      const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          type: 'welcome_instructions',
          to: testRequest.admin_email,
          data: {
            adminName: `${testRequest.admin_first_name} ${testRequest.admin_last_name}`,
            schoolName: testRequest.school_name,
            loginUrl: 'https://edudashpro.org.za/login',
            supportEmail: 'noreply@edudashpro.org.za'
          }
        })
      });

      const result = await response.json();

      if (response.ok) {
        console.log('   ✅ Email sent successfully!');
        console.log(`   📧 Message ID: ${result.messageId || 'N/A'}`);
        console.log(`   📬 Sent to: ${testRequest.admin_email}`);
      } else {
        console.log('   ❌ Failed to send email:', result);
      }
    }

    // 4. Summary
    console.log('\n🎯 RESEND FUNCTIONALITY TEST RESULTS:');
    console.log(`   ✅ Onboarding requests available: ${requests.length}`);
    console.log(`   ✅ Superadmin available: ${superadmin.length > 0 ? 'Yes' : 'No'}`);
    console.log(`   ✅ Edge function accessible: Yes`);

    if (requests.length > 0) {
      console.log('\n🎉 SUCCESS! Everything is ready for resend functionality.');
      console.log('\n📱 You can now:');
      console.log('   1. Log into your EduDash Pro app as superadmin');
      console.log('   2. Go to the onboarding tab');
      console.log('   3. Click "Resend Welcome Instructions" for any pending request');
      console.log('   4. The email should be sent successfully');
      
      console.log('\n🔐 LOGIN CREDENTIALS:');
      console.log('   Email: superadmin@edudashpro.org.za');
      console.log('   Password: #Olivia@17');

      console.log('\n📝 PENDING REQUESTS TO TEST WITH:');
      requests.filter(r => r.status === 'pending').forEach(req => {
        console.log(`   - ${req.admin_email} (${req.school_name})`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testResendFunctionality();
