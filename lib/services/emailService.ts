/**
 * Email Service for EduDash Pro
 * 
 * This service handles sending emails for various purposes including:
 * - Teacher invitations
 * - Parent notifications
 * - Password resets
 * - School announcements
 */

import { supabase } from '@/lib/supabase';
import { logger as log } from '@/lib/utils/logger';

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

      // Build deep links (native scheme and web fallback)
      const appScheme = 'edudashpro://join-with-code?code=' + encodeURIComponent(data.invitationCode);
      const shortScheme = 'edudashpro://invite/' + encodeURIComponent(data.invitationCode);
      const webUrlBase = process.env.EXPO_PUBLIC_WEB_URL || 'https://app.edudashpro.org.za';
      const webUrl = `${webUrlBase}/join-with-code?code=${encodeURIComponent(data.invitationCode)}`;

      const emailOptions: EmailOptions = {
        to: email,
        subject: `🎓 Welcome to ${data.schoolName} - Your Teaching Journey Begins!`,
        htmlBody,
        textBody,
      };

      return await this.sendEmail(emailOptions);
    } catch (error) {
      log.error('Error sending teacher invitation:', error);
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

    try {
      // Priority 1: Always attempt Supabase Edge Function first (server holds provider keys)
      try {
        const { data, error } = await supabase.functions.invoke('send-email', {
          body: {
            to: options.to,
            subject: options.subject,
            html: options.htmlBody,
            templateType: 'invitation'
          },
        });
        if (!error) {
          return { success: true };
        }
        log.warn('⚠️ Edge Function email proxy failed, will try direct providers:', error?.message);
      } catch (e: any) {
        log.warn('⚠️ Edge Function unavailable, will try direct providers:', e?.message || e);
      }

      // Priority 2: Use Resend directly if client key is configured
      if (hasResendKey) {
        return await this.sendWithResend(options);
      }

      // Priority 3: Use SendGrid as fallback if API key is available  
      if (hasSendGridKey) {

        return await this.sendWithSendGrid(options);
      }

      // Priority 4: No configured email service
  // Return failure to avoid false-positive success when nothing is sent
  return { success: false, error: 'Email service not configured. Set RESEND_API_KEY or SENDGRID_API_KEY.' };

    } catch (error) {
      log.error('Email sending failed:', error);
      return { success: false, error: 'Email service unavailable' };
    }
  }

  /**
   * Send email using Resend (recommended)
   */
  private static async sendWithResend(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
    // SECURITY: Never use EXPO_PUBLIC_* API keys for outbound email in the client.
    // Only allow server-side key (RESEND_API_KEY). For mobile/web, prefer edge function invocations.
    const apiKey = process.env.RESEND_API_KEY;
      const fromEmail = process.env.EXPO_PUBLIC_FROM_EMAIL || process.env.FROM_EMAIL || 'noreply@edudashpro.org.za';

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

        return { success: true };
      } else {
        const error = await response.text();
        log.error('❌ Resend API error:', error);
        return { success: false, error: `Resend error: ${error}` };
      }
    } catch (error) {
      log.error('❌ Resend service error:', error);
      return { success: false, error: 'Resend service unavailable' };
    }
  }

  /**
   * Send email using SendGrid (fallback)
   */
  private static async sendWithSendGrid(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const sgKey = process.env.EXPO_PUBLIC_SENDGRID_API_KEY || process.env.SENDGRID_API_KEY;
      const fromEmail = process.env.EXPO_PUBLIC_FROM_EMAIL || process.env.FROM_EMAIL || 'noreply@edudashpro.com';
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sgKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: options.to }],
            subject: options.subject,
          }],
          from: {
            email: fromEmail,
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

        return { success: true };
      } else {
        const error = await response.text();
        log.error('❌ SendGrid API error:', error);
        return { success: false, error: `SendGrid error: ${error}` };
      }
    } catch (error) {
      log.error('❌ SendGrid service error:', error);
      return { success: false, error: 'SendGrid service unavailable' };
    }
  }

  /**
   * Development mode: Log email to console and show user notification
   */
  private static async sendWithConsole(options: EmailOptions): Promise<{ success: boolean; error?: string }> {

    // For development, also show a user-friendly message
    if (typeof window !== 'undefined' && window.alert) {
      setTimeout(() => {
        window.alert(`📧 Development Mode: Email sent to ${options.to}\n\nSubject: ${options.subject}\n\nCheck console for full email content.`);
      }, 100);
    }

  return { success: false, error: 'Console fallback only; no email actually sent.' };
  }

  /**
   * Generate HTML email template for teacher invitation
   */
  private static generateTeacherInvitationHTML(data: TeacherInvitationEmailData): string {
    const appScheme = 'edudashpro://join-with-code?code=' + encodeURIComponent(data.invitationCode);
    const shortScheme = 'edudashpro://invite/' + encodeURIComponent(data.invitationCode);
    const webUrlBase = process.env.EXPO_PUBLIC_WEB_URL || 'https://app.edudashpro.org.za';
    const webUrl = `${webUrlBase}/join-with-code?code=${encodeURIComponent(data.invitationCode)}`;
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
      <li style="margin-bottom: 10px;">On your phone, tap <a href="${appScheme}">Open in app</a> (or <a href="${shortScheme}">short link</a>)</li>
      <li style="margin-bottom: 10px;">If the app isn’t installed, use the web link: <a href="${webUrl}">${webUrl}</a></li>
      <li style="margin-bottom: 10px;">Enter your details to complete setup</li>
    </ol>

    <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #10B981;">
      <p style="margin: 0; color: #065f46; font-size: 14px;">
        Important: No email confirmation required for teacher invitations. This invite verifies your email automatically — just complete setup and you're in.
      </p>
    </div>

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
    
    <div style="background: #fff7ed; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; color: #92400e; font-size: 13px;">
        Trouble with the code? If you see “invalid or expired code”, please contact <strong>${data.principalName}</strong> to resend or issue a new invitation.
      </p>
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
    const appScheme = 'edudashpro://join-with-code?code=' + encodeURIComponent(data.invitationCode);
    const shortScheme = 'edudashpro://invite/' + encodeURIComponent(data.invitationCode);
    const webUrlBase = process.env.EXPO_PUBLIC_WEB_URL || 'https://app.edudashpro.org.za';
    const webUrl = `${webUrlBase}/join-with-code?code=${encodeURIComponent(data.invitationCode)}`;
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
• Open on your phone: ${appScheme}
• Short link: ${shortScheme}
• Web fallback: ${webUrl}
• No email confirmation required — this invite verifies your email automatically. Just complete setup.

What You Can Do:
• Create and manage your classes
• Generate AI-powered lesson plans
• Assign interactive homework
• Track student progress
• Communicate with parents
• Access STEM activities and resources

Trouble with the code? If you see "invalid or expired code", contact ${data.principalName} to resend or issue a new invitation.

Need help? Contact ${data.principalName} or our support team.
Welcome to the ${data.schoolName} family!

© 2024 EduDash Pro. This invitation was sent by ${data.schoolName}.
If you didn't expect this invitation, you can safely ignore this email.
`;
  }
}
