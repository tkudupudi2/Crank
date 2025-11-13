import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encryptField } from '@/lib/encryption/fields'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow running even if ENCRYPTION_ENABLED=false so we can backfill from plaintext

    const userId = (session.user as any).id

    const limitParam = request.nextUrl.searchParams.get('limit')
    const limit = limitParam ? Math.max(1, Math.min(2000, parseInt(limitParam))) : 1000

    let txUpdated = 0
    let accUpdated = 0

    // Overwrite-encrypt Transactions for this user
    // Read both plaintext and encrypted fields - use plaintext if available, otherwise decrypt from encrypted
    const txs = await prisma.transaction.findMany({
      where: { userId },
      select: {
        id: true,
        description: true,
        merchantName: true,
        accountOwner: true,
        address: true,
        city: true,
        region: true,
        postalCode: true,
        country: true,
        storeNumber: true,
        subcategory: true,
        category: true,
        descriptionEnc: true,
        merchantNameEnc: true,
        accountOwnerEnc: true,
        addressEnc: true,
        cityEnc: true,
        regionEnc: true,
        postalCodeEnc: true,
        countryEnc: true,
        storeNumberEnc: true,
        subcategoryEnc: true,
        categoryEnc: true,
      },
      take: limit,
      orderBy: { id: 'asc' },
    })

    const { decryptField } = await import('@/lib/encryption/fields')
    
    const getValue = (plain: any, enc: any, fieldName: string): any => {
      if (plain !== null && plain !== undefined && plain !== '') return plain
      if (enc) {
        try {
          const parsed = JSON.parse(enc)
          // Skip if empty ciphertext
          if (parsed.ct === '' || !parsed.ct) return null
        } catch {
          // Not JSON, try to decrypt
        }
        const decrypted = decryptField(enc, ['Transaction', fieldName])
        if (decrypted !== null && decrypted !== undefined && decrypted !== '') {
          return decrypted
        }
      }
      return null
    }

    for (const r of txs) {
      const data: any = {}
      
      // Get values from plaintext or decrypt from encrypted
      const description = getValue(r.description, (r as any).descriptionEnc, 'description')
      const merchantName = getValue(r.merchantName, (r as any).merchantNameEnc, 'merchantName')
      const accountOwner = getValue(r.accountOwner, (r as any).accountOwnerEnc, 'accountOwner')
      const address = getValue(r.address, (r as any).addressEnc, 'address')
      const city = getValue(r.city, (r as any).cityEnc, 'city')
      const region = getValue(r.region, (r as any).regionEnc, 'region')
      const postalCode = getValue(r.postalCode, (r as any).postalCodeEnc, 'postalCode')
      const country = getValue(r.country, (r as any).countryEnc, 'country')
      const storeNumber = getValue(r.storeNumber, (r as any).storeNumberEnc, 'storeNumber')
      const subcategory = getValue(r.subcategory, (r as any).subcategoryEnc, 'subcategory')
      const category = getValue(r.category, (r as any).categoryEnc, 'category')
      
      // Only encrypt if we have a value
      if (description !== null) data.descriptionEnc = encryptField(description, ['Transaction', 'description'])
      if (merchantName !== null) data.merchantNameEnc = encryptField(merchantName, ['Transaction', 'merchantName'])
      if (accountOwner !== null) data.accountOwnerEnc = encryptField(accountOwner, ['Transaction', 'accountOwner'])
      if (address !== null) data.addressEnc = encryptField(address, ['Transaction', 'address'])
      if (city !== null) data.cityEnc = encryptField(city, ['Transaction', 'city'])
      if (region !== null) data.regionEnc = encryptField(region, ['Transaction', 'region'])
      if (postalCode !== null) data.postalCodeEnc = encryptField(postalCode, ['Transaction', 'postalCode'])
      if (country !== null) data.countryEnc = encryptField(country, ['Transaction', 'country'])
      if (storeNumber !== null) data.storeNumberEnc = encryptField(storeNumber, ['Transaction', 'storeNumber'])
      if (subcategory !== null) data.subcategoryEnc = encryptField(subcategory, ['Transaction', 'subcategory'])
      if (category !== null) data.categoryEnc = encryptField(category, ['Transaction', 'category'])
      
      // Only update if we have at least one field to encrypt
      if (Object.keys(data).length > 0) {
        await prisma.transaction.update({ where: { id: r.id }, data })
        txUpdated++
      }
    }

    // Overwrite-encrypt Accounts for this user
    const accounts = await prisma.account.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        name: true,
        mask: true,
        subtype: true,
        servicerAddress: true,
        propertyAddress: true,
        repaymentPlan: true,
      },
      take: limit,
      orderBy: { id: 'asc' },
    })

    for (const r of accounts) {
      const data: any = {}
      data.nameEnc = encryptField(r.name, ['Account', 'name'])
      data.maskEnc = encryptField(r.mask, ['Account', 'mask'])
      data.subtypeEnc = encryptField(r.subtype, ['Account', 'subtype'])
      data.servicerAddressEnc = encryptField(r.servicerAddress, ['Account', 'servicerAddress'])
      data.propertyAddressEnc = encryptField(r.propertyAddress, ['Account', 'propertyAddress'])
      data.repaymentPlanEnc = encryptField(r.repaymentPlan, ['Account', 'repaymentPlan'])
      await prisma.account.update({ where: { id: r.id }, data })
      accUpdated++
    }

    return NextResponse.json({ ok: true, txUpdated, accUpdated })
  } catch (error) {
    console.error('Encryption backfill API error', error)
    return NextResponse.json({ error: 'Failed to backfill encryption' }, { status: 500 })
  }
}


