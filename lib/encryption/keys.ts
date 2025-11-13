import crypto from 'crypto'

export function getPlainDek(): Buffer | null {
  const b64 = process.env.PLAIN_DEK
  if (!b64) return null
  try {
    const buf = Buffer.from(b64, 'base64')
    if (buf.length !== 32) return null
    return buf
  } catch {
    return null
  }
}

export function ensureEncryptionReady(): { dek: Buffer; keyId: string } | null {
  const dek = getPlainDek()
  if (!dek) return null
  const keyId = process.env.ENCRYPTION_KEY_ID || 'local-plain-dek'
  return { dek, keyId }
}


