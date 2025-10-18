# Two-Factor Authentication (2FA) Setup Guide

This guide explains how to set up and configure Two-Factor Authentication (2FA) for the Crank Finance application using Auth0's built-in MFA system.

## Overview

The application uses Auth0's built-in Multi-Factor Authentication system, which provides:

1. **Email-based MFA** - Verification codes sent via email
2. **SMS MFA** - Text message verification (optional)
3. **TOTP MFA** - Authenticator app support (optional)
4. **Automatic enforcement** - All users must complete MFA during login

## Features

- ✅ Email-based MFA (primary method)
- ✅ Auth0-managed security
- ✅ Automatic MFA enforcement
- ✅ Enterprise-grade security
- ✅ No custom database storage needed
- ✅ Seamless user experience

## How It Works

The MFA system is entirely managed by Auth0:

1. **User attempts to sign in** → Redirected to Auth0 Universal Login
2. **User enters credentials** → Auth0 validates username/password
3. **Auth0 sends verification code** → User receives email with code
4. **User enters verification code** → Auth0 validates and completes login
5. **User is redirected to app** → Access granted with MFA completed

## Auth0 Integration

The application integrates with Auth0's MFA system through:

- **Universal Login** - Auth0's secure login page
- **MFA Enforcement** - Automatic MFA requirement
- **Email Verification** - Primary MFA method
- **Session Management** - Secure token handling

## Setup Instructions

### 1. Auth0 Dashboard Configuration
1. **Go to Auth0 Dashboard** → **Security** → **Multi-factor Authentication**
2. **Enable Email MFA**:
   - Toggle "Email" to ON
   - Configure email templates if needed
3. **Test with a user account** to ensure it works

### 2. Deploy Auth0 Action (Optional but Recommended)
1. **Go to Auth0 Dashboard** → **Actions** → **Flows**
2. **Select "Login" flow**
3. **Create a new Action** using the code from `auth0-actions/enforce-mfa.js`
4. **Deploy the Action** and add it to the Login flow

### 3. Environment Variables
Ensure these are set in your `.env.local`:

```env
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### 4. Auth0 Configuration

#### Enable MFA in Auth0 Dashboard:
1. Go to Auth0 Dashboard → Security → Multi-factor Authentication
2. Enable the desired MFA methods:
   - **SMS** (requires Twilio integration)
   - **Google Authenticator** (TOTP)
   - **Push notifications** (optional)

#### Configure Guardian (Recommended):
1. Go to Auth0 Dashboard → Security → Multi-factor Authentication
2. Enable "Auth0 Guardian"
3. Configure your preferred MFA methods

#### Configure MFA Enforcement:
1. Go to Auth0 Dashboard → Security → Multi-factor Authentication
2. Click on "Policies" tab
3. Create a new policy or edit existing one:
   - **Policy Name**: "Enforce MFA for Crank App"
   - **Conditions**: 
     - Client ID equals your Auth0 Client ID
     - User has MFA enabled
   - **Actions**: Require MFA

#### Configure Email MFA (Simplest Option):
1. Go to Auth0 Dashboard → Security → Multi-factor Authentication
2. Enable "Email" as an MFA method
3. Configure email templates if needed
4. Test with a user account

#### Alternative: Use Auth0 Actions for MFA Enforcement:
1. Go to Auth0 Dashboard → Actions → Flows
2. Select "Login" flow
3. Create a new Action with this code:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  // Check if user has MFA enabled
  if (event.user.app_metadata?.mfa_enabled) {
    // Enforce MFA
    api.multifactor.enable('email');
  }
};
```

4. Deploy the action and add it to the Login flow

### 5. Application Integration

The MFA setup is integrated into the Settings page (`/dashboard/settings`). Users can:

1. Navigate to Settings
2. Find the "Two-Factor Authentication" section
3. Choose between TOTP or SMS setup
4. Follow the guided setup process
5. Save backup codes securely

## Security Considerations

### TOTP Secrets
- TOTP secrets are generated using `otplib` with cryptographically secure random bytes
- Secrets are stored encrypted in the database
- QR codes are generated client-side for security

### Backup Codes
- 10 backup codes are generated per user
- Codes are 8-character hexadecimal strings
- Users are encouraged to download and store them securely
- Codes are hashed before storage (recommended enhancement)

### Phone Numbers
- Phone numbers are partially masked in the UI for privacy
- SMS verification should be implemented for production use

## Testing

### TOTP Testing
1. Use an authenticator app (Google Authenticator, Authy, etc.)
2. Scan the QR code during setup
3. Enter the 6-digit code to verify
4. Test login with the authenticator app

### SMS Testing
1. Enter a valid phone number
2. The system will generate backup codes
3. SMS sending would need to be implemented for production

## Production Considerations

### Required Enhancements:
1. **SMS Integration**: Implement actual SMS sending (Twilio, AWS SNS, etc.)
2. **Rate Limiting**: Add rate limiting for MFA attempts
3. **Audit Logging**: Log MFA events for security monitoring
4. **Backup Code Hashing**: Hash backup codes before storage
5. **Session Management**: Handle MFA verification in login flow
6. **Error Handling**: Improve error messages and recovery flows

### Auth0 Integration:
- Configure Auth0 rules to enforce MFA
- Set up proper redirect URLs
- Configure MFA policies and rules
- Test with Auth0's MFA testing tools

## Troubleshooting

### Common Issues:

1. **QR Code Not Displaying**
   - Check if `qrcode` package is installed
   - Verify the TOTP secret is generated correctly

2. **TOTP Verification Failing**
   - Ensure system time is synchronized
   - Check if the authenticator app is properly configured
   - Verify the secret is correctly stored

3. **Database Errors**
   - Run `npx prisma generate` and `npx prisma db push`
   - Check database connection and permissions

4. **Auth0 Integration Issues**
   - Verify Auth0 MFA is enabled in dashboard
   - Check client configuration and scopes
   - Ensure proper redirect URLs are configured

## Future Enhancements

- [ ] WebAuthn/FIDO2 support
- [ ] Hardware security key support
- [ ] Biometric authentication
- [ ] Advanced MFA policies
- [ ] MFA analytics and reporting
- [ ] Custom MFA providers
- [ ] Emergency access codes
- [ ] MFA bypass for trusted devices

## Support

For issues or questions regarding MFA implementation:
1. Check the Auth0 documentation
2. Review the component code in `components/auth/MfaSetup.tsx`
3. Check the API implementation in `app/api/mfa/route.ts`
4. Verify database schema and migrations
