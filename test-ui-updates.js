#!/usr/bin/env node

/**
 * Test script to verify UI updates work properly after approval
 * This simulates the UI update flow without authentication issues
 */

// Mock React state management
let mockRequests = [
  {
    id: 'ee670723-8f71-425a-87ba-48f3b6af3d9c',
    preschool_name: 'Young Eagles',
    admin_name: 'King',
    admin_email: 'king@youngeagles.org.za',
    status: 'pending',
    created_at: '2025-08-21T09:00:00Z'
  }
];

let mockSchoolCreationStatus = {};

// Mock the setRequests function
function setRequests(updateFunction) {
  if (typeof updateFunction === 'function') {
    mockRequests = updateFunction(mockRequests);
  } else {
    mockRequests = updateFunction;
  }
}

// Mock the setSchoolCreationStatus function
function setSchoolCreationStatus(updateFunction) {
  if (typeof updateFunction === 'function') {
    mockSchoolCreationStatus = updateFunction(mockSchoolCreationStatus);
  } else {
    mockSchoolCreationStatus = updateFunction;
  }
}

// Simulate the approval process
function simulateApproval(requestId) {
  
  // Step 1: Optimistic UI update (what should happen immediately)
  setRequests(currentRequests =>
    currentRequests.map(r =>
      r.id === requestId ? { ...r, status: 'approved', reviewed_at: new Date().toISOString() } : r
    )
  );
  
  setSchoolCreationStatus(prev => ({...prev, [requestId]: true}));
  
  // Step 2: Simulate successful API response
  const mockApiResponse = {
    success: true,
    school_id: 'new-school-123',
    admin_email: 'king@youngeagles.org.za',
    temp_password: 'TempPass123!',
    request_status: 'approved'
  };
  
  
  // Step 3: Show success message (what the user would see)

Admin Email: ${mockApiResponse.admin_email}
Temporary Password: ${mockApiResponse.temp_password}

A welcome email has been sent with login instructions.`);
  
  // Step 4: Simulate data refresh (what happens after 400ms delay)
  setTimeout(() => {
    // This would normally fetch from the database
    // For simulation, we'll update with the "approved" status from server
    setRequests([
      {
        id: requestId,
        preschool_name: 'Young Eagles',
        admin_name: 'King',
        admin_email: 'king@youngeagles.org.za',
        status: 'approved', // This comes from the database
        reviewed_at: new Date().toISOString(),
        created_at: '2025-08-21T09:00:00Z'
      }
    ]);
    
    
  }, 400);
}

// Run the simulation

simulateApproval('ee670723-8f71-425a-87ba-48f3b6af3d9c');
