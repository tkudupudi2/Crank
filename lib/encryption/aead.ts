import crypto from 'crypto'

export interface Ciphertext {
  keyId: string
  iv: string // base64
  ct: string // base64
  tag: string // base64
}

export function encryptAesGcm(dek: Buffer, plaintext: Buffer, aad?: Buffer, keyId: string = 'key') : Ciphertext {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv)
  if (aad) cipher.setAAD(aad)
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    keyId,
    iv: iv.toString('base64'),
    ct: ct.toString('base64'),
    tag: tag.toString('base64'),
  }
}

export function decryptAesGcm(dek: Buffer, payload: Ciphertext, aad?: Buffer): Buffer {
  const iv = Buffer.from(payload.iv, 'base64')
  const ct = Buffer.from(payload.ct, 'base64')
  const tag = Buffer.from(payload.tag, 'base64')
  const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv)
  if (aad) decipher.setAAD(aad)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ct), decipher.final()])
}


