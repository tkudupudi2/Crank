/*
  Backfill encrypted fields for PII/descriptive columns without deleting plaintext.
  Usage (after setting PLAIN_DEK and ENCRYPTION_ENABLED=true):
    ts-node scripts/backfill-encryption.ts
*/
import { prisma } from '@/lib/prisma'
import { encryptField } from '@/lib/encryption/fields'

const BATCH_SIZE = 500

async function backfillTransactions() {
  let lastId: string | null = null
  let updated = 0
  for (;;) {
    const rows = await prisma.transaction.findMany({
      where: lastId ? { id: { gt: lastId } } : {},
      orderBy: { id: 'asc' },
      take: BATCH_SIZE,
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
    })
    if (rows.length === 0) break
    for (const r of rows) {
      const data: any = {}
      if (r.description !== undefined) data.descriptionEnc = encryptField(r.description, ['Transaction', 'description'])
      if (r.merchantName !== undefined) data.merchantNameEnc = encryptField(r.merchantName, ['Transaction', 'merchantName'])
      if (r.accountOwner !== undefined) data.accountOwnerEnc = encryptField(r.accountOwner, ['Transaction', 'accountOwner'])
      if (r.address !== undefined) data.addressEnc = encryptField(r.address, ['Transaction', 'address'])
      if (r.city !== undefined) data.cityEnc = encryptField(r.city, ['Transaction', 'city'])
      if (r.region !== undefined) data.regionEnc = encryptField(r.region, ['Transaction', 'region'])
      if (r.postalCode !== undefined) data.postalCodeEnc = encryptField(r.postalCode, ['Transaction', 'postalCode'])
      if (r.country !== undefined) data.countryEnc = encryptField(r.country, ['Transaction', 'country'])
      if (r.storeNumber !== undefined) data.storeNumberEnc = encryptField(r.storeNumber, ['Transaction', 'storeNumber'])
      if (r.subcategory !== undefined) data.subcategoryEnc = encryptField(r.subcategory, ['Transaction', 'subcategory'])
      if (r.category !== undefined) data.categoryEnc = encryptField(r.category, ['Transaction', 'category'])
      if (Object.keys(data).length > 0) {
        await prisma.transaction.update({ where: { id: r.id }, data })
        updated++
      }
    }
    lastId = rows[rows.length - 1].id
    console.log(`Transactions backfill progress: ${updated} encrypted (lastId=${lastId})`)
  }
}

async function backfillAccounts() {
  let lastId: string | null = null
  let updated = 0
  for (;;) {
    const rows = await prisma.account.findMany({
      where: lastId ? { id: { gt: lastId } } : {},
      orderBy: { id: 'asc' },
      take: BATCH_SIZE,
      select: {
        id: true,
        name: true,
        mask: true,
        subtype: true,
        servicerAddress: true,
        propertyAddress: true,
        repaymentPlan: true,
        nameEnc: true,
        maskEnc: true,
        subtypeEnc: true,
        servicerAddressEnc: true,
        propertyAddressEnc: true,
        repaymentPlanEnc: true,
      },
    })
    if (rows.length === 0) break
    for (const r of rows) {
      const data: any = {}
      if (r.name !== undefined) data.nameEnc = encryptField(r.name, ['Account', 'name'])
      if (r.mask !== undefined) data.maskEnc = encryptField(r.mask, ['Account', 'mask'])
      if (r.subtype !== undefined) data.subtypeEnc = encryptField(r.subtype, ['Account', 'subtype'])
      if (r.servicerAddress !== undefined) data.servicerAddressEnc = encryptField(r.servicerAddress, ['Account', 'servicerAddress'])
      if (r.propertyAddress !== undefined) data.propertyAddressEnc = encryptField(r.propertyAddress, ['Account', 'propertyAddress'])
      if (r.repaymentPlan !== undefined) data.repaymentPlanEnc = encryptField(r.repaymentPlan, ['Account', 'repaymentPlan'])
      if (Object.keys(data).length > 0) {
        await prisma.account.update({ where: { id: r.id }, data })
        updated++
      }
    }
    lastId = rows[rows.length - 1].id
    console.log(`Accounts backfill progress: ${updated} encrypted (lastId=${lastId})`)
  }
}

async function main() {
  const enabled = process.env.ENCRYPTION_ENABLED === 'true'
  if (!enabled) {
    console.error('ENCRYPTION_ENABLED is not true; aborting backfill.')
    process.exit(1)
  }
  if (!process.env.PLAIN_DEK) {
    console.error('PLAIN_DEK not set; aborting backfill.')
    process.exit(1)
  }
  console.log('Starting encryption backfill...')
  await backfillTransactions()
  await backfillAccounts()
  console.log('Backfill completed.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


