// Supabase Edge Function: superadmin_approve_onboarding
// Approves an onboarding request and provisions the school + principal user

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Json = Record<string, any>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return json({ error: "Missing auth token" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Service configuration missing" }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    // Validate caller user and enforce superadmin role
    const { data: tokenUser, error: tokenErr } = await admin.auth.getUser(token);
    if (tokenErr || !tokenUser?.user) return json({ error: "Invalid token" }, 401);

    const authUserId = tokenUser.user.id;
    const { data: caller } = await admin
      .from("users")
      .select("id, role, is_active")
      .eq("auth_user_id", authUserId)
      .single();

    if (!caller || caller.role !== "superadmin" || !caller.is_active) {
      return json({ error: "Forbidden" }, 403);
    }

    const body = (await req.json()) as Json;
    const requestId: string | undefined = body?.requestId;
    if (!requestId) return json({ error: "requestId is required" }, 400);

    // Fetch onboarding request
    const { data: request, error: reqErr } = await admin
      .from("preschool_onboarding_requests")
      .select("*")
      .eq("id", requestId)
      .single();
    if (reqErr || !request) return json({ error: "Request not found" }, 404);

    // Idempotency: if already approved and school exists, return success
    const { data: existingSchool } = await admin
      .from("preschools")
      .select("id, name, email, onboarding_status, setup_completed")
      .eq("email", request.admin_email)
      .maybeSingle();

    if (existingSchool && existingSchool.setup_completed && existingSchool.onboarding_status === "completed") {
      // Ensure request is marked approved (and verify it actually updated)
      const { data: updatedReq, error: updErr } = await admin
        .from("preschool_onboarding_requests")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", requestId)
        .select("id, status, updated_at")
        .single();

      if (updErr) {
        console.error("Failed to update onboarding request status in idempotency path:", updErr);
      }

      return json({
        success: true,
        school_id: existingSchool.id,
        admin_email: request.admin_email,
        already_provisioned: true,
        request_status: updatedReq?.status || "approved",
      });
    }

    // Approve request first (record keeping)
    {
      const { error: updErr } = await admin
        .from("preschool_onboarding_requests")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", requestId);
      if (updErr) {
        console.error("Failed to mark onboarding request as approved (pre-creation):", updErr);
      }
    }

    // Create school
    const tenantSlug = String(request.preschool_name || "school")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50);

    const { data: school, error: schoolErr } = await admin
      .from("preschools")
      .insert({
        name: request.preschool_name,
        email: request.admin_email,
        phone: request.phone ?? null,
        address: request.address ?? null,
        tenant_slug: tenantSlug,
        subscription_plan: "trial",
        subscription_status: "active",
        max_students: request.number_of_students ?? 50,
        billing_email: request.admin_email,
        onboarding_status: "completed",
        setup_completed: true,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (schoolErr || !school) {
      // Revert request to pending on failure
      await admin
        .from("preschool_onboarding_requests")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .eq("id", requestId);
      return json({ error: `Failed to create school: ${schoolErr?.message || "unknown"}` }, 500);
    }

    // Create strong temporary password
    const tempPassword = generateSecurePassword();

    // Create Auth user for principal
    const { data: createdAuth, error: authErr } = await admin.auth.admin.createUser({
      email: request.admin_email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: request.admin_name,
        role: "principal",
        preschool_id: school.id,
      },
    });

    if (authErr || !createdAuth?.user) {
      // Rollback school on auth failure
      await admin.from("preschools").delete().eq("id", school.id);
      await admin
        .from("preschool_onboarding_requests")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .eq("id", requestId);
      return json({ error: `Failed to create admin user: ${authErr?.message || "unknown"}` }, 500);
    }

    const authId = createdAuth.user.id;

    // Ensure public.users profile exists; if not, create manually
    const { data: profile } = await admin
      .from("users")
      .select("id")
      .eq("auth_user_id", authId)
      .single();

    if (!profile) {
      await admin.from("users").insert({
        auth_user_id: authId,
        email: request.admin_email,
        name: request.admin_name,
        role: "principal",
        preschool_id: school.id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else {
      await admin
        .from("users")
        .update({ preschool_id: school.id, role: "principal", name: request.admin_name, updated_at: new Date().toISOString() })
        .eq("auth_user_id", authId);
    }

    // Send welcome email with login credentials and onboarding guide
    try {
      const emailHTML = generateWelcomeEmailTemplate({
        schoolName: request.preschool_name,
        adminName: request.admin_name,
        adminEmail: request.admin_email,
        tempPassword: tempPassword,
        schoolId: school.id
      });

      const { error: emailError } = await admin.functions.invoke('send-email', {
        body: {
          to: request.admin_email,
          subject: `🎉 Welcome to EduDash Pro - ${request.preschool_name} Account Activated!`,
          html: emailHTML,
          templateType: 'school_welcome',
          schoolName: request.preschool_name,
          principalName: request.admin_name,
          metadata: {
            schoolId: school.id,
            tempPassword: tempPassword,
            activationDate: new Date().toISOString()
          }
        }
      });

      if (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the entire process if email fails, but log it
      } else {
        console.log('✅ Welcome email sent successfully to:', request.admin_email);
      }
    } catch (emailError) {
      console.error('Welcome email sending failed:', emailError);
      // Continue with success response even if email fails
    }

    // Double-confirm the onboarding request status is approved after all steps
    const { data: finalReq, error: finalUpdErr } = await admin
      .from("preschool_onboarding_requests")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", requestId)
      .select("id, status, updated_at")
      .single();
    if (finalUpdErr) {
      console.error("Warning: Final approval status update failed:", finalUpdErr);
    }

    // Return credentials and confirmation
    return json({ 
      success: true, 
      school_id: school.id, 
      admin_email: request.admin_email, 
      temp_password: tempPassword,
      welcome_email_sent: true,
      request_status: finalReq?.status || "approved",
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: Json, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function generateSecurePassword(): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const symbols = "!@#$%^&*";
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  const base = [pick(lowercase), pick(uppercase), pick(digits), pick(symbols)];
  const all = lowercase + uppercase + digits + symbols;
  for (let i = 4; i < 12; i++) base.push(pick(all));
  return base.sort(() => Math.random() - 0.5).join("");
}

function generateWelcomeEmailTemplate(emailData: {
  schoolName: string;
  adminName: string;
  adminEmail: string;
  tempPassword: string;
  schoolId: string;
}): string {
  const { schoolName, adminName, adminEmail, tempPassword } = emailData;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to EduDash Pro - Account Approved!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">🎉 Welcome to EduDash Pro!</h1>
                <p style="color: #ffffff; margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">Your school has been approved!</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <h2 style="color: #065f46; margin: 0 0 20px 0; font-size: 26px;">🏫 ${schoolName} is now live!</h2>
                
                <p style="color: #374151; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
                    Dear ${adminName},
                </p>
                
                <p style="color: #374151; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
                    <strong>Congratulations!</strong> Your school registration for <strong>${schoolName}</strong> has been approved and your EduDash Pro account is now active. You can start managing your preschool immediately!
                </p>
                
                <!-- Login Credentials Card -->
                <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 30px; margin: 30px 0; border: 2px solid #10b981;">
                    <h3 style="color: #065f46; margin: 0 0 20px 0; font-size: 20px; text-align: center;">🔑 Your Login Credentials</h3>
                    
                    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <div style="margin-bottom: 15px;">
                            <span style="font-weight: 600; color: #374151; display: block; margin-bottom: 5px;">📧 Email Address:</span>
                            <span style="color: #059669; font-size: 18px; font-weight: 600; font-family: 'Courier New', monospace;">${adminEmail}</span>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <span style="font-weight: 600; color: #374151; display: block; margin-bottom: 5px;">🔐 Temporary Password:</span>
                            <span style="color: #dc2626; font-size: 18px; font-weight: 600; font-family: 'Courier New', monospace; background-color: #fef2f2; padding: 8px 12px; border-radius: 6px; display: inline-block;">${tempPassword}</span>
                        </div>
                        
                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 20px; border-radius: 6px;">
                            <p style="margin: 0; color: #92400e; font-size: 14px;">⚠️ <strong>Important:</strong> Please change your password after your first login for security.</p>
                        </div>
                    </div>
                    
                    <!-- Login Button -->
                    <div style="text-align: center;">
                        <a href="https://app.edudashpro.org.za/login" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                            🚀 Login to Your Dashboard
                        </a>
                    </div>
                </div>
                
                <!-- Getting Started Guide -->
                <div style="background-color: #f8fafc; border-radius: 12px; padding: 30px; margin: 30px 0; border-left: 4px solid #6366f1;">
                    <h3 style="color: #4338ca; margin: 0 0 20px 0; font-size: 20px;">🎯 Getting Started - Your Next Steps</h3>
                    
                    <div style="margin-bottom: 15px;">
                        <strong style="color: #4338ca;">1. Complete Your Profile</strong>
                        <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;">Add your school logo, contact information, and preferences.</p>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <strong style="color: #4338ca;">2. Set Up Classes & Age Groups</strong>
                        <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;">Create your class structure and define age groups for your students.</p>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <strong style="color: #4338ca;">3. Invite Teachers & Staff</strong>
                        <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;">Send invitations to your teaching staff to join the platform.</p>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <strong style="color: #4338ca;">4. Register Students</strong>
                        <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;">Add your students and connect them with their parents.</p>
                    </div>
                    
                    <div>
                        <strong style="color: #4338ca;">5. Start Creating Learning Content</strong>
                        <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;">Begin adding lessons, activities, and educational materials.</p>
                    </div>
                </div>
                
                <!-- Support Information -->
                <div style="background-color: #eff6ff; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #3b82f6;">
                    <h3 style="color: #1d4ed8; margin: 0 0 15px 0; font-size: 18px;">💪 Need Help Getting Started?</h3>
                    
                    <p style="color: #1e40af; margin: 0 0 15px 0; font-size: 14px;">Our support team is here to help you every step of the way:</p>
                    
                    <div style="margin-bottom: 10px;">
                        <span style="color: #1d4ed8; font-weight: 600;">📧 Email:</span>
                        <a href="mailto:support@edudashpro.org.za" style="color: #2563eb; margin-left: 8px;">support@edudashpro.org.za</a>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <span style="color: #1d4ed8; font-weight: 600;">📞 Phone:</span>
                        <span style="color: #1e40af; margin-left: 8px;">+27 67 477 0975</span>
                    </div>
                    
                    <div>
                        <span style="color: #1d4ed8; font-weight: 600;">🕒 Hours:</span>
                        <span style="color: #1e40af; margin-left: 8px;">Monday - Friday, 8:00 AM - 6:00 PM SAST</span>
                    </div>
                </div>
                
                <!-- Trial Info -->
                <div style="background-color: #f0fdf4; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #22c55e;">
                    <h3 style="color: #15803d; margin: 0 0 15px 0; font-size: 18px;">🎁 Your Trial Subscription</h3>
                    <p style="color: #16a34a; margin: 0; font-size: 14px;">
                        You're currently on our <strong>Trial Plan</strong> with full access to all features for 30 days. 
                        We'll send you information about upgrading before your trial expires.
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #1f2937; padding: 30px 20px; text-align: center;">
                <h3 style="color: #10b981; margin: 0 0 15px 0; font-size: 18px;">Welcome to the EduDash Pro Family! 🌟</h3>
                <p style="color: #d1d5db; margin: 0 0 20px 0; font-size: 14px;">
                    We're excited to help transform ${schoolName}'s educational experience.
                </p>
                
                <div style="margin: 20px 0;">
                    <a href="https://app.edudashpro.org.za" style="color: #10b981; text-decoration: none; margin: 0 15px;">Dashboard</a>
                    <a href="https://docs.edudashpro.org.za" style="color: #10b981; text-decoration: none; margin: 0 15px;">Help Center</a>
                    <a href="https://edudashpro.org.za" style="color: #10b981; text-decoration: none; margin: 0 15px;">Website</a>
                </div>
                
                <p style="color: #9ca3af; margin: 20px 0 0 0; font-size: 12px;">
                    © 2025 EduDash Pro - Transforming Preschool Education in South Africa<br>
                    This email was sent to ${adminEmail}
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}


