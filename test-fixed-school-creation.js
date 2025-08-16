/**
 * Test the updated school creation method
 */

import { SuperAdminDataService } from './lib/services/superAdminDataService.js';

async function testFixedSchoolCreation() {
  console.log('🧪 Testing fixed school creation for Young Eagles...');
  
  try {
    const result = await SuperAdminDataService.createSchool({
      name: "Young Eagles",
      email: "annatjie@youngeagles.org.za", 
      admin_name: "Annatjie Makunyane",
      subscription_plan: "trial"
    });

    console.log('Result:', result);
    
    if (result.success) {
      console.log('✅ School created successfully!');
      console.log('School ID:', result.school_id);
      console.log('Admin Email:', result.admin_email);
      console.log('Temp Password:', result.temp_password);
    } else if (result.manual_setup_required) {
      console.log('⚠️ Partial success - manual setup required');
      console.log('School ID:', result.school_id);
      console.log('Error:', result.error);
    } else {
      console.log('❌ School creation failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the test
testFixedSchoolCreation();
