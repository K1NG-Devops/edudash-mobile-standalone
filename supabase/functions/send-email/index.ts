import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  templateType?: 'onboarding' | 'invitation' | 'notification'
  schoolName?: string
  principalName?: string
  loginUrl?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const resendApiKey = Deno.env.get('SERVER_RESEND_API_KEY') || Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@edudashpro.org.za'
    
    if (!resendApiKey) {
      throw new Error('SERVER_RESEND_API_KEY/RESEND_API_KEY environment variable is not set')
    }

    // Parse the request body
    const emailRequest: EmailRequest = await req.json()
    const { to, subject, html, templateType, schoolName, principalName, loginUrl } = emailRequest

    // Validate required fields
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create email payload for Resend
    const emailPayload = {
      from: fromEmail,
      to: [to],
      subject: subject,
      html: html
    }

    // Send email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('Resend API error:', responseData)
      throw new Error(`Failed to send email: ${responseData.message || 'Unknown error'}`)
    }

    // Log email sent (optional - for analytics)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SERVER_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      // Log the email activity
      await supabase.from('activity_logs').insert({
        activity_type: 'email_sent',
        description: `Email sent to ${to}: ${subject}`,
        metadata: {
          email_id: responseData.id,
          template_type: templateType,
          school_name: schoolName,
          principal_name: principalName
        }
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        email_id: responseData.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Send email function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* Example usage from client:
  
const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    to: 'principal@school.com',
    subject: 'Welcome to EduDash Pro',
    html: '<h1>Welcome!</h1><p>Your school has been set up...</p>',
    templateType: 'onboarding',
    schoolName: 'ABC Preschool',
    principalName: 'Jane Smith',
    loginUrl: 'https://app.edudashpro.com/login'
  }
})

*/
