'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  Shield, 
  Smartphone, 
  Key, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Download
} from 'lucide-react'
import QRCode from 'qrcode'

interface MfaSettings {
  isEnabled: boolean
  mfaMethod: string | null
  hasBackupCodes: boolean
  phoneNumber: string | null
}

interface MfaSetupProps {
  onComplete?: () => void
}

export default function MfaSetup({ onComplete }: MfaSetupProps) {
  const [mfaSettings, setMfaSettings] = useState<MfaSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [settingUp, setSettingUp] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<'totp' | 'sms' | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchMfaSettings()
  }, [])

  const fetchMfaSettings = async () => {
    try {
      const response = await fetch('/api/mfa')
      const data = await response.json()
      setMfaSettings(data)
    } catch (error) {
      console.error('Error fetching MFA settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const enableMfa = async (method: 'totp' | 'sms') => {
    setSettingUp(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enable',
          mfaMethod: method,
          phoneNumber: method === 'sms' ? phoneNumber : undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        if (method === 'totp') {
          setQrCodeUrl(data.qrCodeUrl)
          setBackupCodes(data.backupCodes)
        } else {
          setBackupCodes(data.backupCodes)
        }
        setSelectedMethod(method)
        setSuccess('MFA setup initiated successfully!')
      } else {
        setError(data.error || 'Failed to enable MFA')
      }
    } catch (error) {
      setError('Failed to enable MFA')
    } finally {
      setSettingUp(false)
    }
  }

  const verifyTotp = async () => {
    if (!totpCode) return

    try {
      const response = await fetch('/api/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_totp',
          totpCode
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('TOTP verified successfully! MFA is now enabled.')
        await fetchMfaSettings()
        onComplete?.()
      } else {
        setError('Invalid TOTP code. Please try again.')
      }
    } catch (error) {
      setError('Failed to verify TOTP code')
    }
  }

  const disableMfa = async () => {
    try {
      const response = await fetch('/api/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable' })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('MFA disabled successfully!')
        await fetchMfaSettings()
      } else {
        setError('Failed to disable MFA')
      }
    } catch (error) {
      setError('Failed to disable MFA')
    }
  }

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    setSuccess('Backup codes copied to clipboard!')
  }

  const downloadBackupCodes = () => {
    const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'crank-backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading MFA settings...</div>
        </CardContent>
      </Card>
    )
  }

  if (mfaSettings?.isEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-green-600" />
            Two-Factor Authentication Enabled
          </CardTitle>
          <CardDescription>
            Your account is protected with {mfaSettings.mfaMethod?.toUpperCase()} authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">
                {mfaSettings.mfaMethod === 'totp' ? 'Authenticator App' : 'SMS'} Protection Active
              </span>
            </div>
            {mfaSettings.phoneNumber && (
              <span className="text-sm text-gray-600">
                {mfaSettings.phoneNumber}
              </span>
            )}
          </div>

          {mfaSettings.hasBackupCodes && (
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center mb-2">
                <Key className="h-4 w-4 text-yellow-600 mr-2" />
                <span className="text-yellow-800 font-medium">Backup Codes Available</span>
              </div>
              <p className="text-sm text-yellow-700 mb-2">
                You have backup codes saved. Keep them in a safe place.
              </p>
            </div>
          )}

          <Button 
            variant="outline" 
            onClick={disableMfa}
            className="w-full"
          >
            Disable Two-Factor Authentication
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (selectedMethod === 'totp' && qrCodeUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Setup Authenticator App</CardTitle>
          <CardDescription>
            Scan the QR code with your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="inline-block p-4 bg-white rounded-lg border">
              <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Enter the 6-digit code from your authenticator app
            </label>
            <Input
              type="text"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
          </div>

          <Button 
            onClick={verifyTotp}
            disabled={totpCode.length !== 6}
            className="w-full"
          >
            Verify and Enable MFA
          </Button>

          <Button 
            variant="outline" 
            onClick={() => setSelectedMethod(null)}
            className="w-full"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (selectedMethod === 'sms' && backupCodes.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Backup Codes Generated</CardTitle>
          <CardDescription>
            Save these backup codes in a safe place. You can use them if you lose access to your phone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg font-mono text-sm">
            {backupCodes.map((code, index) => (
              <div key={index} className="p-2 bg-white rounded border">
                {code}
              </div>
            ))}
          </div>

          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={copyBackupCodes}
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Codes
            </Button>
            <Button 
              variant="outline" 
              onClick={downloadBackupCodes}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          <Button 
            onClick={() => {
              setSelectedMethod(null)
              setBackupCodes([])
              fetchMfaSettings()
            }}
            className="w-full"
          >
            Complete Setup
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Enable Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center p-3 bg-red-50 text-red-800 rounded-lg">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center p-3 bg-green-50 text-green-800 rounded-lg">
            <CheckCircle className="h-4 w-4 mr-2" />
            {success}
          </div>
        )}

        <div className="grid gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Smartphone className="h-5 w-5 mr-2 text-blue-600" />
              <h3 className="font-medium">Authenticator App</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Use an app like Google Authenticator or Authy to generate codes
            </p>
            <Button 
              onClick={() => enableMfa('totp')}
              disabled={settingUp}
              className="w-full"
            >
              {settingUp ? 'Setting up...' : 'Setup with Authenticator App'}
            </Button>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Key className="h-5 w-5 mr-2 text-green-600" />
              <h3 className="font-medium">SMS Text Message</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Receive verification codes via text message
            </p>
            <div className="space-y-2">
              <Input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <Button 
                onClick={() => enableMfa('sms')}
                disabled={settingUp || !phoneNumber}
                className="w-full"
              >
                {settingUp ? 'Setting up...' : 'Setup with SMS'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
