/**
 * Email Service for EduDash Pro
 * 
 * This service handles sending emails for various purposes including:
 * - Teacher invitations
 * - Parent notifications
 * - Password resets
 * - School announcements
 */

export interface EmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface TeacherInvitationEmailData {
  teacherName: string;
  schoolName: string;
  invitationCode: string;
  principalName: string;
  expiryDate: string;
}

export class EmailService {
  /**
   * Send teacher invitation email
   */
  static async sendTeacherInvitation(
    email: string,
    data: TeacherInvitationEmailData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const htmlBody = this.generateTeacherInvitationHTML(data);
      const textBody = this.generateTeacherInvitationText(data);

      const emailOptions: EmailOptions = {
        to: email,
        subject: `🎓 Welcome to ${data.schoolName} - Your Teaching Journey Begins!`,
        htmlBody,
        textBody,
      };

      return await this.sendEmail(emailOptions);
    } catch (error) {
      console.error('Error sending teacher invitation:', error);
      return { success: false, error: 'Failed to send teacher invitation email' };
    }
  }

  /**
   * Send email using available service
   * Priority: 1. Resend (if API key available), 2. SendGrid, 3. Console/Development mode
   */
  private static async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    // Check available email services - use EXPO_PUBLIC_ for React Native compatibility
    const hasResendKey = process.env.EXPO_PUBLIC_RESEND_API_KEY || process.env.RESEND_API_KEY;
    const hasSendGridKey = process.env.EXPO_PUBLIC_SENDGRID_API_KEY || process.env.SENDGRID_API_KEY;
    
    console.log('🔧 Email Service Debug:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- Has Resend API Key:', hasResendKey ? 'Yes' : 'No');
    console.log('- Resend Key (first 10):', hasResendKey ? hasResendKey.substring(0, 10) + '...' : 'None');
    console.log('- Has SendGrid API Key:', hasSendGridKey ? 'Yes' : 'No');
    console.log('- Recipient:', options.to);
    console.log('- Subject:', options.subject);

    try {
      // Priority 1: Use Resend via proxy (to avoid CORS in RN/Web dev)
      if (hasResendKey) {
        console.log('📧 Attempting to send email via Resend...');
        // If running in browser or RN dev, route via Supabase Edge Function proxy
        const useProxy = typeof window !== 'undefined';
        if (useProxy) {
          try {
            const edgeBase = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') || '';
            const fnUrl = `${edgeBase}/functions/v1/send-email`;
            const resp = await fetch(fnUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ provider: 'resend', options }),
            });
            if (resp.ok) {
              console.log('✅ Email sent via Edge Function proxy');
              return { success: true };
            }
            const txt = await resp.text();
            console.warn('⚠️ Edge Function email proxy failed, falling back direct:', txt);
          } catch (e) {
            console.warn('⚠️ Edge Function proxy unavailable, falling back direct');
          }
        }
        // Fallback to direct if proxy not available
        return await this.sendWithResend(options);
      }

      // Priority 2: Use SendGrid as fallback if API key is available  
      if (hasSendGridKey) {
        console.log('📧 Attempting to send email via SendGrid...');
        return await this.sendWithSendGrid(options);
      }

      // Priority 3: Development/Console mode (when no API keys available)
      console.log('📧 No email API keys found, using console mode...');
      return await this.sendWithConsole(options);

    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error: 'Email service unavailable' };
    }
  }

  /**
   * Send email using Resend (recommended)
   */
  private static async sendWithResend(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_RESEND_API_KEY || process.env.RESEND_API_KEY;
      const fromEmail = process.env.EXPO_PUBLIC_FROM_EMAIL || process.env.FROM_EMAIL || 'noreply@edudashpro.org.za';
      
      console.log('📧 Sending via Resend with:');
      console.log('- API Key (first 10):', apiKey ? apiKey.substring(0, 10) + '...' : 'None');
      console.log('- From Email:', fromEmail);
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [options.to],
          subject: options.subject,
          html: options.htmlBody,
          text: options.textBody,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email sent successfully via Resend:', result.id);
        return { success: true };
      } else {
        const error = await response.text();
        console.error('❌ Resend API error:', error);
        return { success: false, error: `Resend error: ${error}` };
      }
    } catch (error) {
      console.error('❌ Resend service error:', error);
      return { success: false, error: 'Resend service unavailable' };
    }
  }

  /**
   * Send email using SendGrid (fallback)
   */
  private static async sendWithSendGrid(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: options.to }],
            subject: options.subject,
          }],
          from: { 
            email: process.env.FROM_EMAIL || 'noreply@edudashpro.com',
            name: 'EduDash Pro'
          },
          content: [
            {
              type: 'text/html',
              value: options.htmlBody,
            },
            ...(options.textBody ? [{
              type: 'text/plain',
              value: options.textBody,
            }] : []),
          ],
        }),
      });

      if (response.ok) {
        console.log('✅ Email sent successfully via SendGrid');
        return { success: true };
      } else {
        const error = await response.text();
        console.error('❌ SendGrid API error:', error);
        return { success: false, error: `SendGrid error: ${error}` };
      }
    } catch (error) {
      console.error('❌ SendGrid service error:', error);
      return { success: false, error: 'SendGrid service unavailable' };
    }
  }

  /**
   * Development mode: Log email to console and show user notification
   */
  private static async sendWithConsole(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    console.log('\n📧 ===== EMAIL SENT (DEVELOPMENT MODE) =====');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('\n--- TEXT CONTENT ---');
    console.log(options.textBody || 'No text version');
    console.log('\n--- HTML CONTENT ---');
    console.log(options.htmlBody);
    console.log('=====================================\n');

    // For development, also show a user-friendly message
    if (typeof window !== 'undefined' && window.alert) {
      setTimeout(() => {
        window.alert(`📧 Development Mode: Email sent to ${options.to}\n\nSubject: ${options.subject}\n\nCheck console for full email content.`);
      }, 100);
    }

    return { success: true };
  }

  /**
   * Generate HTML email template for teacher invitation
   */
  private static generateTeacherInvitationHTML(data: TeacherInvitationEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${data.schoolName}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3B82F6, #10B981); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Welcome to EduDash Pro!</h1>
    <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">You're invited to join ${data.schoolName}</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Hello ${data.teacherName}! 👋</h2>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${data.principalName}</strong> has invited you to join <strong>${data.schoolName}</strong> as a teacher on our EduDash Pro platform!
    </p>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #1f2937; margin-top: 0;">🔑 Your Invitation Code</h3>
      <div style="background: white; padding: 15px; border-radius: 6px; border: 2px dashed #3B82F6; text-align: center;">
        <code style="font-size: 24px; font-weight: bold; color: #3B82F6; letter-spacing: 3px;">${data.invitationCode}</code>
      </div>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
        ⏰ This code expires on ${new Date(data.expiryDate).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </p>
    </div>
    
    <h3 style="color: #1f2937;">🚀 How to Get Started</h3>
    <ol style="padding-left: 20px;">
      <li style="margin-bottom: 10px;">Download the <strong>EduDash Pro</strong> app from your app store</li>
      <li style="margin-bottom: 10px;">Tap <strong>"Join as Teacher"</strong> during signup</li>
      <li style="margin-bottom: 10px;">Enter your invitation code: <code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px;">${data.invitationCode}</code></li>
      <li style="margin-bottom: 10px;">Complete your teacher profile</li>
      <li style="margin-bottom: 10px;">Start creating amazing lessons for your students! ✨</li>
    </ol>
    
    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6;">
      <h3 style="color: #1f2937; margin-top: 0;">🌟 What You Can Do</h3>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Create and manage your classes</li>
        <li>Generate AI-powered lesson plans</li>
        <li>Assign interactive homework</li>
        <li>Track student progress</li>
        <li>Communicate with parents</li>
        <li>Access STEM activities and resources</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <p style="color: #6b7280; font-size: 14px;">
        Need help? Contact <strong>${data.principalName}</strong> or our support team.<br>
        Welcome to the ${data.schoolName} family! 🏫❤️
      </p>
    </div>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin: 0; color: #6b7280; font-size: 12px;">
      © 2024 EduDash Pro. This invitation was sent by ${data.schoolName}.<br>
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>
</body>
</html>`;
  }

  /**
   * Generate plain text version for teacher invitation
   */
  private static generateTeacherInvitationText(data: TeacherInvitationEmailData): string {
    return `
Welcome to EduDash Pro!

Hello ${data.teacherName}!

${data.principalName} has invited you to join ${data.schoolName} as a teacher on our EduDash Pro platform!

Your Invitation Code: ${data.invitationCode}
⏰ This code expires on ${new Date(data.expiryDate).toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

How to Get Started:
1. Download the EduDash Pro app from your app store
2. Tap "Join as Teacher" during signup  
3. Enter your invitation code: ${data.invitationCode}
4. Complete your teacher profile
5. Start creating amazing lessons for your students!

What You Can Do:
• Create and manage your classes
• Generate AI-powered lesson plans
• Assign interactive homework
• Track student progress
• Communicate with parents
• Access STEM activities and resources

Need help? Contact ${data.principalName} or our support team.
Welcome to the ${data.schoolName} family!

© 2024 EduDash Pro. This invitation was sent by ${data.schoolName}.
If you didn't expect this invitation, you can safely ignore this email.
`;
  }
}
