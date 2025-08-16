/**
 * Test script for debugging school creation failure
 */

import { SuperAdminDataService } from './lib/services/superAdminDataService';

async function testSchoolCreation() {
  console.log('🧪 Testing school creation for Young Eagles...');
  
  try {
    const result = await SuperAdminDataService.createSchool({
      name: "Young Eagles",
      email: "annatjie@youngeagles.org.za", 
      admin_name: "Annatjie Makunyane",
      subscription_plan: "trial"
    });

    console.log('✅ School creation result:', result);
  } catch (error) {
    console.error('❌ School creation error:', error);
  }
}

// Run the test
testSchoolCreation();
