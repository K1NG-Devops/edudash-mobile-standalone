#!/usr/bin/env node

/**
 * Test script to debug email functionality
 * Run with: node scripts/test-email.js
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function testResendAPI() {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@edudashpro.com';
  
  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in environment variables');
    return;
  }

  const testEmail = {
    from: FROM_EMAIL,
    to: ['your-email@gmail.com'], // Replace with your actual email for testing
    subject: '🧪 EduDash Pro Email Test',
    html: `
      <h1>Email Test Successful! ✅</h1>
      <p>This is a test email from EduDash Pro to verify email functionality.</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <p><strong>From:</strong> ${FROM_EMAIL}</p>
    `,
    text: `Email Test Successful! This is a test email from EduDash Pro sent at ${new Date().toISOString()}`
  };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEmail),
    });

    const responseText = await response.text();

    if (response.ok) {
      const result = JSON.parse(responseText);

    } else {
      console.error('❌ Email failed to send');
      console.error('Error:', responseText);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Test the Resend API
testResendAPI();
