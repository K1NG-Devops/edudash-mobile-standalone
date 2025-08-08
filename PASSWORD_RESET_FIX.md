# 🔐 Password Reset Configuration Fix

## Issue Description
The password reset emails contain links that result in "Authentication Error" when clicked. This happens because the redirect URL in the mobile app doesn't match the Supabase project configuration.

## Root Cause
The mobile app is trying to use `localhost:3000` or local URLs for password reset redirects, but the Supabase project is configured for the production domain (`edudashpro.com`).

## Fix Instructions

### 1. Update Supabase Auth Configuration

#### In your Supabase Dashboard:
1. Go to **Authentication → URL Configuration**
2. Add these redirect URLs:
   ```
   http://localhost:3000/auth/reset-password
   https://edudashpro.com/auth/reset-password
   https://edudashpro.com/auth/callback
   ```

#### Site URL should be:
```
https://edudashpro.com
```

### 2. Mobile App Configuration

The mobile app needs to use the correct redirect URL that matches your production setup.

Update the password reset function in:
- `app/(auth)/forgot-password.tsx`
- `contexts/SimpleWorkingAuth.tsx`

Change the redirectTo URL from:
```typescript
const redirectTo = `${window.location.origin}/auth/reset-password`;
```

To:
```typescript
const redirectTo = 'https://edudashpro.com/auth/reset-password';
```

### 3. Email Template Configuration

#### In Supabase Dashboard → Authentication → Email Templates:

Update the **Reset Password** template to use the correct redirect URL:

```html
<h2>Reset Your Password</h2>
<p>Follow this link to reset the password for your EduDash Pro account:</p>
<p><a href="{{ .SiteURL }}/auth/reset-password?access_token={{ .TokenHash }}&type=recovery">Reset Password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>This link will expire in {{ .ExpiresIn }} hour(s).</p>
```

### 4. Testing the Fix

1. **Update the forgot-password screen** to use the production URL
2. **Test with a real email address**
3. **Verify the link redirects to the correct page**
4. **Ensure the password update process works**

### 5. Environment-Specific Configuration

For better flexibility, you can make the redirect URL environment-dependent:

```typescript
const getRedirectUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://edudashpro.com/auth/reset-password';
  } else if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000/auth/reset-password';
  }
  return 'http://localhost:3000/auth/reset-password';
};
```

## Expected Outcome

After implementing these fixes:
1. ✅ Password reset emails will contain working links
2. ✅ Users can successfully reset their passwords
3. ✅ The authentication error will be resolved
4. ✅ Both development and production environments will work correctly

## Additional Notes

- The password reset link expires in 1 hour by default
- Make sure your production web app has the `/auth/reset-password` route implemented
- Test the entire flow from email to password update
- Consider implementing deep linking for mobile apps if needed

---

*Fix Status: Ready to implement*  
*Priority: High - Critical for user onboarding*
