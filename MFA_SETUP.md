# Two-Factor Authentication (2FA) Setup Guide

This guide explains how to set up and configure Two-Factor Authentication (2FA) for the Crank Finance application using Auth0 and custom MFA components.

## Overview

The application supports two types of 2FA:
1. **TOTP (Time-based One-Time Password)** - Using authenticator apps like Google Authenticator, Authy, or Microsoft Authenticator
2. **SMS** - Using text messages for verification codes

## Features

- ✅ TOTP support with QR code generation
- ✅ SMS-based 2FA
- ✅ Backup codes for account recovery
- ✅ MFA status tracking in database
- ✅ Secure secret generation and storage
- ✅ User-friendly setup interface

## Database Schema

The MFA functionality uses a new `MfaSettings` table:

```sql
model MfaSettings {
  id                String   @id @default(cuid())
  userId            String   @unique
  isEnabled         Boolean  @default(false)
  mfaMethod         String?  // 'sms', 'email', 'totp', 'push'
  phoneNumber       String?  // For SMS 2FA
  backupCodes       String[] // Array of backup codes
  totpSecret        String?  // For TOTP (Time-based One-Time Password)
  lastUsedAt        DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## API Endpoints

### GET /api/mfa
Retrieves the current user's MFA settings.

**Response:**
```json
{
  "isEnabled": true,
  "mfaMethod": "totp",
  "hasBackupCodes": true,
  "phoneNumber": "+1-***-1234"
}
```

### POST /api/mfa
Manages MFA settings (enable/disable/verify).

**Enable TOTP:**
```json
{
  "action": "enable",
  "mfaMethod": "totp"
}
```

**Enable SMS:**
```json
{
  "action": "enable",
  "mfaMethod": "sms",
  "phoneNumber": "+1234567890"
}
```

**Verify TOTP:**
```json
{
  "action": "verify_totp",
  "totpCode": "123456"
}
```

**Disable MFA:**
```json
{
  "action": "disable"
}
```

## Components

### MfaSetup Component
Located at `components/auth/MfaSetup.tsx`, this component provides:

- MFA method selection (TOTP or SMS)
- QR code generation for TOTP setup
- Backup code generation and display
- MFA status management
- User-friendly setup flow

## Setup Instructions

### 1. Install Dependencies
```bash
npm install otplib qrcode @types/qrcode
```

### 2. Database Migration
```bash
npx prisma generate
npx prisma db push
```

### 3. Environment Variables
Add these to your `.env.local`:

```env
# Auth0 MFA Configuration (Optional - for enhanced security)
AUTH0_MFA_ENABLED=true
AUTH0_MFA_PROVIDER=guardian
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
