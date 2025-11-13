import { ensureEncryptionReady } from './keys'
import { encryptAesGcm, decryptAesGcm, Ciphertext } from './aead'

function toBuffer(value: unknown): Buffer {
  if (value === null || value === undefined) return Buffer.from('')
  if (typeof value === 'string') return Buffer.from(value, 'utf8')
  return Buffer.from(JSON.stringify(value), 'utf8')
}

export function encryptField(value: unknown, aadParts: string[]): string | null {
  const ready = ensureEncryptionReady()
  if (!ready) return null
  const { dek, keyId } = ready
  const aad = Buffer.from(aadParts.join('|'), 'utf8')
  const ct = encryptAesGcm(dek, toBuffer(value), aad, keyId)
  return JSON.stringify(ct)
}

export function decryptField(payload: string | null, aadParts: string[]): any {
  if (!payload) return null
  const ready = ensureEncryptionReady()
  if (!ready) return null
  const { dek } = ready
  try {
    const obj = JSON.parse(payload) as Ciphertext
    const aad = Buffer.from(aadParts.join('|'), 'utf8')
    const pt = decryptAesGcm(dek, obj, aad)
    const s = pt.toString('utf8')
    if (!s) return ''
    try {
      return JSON.parse(s)
    } catch {
      return s
    }
  } catch {
    return null
  }
}


