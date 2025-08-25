# EduDash Pro Email Template Setup

## Overview
This directory contains custom email templates for EduDash Pro's authentication flows.

## Files
- `password-reset.html` - HTML email template for password reset
- `password-reset.txt` - Plain text fallback for password reset
- `setup-instructions.md` - This file

## Setup Instructions

### 1. Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your EduDash Pro project
3. Navigate to **Authentication** → **Email Templates**

### 2. Configure Password Reset Template

#### HTML Template
1. Click on **Reset Password** template
2. Replace the default HTML with the content from `password-reset.html`
3. Ensure the subject line is: `🔐 Reset Your EduDash Pro Password`

#### Plain Text Template
1. In the same template editor, switch to **Plain Text** tab
2. Replace with content from `password-reset.txt`

### 3. Template Variables
The following variables are automatically replaced by Supabase:
- `{{ .ConfirmationURL }}` - The password reset link
- `{{ .Email }}` - User's email address
- `{{ .CurrentYear }}` - Current year (you may need to hardcode this as 2025)

### 4. Redirect URL Configuration
In **Authentication** → **URL Configuration**, set:
- **Site URL**: `https://yourdomain.com` (or your production URL)
- **Redirect URLs**: Add your password reset page URL

### 5. SMTP Configuration (Optional)
For custom branding in the "from" field:
1. Go to **Authentication** → **Settings**
2. Configure **SMTP Settings** with your domain email
3. Use something like: `noreply@edudashpro.org.za`

## Template Features

### 🎨 Design Elements
- **EduDash Pro branding** with gradient backgrounds
- **Mobile-responsive** design
- **Professional styling** with modern UI elements
- **Security notices** for user trust
- **Clear call-to-action** button

### 🔒 Security Features
- **24-hour expiry notice**
- **Security warnings** about ignoring unwanted emails
- **Backup text link** for accessibility

### 📱 Mobile Optimization
- **Responsive design** works on all devices
- **Touch-friendly buttons**
- **Readable fonts** and spacing

## Testing
After setup, test by:
1. Going to your app's forgot password flow
2. Entering a test email
3. Checking the email appearance and functionality

## Customization
To further customize:
- Update colors in the CSS to match your exact brand colors
- Add your logo URL (replace the emoji with `<img>` tag)
- Modify the messaging to match your tone
- Add additional links (privacy policy, terms, etc.)

## Production Checklist
- [ ] HTML template uploaded and tested
- [ ] Plain text template uploaded
- [ ] Subject line updated
- [ ] SMTP configured (if using custom domain)
- [ ] Redirect URLs configured
- [ ] Test email sent and received
- [ ] Mobile appearance verified
- [ ] Links work correctly

