import { supabase, supabaseAdmin } from '@/lib/supabase';
import { PreschoolOnboardingRequest } from '@/types/types';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('OnboardingService');

interface OnboardingRequestInput {
  preschoolName: string;
  adminName: string;
  adminEmail: string;
  phone?: string;
  address?: string;
  numberOfStudents?: string;
  numberOfTeachers?: string;
  message?: string;
}

interface OnboardingEmailData {
  schoolName: string;
  adminName: string;
  adminEmail: string;
  numberOfStudents?: string;
  numberOfTeachers?: string;
  address?: string;
  message?: string;
}

// Function to send onboarding confirmation email
const sendOnboardingEmail = async (emailData: OnboardingEmailData) => {
  const { schoolName, adminName, adminEmail, numberOfStudents, numberOfTeachers, address, message } = emailData;

  // Create beautiful HTML email template
  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>School Registration Request - EduDash Pro</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">📚 EduDash Pro</h1>
                <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">School Registration Request Received</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <h2 style="color: #1e3c72; margin: 0 0 20px 0; font-size: 24px;">🎉 Thank you for your registration!</h2>
                
                <p style="color: #4a5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                    Dear ${adminName},
                </p>
                
                <p style="color: #4a5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                    Thank you for registering <strong>${schoolName}</strong> with EduDash Pro! 
                    We're excited to help transform your preschool's educational experience.
                </p>
                
                <!-- School Details Card -->
                <div style="background-color: #f7fafc; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #2a5298;">
                    <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px;">📋 Registration Details</h3>
                    
                    <div style="margin-bottom: 12px;">
                        <span style="font-weight: 600; color: #2d3748;">🏫 School Name:</span>
                        <span style="color: #4a5568; margin-left: 8px;">${schoolName}</span>
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        <span style="font-weight: 600; color: #2d3748;">👨‍💼 Administrator:</span>
                        <span style="color: #4a5568; margin-left: 8px;">${adminName}</span>
                    </div>
                    
                    ${numberOfStudents ? `
                    <div style="margin-bottom: 12px;">
                        <span style="font-weight: 600; color: #2d3748;">🎓 Expected Students:</span>
                        <span style="color: #4a5568; margin-left: 8px;">${numberOfStudents} students</span>
                    </div>
                    ` : ''}
                    
                    ${numberOfTeachers ? `
                    <div style="margin-bottom: 12px;">
                        <span style="font-weight: 600; color: #2d3748;">👩‍🏫 Expected Teachers:</span>
                        <span style="color: #4a5568; margin-left: 8px;">${numberOfTeachers} teachers</span>
                    </div>
                    ` : ''}
                    
                    ${address ? `
                    <div style="margin-bottom: 0;">
                        <span style="font-weight: 600; color: #2d3748;">📍 Address:</span>
                        <span style="color: #4a5568; margin-left: 8px;">${address}</span>
                    </div>
                    ` : ''}
                </div>
                
                <!-- What's Next -->
                <div style="background-color: #f0fff4; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #10b981;">
                    <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">🚀 What happens next?</h3>
                    
                    <div style="color: #047857; margin-bottom: 10px;">
                        ✅ <strong>Review:</strong> Our team will review your registration within 24 hours
                    </div>
                    <div style="color: #047857; margin-bottom: 10px;">
                        ✅ <strong>Setup:</strong> We'll create your school's dashboard and user accounts
                    </div>
                    <div style="color: #047857; margin-bottom: 10px;">
                        ✅ <strong>Welcome:</strong> You'll receive login credentials and onboarding guide
                    </div>
                    <div style="color: #047857;">
                        ✅ <strong>Launch:</strong> Start managing your preschool with EduDash Pro!
                    </div>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://edudashpro.org.za" style="display: inline-block; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        🌐 Visit EduDash Pro
                    </a>
                </div>
                
                <p style="color: #718096; line-height: 1.6; margin: 30px 0 0 0; font-size: 14px; text-align: center;">
                    Questions? Contact us at <a href="mailto:support@edudashpro.org.za" style="color: #2a5298;">support@edudashpro.org.za</a>
                </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #2d3748; padding: 20px; text-align: center;">
                <p style="color: #a0aec0; margin: 0; font-size: 14px;">
                    © 2025 EduDash Pro - Transforming Preschool Education in South Africa
                </p>
            </div>
        </div>
    </body>
    </html>
  `;

  // Send email using the send-email edge function
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      to: adminEmail,
      subject: `🎉 Registration Received - ${schoolName} | EduDash Pro`,
      html: emailHTML,
      templateType: 'onboarding',
      schoolName: schoolName,
      principalName: adminName
    }
  });

  if (error) {
    throw new Error(`Failed to send onboarding email: ${error.message}`);
  }

  return data;
};

// Function to notify super admins of new onboarding requests
const notifySuperAdmins = async (emailData: OnboardingEmailData) => {
  const { schoolName, adminName, adminEmail, numberOfStudents, numberOfTeachers, address, message } = emailData;

  // Use admin client to find all super admin users (bypass RLS)
  const client = supabaseAdmin || supabase;
  log.info('🔍 [OnboardingService] Looking for superadmins using client:', supabaseAdmin ? 'Admin (Service Role)' : 'Regular (Anon)');

  const { data: superAdmins, error: superAdminError } = await client
    .from('users')
    .select('id, name, email')
    .eq('role', 'superadmin')
    .eq('is_active', true);

  if (superAdminError) {
    log.error('Failed to fetch super admins:', superAdminError);
    return;
  }

  if (!superAdmins || superAdmins.length === 0) {
    log.info('No super admins found to notify');
    return;
  }

  // Create super admin notification email template
  const notificationHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New School Registration - EduDash Pro Admin</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🚨 EduDash Pro Admin</h1>
                <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">New School Registration Request</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <h2 style="color: #dc2626; margin: 0 0 20px 0; font-size: 24px;">📋 Action Required: New School Registration</h2>
                
                <p style="color: #4a5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                    A new school has submitted a registration request and is awaiting your review.
                </p>
                
                <!-- School Details Card -->
                <div style="background-color: #fef2f2; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #dc2626;">
                    <h3 style="color: #991b1b; margin: 0 0 15px 0; font-size: 18px;">🏫 School Registration Details</h3>
                    
                    <div style="margin-bottom: 12px;">
                        <span style="font-weight: 600; color: #991b1b;">School Name:</span>
                        <span style="color: #4a5568; margin-left: 8px;">${schoolName}</span>
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        <span style="font-weight: 600; color: #991b1b;">Administrator:</span>
                        <span style="color: #4a5568; margin-left: 8px;">${adminName}</span>
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        <span style="font-weight: 600; color: #991b1b;">Email:</span>
                        <span style="color: #4a5568; margin-left: 8px;">${adminEmail}</span>
                    </div>
                    
                    ${numberOfStudents ? `
                    <div style="margin-bottom: 12px;">
                        <span style="font-weight: 600; color: #991b1b;">Expected Students:</span>
                        <span style="color: #4a5568; margin-left: 8px;">${numberOfStudents} students</span>
                    </div>
                    ` : ''}
                    
                    ${numberOfTeachers ? `
                    <div style="margin-bottom: 12px;">
                        <span style="font-weight: 600; color: #991b1b;">Expected Teachers:</span>
                        <span style="color: #4a5568; margin-left: 8px;">${numberOfTeachers} teachers</span>
                    </div>
                    ` : ''}
                    
                    ${address ? `
                    <div style="margin-bottom: 12px;">
                        <span style="font-weight: 600; color: #991b1b;">Address:</span>
                        <span style="color: #4a5568; margin-left: 8px;">${address}</span>
                    </div>
                    ` : ''}
                    
                    ${message ? `
                    <div style="margin-bottom: 0;">
                        <span style="font-weight: 600; color: #991b1b;">Message:</span>
                        <div style="color: #4a5568; margin-top: 8px; padding: 12px; background-color: #ffffff; border-radius: 6px; border: 1px solid #f3f4f6;">${message}</div>
                    </div>
                    ` : ''}
                </div>
                
                <!-- Action Required -->
                <div style="background-color: #fffbeb; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #f59e0b;">
                    <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">⚡ Action Required</h3>
                    
                    <p style="color: #92400e; margin: 0 0 15px 0;">Please review this registration request and:</p>
                    
                    <div style="color: #92400e; margin-bottom: 10px;">
                        ✅ <strong>Approve:</strong> Create the school account and send credentials
                    </div>
                    <div style="color: #92400e;">
                        ❌ <strong>Reject:</strong> Decline the request with appropriate feedback
                    </div>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://app.edudashpro.org.za/screens/super-admin-dashboard?tab=onboarding" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        🔍 Review Request
                    </a>
                </div>
                
                <p style="color: #718096; line-height: 1.6; margin: 30px 0 0 0; font-size: 14px; text-align: center;">
                    Request submitted at ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
                </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #2d3748; padding: 20px; text-align: center;">
                <p style="color: #a0aec0; margin: 0; font-size: 14px;">
                    © 2025 EduDash Pro - Super Admin Notifications
                </p>
            </div>
        </div>
    </body>
    </html>
  `;

  // Send notification emails to all super admins
  const emailPromises = superAdmins.map(async (admin: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: admin.email,
          subject: `🚨 New School Registration: ${schoolName} - Action Required`,
          html: notificationHTML,
          templateType: 'admin_notification',
          schoolName: schoolName,
          adminName: admin.name || 'Super Admin'
        }
      });

      if (error) {
        log.error(`Failed to send notification to ${admin.email}:`, error);
      } else {
        log.info(`Notification sent successfully to ${admin.email}`);
      }

      return { admin: admin.email, success: !error, error };
    } catch (err) {
      log.error(`Exception sending notification to ${admin.email}:`, err);
      return { admin: admin.email, success: false, error: err };
    }
  });

  // Wait for all email notifications to complete
  const results = await Promise.allSettled(emailPromises);

  // Log summary
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.length - successful;

  log.info(`Super admin notifications: ${successful} sent, ${failed} failed`);

  return results;
};

export const createOnboardingRequest = async (requestData: OnboardingRequestInput) => {
  const { preschoolName, adminName, adminEmail, phone, address, numberOfStudents, numberOfTeachers, message } = requestData;

  // Use admin client for inserting onboarding requests to bypass RLS
  const client = supabaseAdmin || supabase;
  log.info('🔥 [OnboardingService] Using client for insert:', supabaseAdmin ? 'Admin (Service Role)' : 'Regular (Anon)');

  // Insert the onboarding request into the database
  const { data, error } = await client
    .from('preschool_onboarding_requests')
    .insert([
      {
        preschool_name: preschoolName,
        admin_name: adminName,
        admin_email: adminEmail,
        phone,
        address,
        number_of_students: numberOfStudents ? parseInt(numberOfStudents, 10) : null,
        number_of_teachers: numberOfTeachers ? parseInt(numberOfTeachers, 10) : null,
        message,
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    ]);

  if (error) {
    log.error('🔥 [OnboardingService] Database insert error:', error);
    throw error;
  }

  log.info('✅ [OnboardingService] Successfully inserted onboarding request:', data);

  // Send confirmation email to the school admin
  try {
    await sendOnboardingEmail({
      schoolName: preschoolName,
      adminName,
      adminEmail,
      numberOfStudents,
      numberOfTeachers,
      address,
      message
    });
  } catch (emailError) {
    // Log email error but don't fail the entire request
    log.error('Failed to send onboarding email:', emailError);
  }

  // Send notification to super admins
  try {
    await notifySuperAdmins({
      schoolName: preschoolName,
      adminName,
      adminEmail,
      numberOfStudents,
      numberOfTeachers,
      address,
      message
    });
  } catch (notificationError) {
    // Log notification error but don't fail the entire request
    log.error('Failed to send super admin notification:', notificationError);
  }

  return data;
};

// Fetch all onboarding requests (for super admins)
export const getAllOnboardingRequests = async (): Promise<Partial<PreschoolOnboardingRequest>[]> => {
  // Use admin client for fetching requests to bypass RLS
  const client = supabaseAdmin || supabase;
  log.info('📋 [OnboardingService] Fetching requests using client:', supabaseAdmin ? 'Admin (Service Role)' : 'Regular (Anon)');

  const { data, error } = await client
    .from('preschool_onboarding_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data as any) as Partial<PreschoolOnboardingRequest>[];
};

// Approve an onboarding request (for super admins)
export const approveOnboardingRequest = async (requestId: string) => {
  try {
    log.info('🔥 [OnboardingService] approveOnboardingRequest: Starting approval for requestId:', requestId);
    
    // Check current user authentication before calling Edge Function
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      log.error('❌ [OnboardingService] Authentication failed:', authError?.message);
      throw new Error('Authentication required. Please sign in again.');
    }
    
    log.info('🔑 [OnboardingService] User authenticated:', {
      userId: user.id,
      email: user.email
    });
    
    // Verify user has superadmin role before proceeding
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('auth_user_id', user.id)
      .single();
      
    if (profileError || !userProfile) {
      log.error('❌ [OnboardingService] User profile not found:', profileError?.message);
      throw new Error('User profile not found. Please contact support.');
    }
    
    if (userProfile.role !== 'superadmin' || !userProfile.is_active) {
      log.error('❌ [OnboardingService] Insufficient permissions:', {
        role: userProfile.role,
        active: userProfile.is_active
      });
      throw new Error('Insufficient permissions. Superadmin role required.');
    }
    
    log.info('✅ [OnboardingService] User permissions verified, calling Edge Function');
    
    // Route approval + provisioning through Edge Function to use service role safely
    // The supabase.functions.invoke() automatically handles authentication
    const { data, error } = await supabase.functions.invoke('superadmin_approve_onboarding', {
      body: { requestId }
    });
    
    log.info('📞 [OnboardingService] Edge Function response:', { data, error });

    // Surface detailed error information from Edge Function responses
    if (error) {
      log.error('❌ [OnboardingService] Edge Function error:', error);
      
      // Attempt to parse the Response object body if available
      const ctx: any = (error as any)?.context;
      let detailed: any = (error as any)?.message;
      try {
        if (ctx && typeof ctx.json === 'function') {
          const parsed = await ctx.json();
          detailed = parsed?.error || JSON.stringify(parsed);
        } else if (ctx && typeof ctx.text === 'function') {
          const txt = await ctx.text();
          detailed = txt || detailed;
        } else if ((error as any)?.context?.body?.error) {
          detailed = (error as any).context.body.error;
        }
      } catch (_) {
        // ignore parsing issues; fall back to message
      }
      throw new Error(detailed || 'Failed to approve request via Edge Function');
    }

    // Edge function may return an { error } payload with 200; guard for that too
    if ((data as any)?.error) {
      log.error('❌ [OnboardingService] Edge Function returned error in data:', (data as any).error);
      throw new Error((data as any).error);
    }
    
    log.info('✅ [OnboardingService] Approval completed successfully:', data);

    // Defensive: if edge returns success but request still shows pending locally, update it via admin client
    try {
      if ((data as any)?.success) {
        const adminClient = supabaseAdmin || supabase;
        await adminClient
          .from('preschool_onboarding_requests')
          .update({ status: 'approved', reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', requestId);
      }
    } catch (_) {
      // non-fatal safeguard
    }

    return data as any;
  } catch (error) {
    log.error('💥 [OnboardingService] Exception in approveOnboardingRequest:', error);
    throw error;
  }
};

// Reject an onboarding request (for super admins)
export const rejectOnboardingRequest = async (requestId: string, reviewerId: string) => {
  // Keep rejection simple via RLS (superadmin) or use service role when available
  const client = supabaseAdmin || supabase;
  const updateData: any = { status: 'rejected', reviewed_at: new Date().toISOString() };
  const { data: reviewer } = await client.from('users').select('id').eq('id', reviewerId).single();
  if (reviewer) updateData.reviewed_by = reviewerId;
  const { data, error } = await client
    .from('preschool_onboarding_requests')
    .update(updateData)
    .eq('id', requestId);
  if (error) throw error;
  return data;
};

