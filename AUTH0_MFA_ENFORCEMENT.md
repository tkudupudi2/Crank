# Auth0 MFA Enforcement Setup Guide

This guide explains how to configure Auth0 to enforce Multi-Factor Authentication (MFA) for the Crank Finance application.

## Overview

The application now redirects users to Auth0's Universal Login with MFA enforcement. Users will be required to complete MFA verification (via email) before accessing the application.

## Quick Setup (Recommended)

### 1. Enable Email MFA in Auth0 Dashboard

1. **Go to Auth0 Dashboard** → **Security** → **Multi-factor Authentication**
2. **Enable Email MFA**:
   - Toggle "Email" to ON
   - Configure email templates if needed
   - Test with a user account

### 2. Create Auth0 Action for MFA Enforcement

1. **Go to Auth0 Dashboard** → **Actions** → **Flows**
2. **Select "Login" flow**
3. **Create a new Action**:
   - Name: "Enforce MFA for Crank"
   - Runtime: Node.js 18
4. **Copy the code from `auth0-actions/enforce-mfa.js`**
5. **Add Secret**:
   - Name: `CRANK_CLIENT_ID`
   - Value: Your Auth0 Client ID
6. **Deploy the Action**
7. **Add the Action to the Login flow**

### 3. Test the Setup

1. **Sign out** of your application
2. **Go to the sign-in page**
3. **Click "Sign In with 2FA"**
4. **Enter your credentials**
5. **Check your email** for the verification code
6. **Enter the code** to complete login

## Alternative Setup Methods

### Method 1: Auth0 Policies (Advanced)

1. **Go to Auth0 Dashboard** → **Security** → **Multi-factor Authentication**
2. **Click "Policies" tab**
3. **Create a new policy**:
   - **Name**: "Crank Finance MFA Policy"
   - **Conditions**:
     - Client ID equals your Auth0 Client ID
   - **Actions**: Require MFA

### Method 2: Application Settings

1. **Go to Auth0 Dashboard** → **Applications** → **Your Crank App**
2. **Go to "Advanced Settings"** → **Grant Types**
3. **Enable "Authorization Code"**
4. **Go to "Advanced Settings"** → **OAuth**
5. **Add to "Allowed Callback URLs"**:
   ```
   http://localhost:3000/api/auth/callback/auth0
   https://your-domain.vercel.app/api/auth/callback/auth0
   ```

### Method 3: Rules (Legacy - Not Recommended)

If you're using Auth0 Rules (legacy), you can add this rule:

```javascript
function (user, context, callback) {
  // Check if this is the Crank Finance app
  if (context.clientID === 'YOUR_CLIENT_ID') {
    // Enforce MFA
    context.multifactor = {
      provider: 'any',
      allowRememberBrowser: false
    };
  }
  
  callback(null, user, context);
}
```

## Configuration Options

### Email MFA Settings

In Auth0 Dashboard → Security → Multi-factor Authentication → Email:

- **From Name**: Crank Finance
- **From Email**: noreply@yourdomain.com
- **Subject**: Your Crank Finance verification code
- **Message**: Customize the email template

### SMS MFA Settings (Optional)

If you want to use SMS instead of email:

1. **Enable SMS MFA** in Auth0 Dashboard
2. **Configure Twilio** (requires paid Twilio account)
3. **Update the Action** to use 'sms' instead of 'email'

### TOTP MFA Settings (Optional)

For authenticator apps:

1. **Enable TOTP MFA** in Auth0 Dashboard
2. **Update the Action** to use 'any' for multiple MFA methods

## Testing

### Test Cases

1. **New User Registration**:
   - User signs up
   - Should be prompted for MFA setup
   - Should receive email verification

2. **Existing User Login**:
   - User enters credentials
   - Should be prompted for MFA
   - Should receive email with code

3. **MFA Bypass** (if configured):
   - Trusted devices should remember MFA
   - Time-based bypass should work

### Troubleshooting

#### Common Issues:

1. **"MFA not enforced"**:
   - Check if the Action is deployed and added to Login flow
   - Verify the Client ID secret is correct
   - Check Auth0 logs for errors

2. **"Email not received"**:
   - Check Auth0 email configuration
   - Verify email templates are correct
   - Check spam folder

3. **"Redirect loop"**:
   - Verify callback URLs are correct
   - Check NextAuth configuration
   - Ensure Auth0 client settings match

4. **"Action deployment failed"**:
   - Check JavaScript syntax
   - Verify all required secrets are added
   - Check Auth0 runtime version

## Security Considerations

### Best Practices:

1. **Always use HTTPS** in production
2. **Configure proper CORS** settings
3. **Set appropriate session timeouts**
4. **Monitor MFA events** in Auth0 logs
5. **Regular security audits**

### Monitoring:

1. **Auth0 Dashboard** → **Monitoring** → **Logs**
2. **Filter by Event Type**: "s" (Success) and "f" (Failed)
3. **Look for MFA-related events**

## Production Deployment

### Environment Variables:

Make sure these are set in your production environment:

```env
AUTH0_CLIENT_ID=your_production_client_id
AUTH0_CLIENT_SECRET=your_production_client_secret
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=your_production_secret
```

### Vercel Deployment:

1. **Add environment variables** in Vercel dashboard
2. **Deploy the application**
3. **Test MFA flow** in production
4. **Monitor logs** for any issues

## Support

### Auth0 Resources:

- [Auth0 MFA Documentation](https://auth0.com/docs/mfa)
- [Auth0 Actions Documentation](https://auth0.com/docs/customize/actions)
- [Auth0 Universal Login](https://auth0.com/docs/authenticate/login/universal-login)

### Application Support:

- Check the application logs
- Verify Auth0 configuration
- Test with different user accounts
- Review the MFA setup documentation

## Next Steps

After setting up MFA enforcement:

1. **Test thoroughly** with different user scenarios
2. **Monitor usage** and adjust settings as needed
3. **Consider additional security** measures (rate limiting, etc.)
4. **Document the setup** for your team
5. **Plan for user support** and training

The MFA enforcement is now active and will require all users to complete email verification before accessing the Crank Finance application.
