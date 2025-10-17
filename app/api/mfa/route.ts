import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { authenticator } from 'otplib'

// GET /api/mfa - Get user's MFA settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mfaSettings = await prisma.mfaSettings.findUnique({
      where: { userId: session.user.id }
    })

    if (!mfaSettings) {
      return NextResponse.json({ 
        isEnabled: false,
        mfaMethod: null,
        hasBackupCodes: false
      })
    }

    return NextResponse.json({
      isEnabled: mfaSettings.isEnabled,
      mfaMethod: mfaSettings.mfaMethod,
      hasBackupCodes: mfaSettings.backupCodes.length > 0,
      phoneNumber: mfaSettings.phoneNumber ? 
        mfaSettings.phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1-***-$2') : null
    })
  } catch (error) {
    console.error('Error fetching MFA settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/mfa - Enable/disable MFA
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, mfaMethod, phoneNumber, totpCode } = await request.json()

    if (action === 'enable') {
      if (mfaMethod === 'totp') {
        // Generate TOTP secret
        const secret = authenticator.generateSecret()
        
        // Generate backup codes
        const backupCodes = Array.from({ length: 10 }, () => 
          randomBytes(4).toString('hex').toUpperCase()
        )

        await prisma.mfaSettings.upsert({
          where: { userId: session.user.id },
          create: {
            userId: session.user.id,
            isEnabled: true,
            mfaMethod: 'totp',
            totpSecret: secret,
            backupCodes
          },
          update: {
            isEnabled: true,
            mfaMethod: 'totp',
            totpSecret: secret,
            backupCodes
          }
        })

        // Generate QR code URL for TOTP setup
        const qrCodeUrl = authenticator.keyuri(
          session.user.email!,
          'Crank Finance',
          secret
        )

        return NextResponse.json({
          success: true,
          qrCodeUrl,
          secret,
          backupCodes
        })
      } else if (mfaMethod === 'sms' && phoneNumber) {
        // Generate backup codes
        const backupCodes = Array.from({ length: 10 }, () => 
          randomBytes(4).toString('hex').toUpperCase()
        )

        await prisma.mfaSettings.upsert({
          where: { userId: session.user.id },
          create: {
            userId: session.user.id,
            isEnabled: true,
            mfaMethod: 'sms',
            phoneNumber,
            backupCodes
          },
          update: {
            isEnabled: true,
            mfaMethod: 'sms',
            phoneNumber,
            backupCodes
          }
        })

        return NextResponse.json({
          success: true,
          backupCodes
        })
      }
    } else if (action === 'disable') {
      await prisma.mfaSettings.update({
        where: { userId: session.user.id },
        data: {
          isEnabled: false,
          mfaMethod: null,
          totpSecret: null,
          phoneNumber: null,
          backupCodes: []
        }
      })

      return NextResponse.json({ success: true })
    } else if (action === 'verify_totp' && totpCode) {
      const mfaSettings = await prisma.mfaSettings.findUnique({
        where: { userId: session.user.id }
      })

      if (!mfaSettings?.totpSecret) {
        return NextResponse.json({ error: 'TOTP not configured' }, { status: 400 })
      }

      const isValid = authenticator.verify({
        token: totpCode,
        secret: mfaSettings.totpSecret
      })

      if (isValid) {
        await prisma.mfaSettings.update({
          where: { userId: session.user.id },
          data: { lastUsedAt: new Date() }
        })
      }

      return NextResponse.json({ success: isValid })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error managing MFA:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
