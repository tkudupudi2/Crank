import { PrismaClient } from '@prisma/client'
import { encryptField, decryptField } from './encryption/fields'
import { STAGING_ENC_CLEANUP, PLAINTEXT_WRITES_DISABLED } from './config'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Field maps for encryption (Step 1)
const TRANSACTION_ENC_MAP: Record<string, string> = {
  description: 'descriptionEnc',
  merchantName: 'merchantNameEnc',
  accountOwner: 'accountOwnerEnc',
  address: 'addressEnc',
  city: 'cityEnc',
  region: 'regionEnc',
  postalCode: 'postalCodeEnc',
  country: 'countryEnc',
  storeNumber: 'storeNumberEnc',
  subcategory: 'subcategoryEnc',
  // Store category array as JSON string in categoryEnc
  category: 'categoryEnc',
  // Step 2: numeric/date encrypted sources
  amount: 'amountEnc',
  date: 'dateEnc',
}

const ACCOUNT_ENC_MAP: Record<string, string> = {
  name: 'nameEnc',
  mask: 'maskEnc',
  subtype: 'subtypeEnc',
  servicerAddress: 'servicerAddressEnc',
  propertyAddress: 'propertyAddressEnc',
  repaymentPlan: 'repaymentPlanEnc',
  // Step 2: numeric/date encrypted sources
  currentBalance: 'currentBalanceEnc',
  availableBalance: 'availableBalanceEnc',
  creditLimit: 'creditLimitEnc',
  lastPaymentAmount: 'lastPaymentAmountEnc',
  lastPaymentDate: 'lastPaymentDateEnc',
}

const ENCRYPTION_ENABLED = process.env.ENCRYPTION_ENABLED === 'true'

if (ENCRYPTION_ENABLED) {
  console.log('[Encryption] Middleware enabled, PLAIN_DEK:', process.env.PLAIN_DEK ? 'present' : 'MISSING')
  prisma.$use(async (params, next) => {
    const model = params.model
    const action = params.action

    // For read operations, ensure encrypted columns are selected so we can decrypt
    // Also ensure derived fields (amountNum, dateUtc, etc.) are selected for fallback
    const isRead = ['findUnique', 'findFirst', 'findMany', 'findRaw', 'aggregate', 'groupBy'].includes(action)
    if (isRead && params.args && (model === 'Transaction' || model === 'Account')) {
      const encMap = model === 'Transaction' ? TRANSACTION_ENC_MAP : ACCOUNT_ENC_MAP
      if (params.args.select && typeof params.args.select === 'object') {
        for (const enc of Object.values(encMap)) {
          if (!(enc in params.args.select)) {
            params.args.select[enc] = true
          }
        }
        // Also add derived fields for fallback when decryption fails
        if (model === 'Transaction') {
          if (!('amountNum' in params.args.select)) params.args.select.amountNum = true
          if (!('dateUtc' in params.args.select)) params.args.select.dateUtc = true
        } else if (model === 'Account') {
          if (!('currentBalanceNum' in params.args.select)) params.args.select.currentBalanceNum = true
          if (!('availableBalanceNum' in params.args.select)) params.args.select.availableBalanceNum = true
          if (!('creditLimitNum' in params.args.select)) params.args.select.creditLimitNum = true
          if (!('lastPaymentAmountNum' in params.args.select)) params.args.select.lastPaymentAmountNum = true
          if (!('lastPaymentDateUtc' in params.args.select)) params.args.select.lastPaymentDateUtc = true
        }
        // Also ensure encrypted fields are selected for nested includes
        if (params.args.select.account && typeof params.args.select.account === 'object') {
          const accountEncMap = ACCOUNT_ENC_MAP
          for (const enc of Object.values(accountEncMap)) {
            if (!(enc in params.args.select.account)) {
              params.args.select.account[enc] = true
            }
          }
          // Add account derived fields
          if (!('currentBalanceNum' in params.args.select.account)) params.args.select.account.currentBalanceNum = true
          if (!('availableBalanceNum' in params.args.select.account)) params.args.select.account.availableBalanceNum = true
          if (!('creditLimitNum' in params.args.select.account)) params.args.select.account.creditLimitNum = true
          if (!('lastPaymentAmountNum' in params.args.select.account)) params.args.select.account.lastPaymentAmountNum = true
          if (!('lastPaymentDateUtc' in params.args.select.account)) params.args.select.account.lastPaymentDateUtc = true
        }
      }
      // When using include (not select), ensure encrypted fields are included for nested relations
      if (params.args.include && typeof params.args.include === 'object') {
        if (params.args.include.account === true || (typeof params.args.include.account === 'object' && !params.args.include.account.select)) {
          // Account will be included with all fields, so encrypted fields will be there
          // But if there's a nested select, we need to add encrypted fields
          if (typeof params.args.include.account === 'object' && params.args.include.account.select) {
            const accountEncMap = ACCOUNT_ENC_MAP
            for (const enc of Object.values(accountEncMap)) {
              if (!(enc in params.args.include.account.select)) {
                params.args.include.account.select[enc] = true
              }
            }
          }
        }
      }
      // if no select provided, Prisma returns all fields; nothing to change
    }

    // Helper function to encrypt transaction data
    const encryptTransactionData = (data: any, isCreate: boolean) => {
      // Store original values before encryption for derived fields
      const originalAmount = data.amount
      const originalDate = data.date
      
      for (const [plain, enc] of Object.entries(TRANSACTION_ENC_MAP)) {
        if (plain in data) {
          const value = data[plain]
          // Skip encryption if value is null/undefined/empty - don't create empty ciphertexts
          if (value === null || value === undefined || value === '') {
            // Keep plaintext as-is (null/empty), don't encrypt
            continue
          }
          const aad = ['Transaction', plain]
          const ciphertext = encryptField(plain === 'category' ? (value ?? []) : value, aad)
          if (ciphertext) {
            data[enc] = ciphertext
            // If PLAINTEXT_WRITES_DISABLED=true, set plaintext to null (encrypted-only mode)
            // Otherwise keep plaintext populated (dual-write for Plaid compatibility)
            if (PLAINTEXT_WRITES_DISABLED) {
              // Category is kept as plaintext array for queries (required field), don't null it
              if (plain !== 'category') {
                data[plain] = null
              }
            }
          } else {
            console.error(`[Encryption] Failed to encrypt Transaction.${plain}, value:`, value)
          }
        }
      }
      
      // Handle amount - populate encrypted, derived, and keep plaintext
      if ('amount' in data && originalAmount !== undefined && originalAmount !== null) {
        const aad = ['Transaction', 'amount']
        const ct = encryptField(originalAmount, aad)
        if (ct) {
          data.amountEnc = ct
        } else {
          console.error('[Encryption] Failed to encrypt Transaction.amount, value:', originalAmount)
        }
        data.amountNum = originalAmount // Derived field for querying
        // If PLAINTEXT_WRITES_DISABLED=true, set plaintext to null (encrypted-only mode)
        if (PLAINTEXT_WRITES_DISABLED) {
          data.amount = null
        }
      }
      
      // Handle date - populate encrypted, derived, and keep plaintext
      if ('date' in data && originalDate !== undefined && originalDate !== null) {
        const aad = ['Transaction', 'date']
        const dateValue = originalDate instanceof Date ? originalDate : new Date(originalDate)
        const ct = encryptField(dateValue.toISOString(), aad)
        if (ct) {
          data.dateEnc = ct
        } else {
          console.error('[Encryption] Failed to encrypt Transaction.date, value:', originalDate)
        }
        data.dateUtc = dateValue // Derived field for querying
        // If PLAINTEXT_WRITES_DISABLED=true, set plaintext to null (encrypted-only mode)
        if (PLAINTEXT_WRITES_DISABLED) {
          (data as any).date = null
        }
      }
    }

    // Encrypt on create/update/upsert
    if (action === 'upsert' && params.args) {
      // For upsert, encrypt both create and update paths separately
      if (params.args.create && model === 'Transaction') {
        encryptTransactionData(params.args.create, true)
      }
      if (params.args.update && model === 'Transaction') {
        encryptTransactionData(params.args.update, false)
      }
      // Handle Account upsert similarly if needed
      if (params.args.create && model === 'Account') {
        // Account encryption logic here if needed
      }
      if (params.args.update && model === 'Account') {
        // Account encryption logic here if needed
      }
    } else if ((action === 'create' || action === 'update') && params.args?.data) {
      if (model === 'Transaction') {
        encryptTransactionData(params.args.data, action === 'create')
      } else       if (model === 'Account') {
        const data = params.args.data
        // Store original numeric/date values BEFORE we null them out in the loop below
        const originalCurrentBalance = data.currentBalance
        const originalAvailableBalance = data.availableBalance
        const originalCreditLimit = data.creditLimit
        const originalLastPaymentAmount = data.lastPaymentAmount
        const originalLastPaymentDate = data.lastPaymentDate
        
        for (const [plain, enc] of Object.entries(ACCOUNT_ENC_MAP)) {
          if (plain in data) {
            const value = data[plain]
            // Skip encryption if value is null/undefined/empty - don't create empty ciphertexts
            if (value === null || value === undefined || value === '') {
              // Keep plaintext as-is (null/empty), don't encrypt
              continue
            }
            const aad = ['Account', plain]
            const ciphertext = encryptField(value, aad)
            if (ciphertext) {
              data[enc] = ciphertext
              // If PLAINTEXT_WRITES_DISABLED=true, set plaintext to null (encrypted-only mode)
              // Otherwise keep plaintext populated (dual-write for Plaid compatibility)
              if (PLAINTEXT_WRITES_DISABLED) {
                data[plain] = null
              }
            } else {
              console.error(`[Encryption] Failed to encrypt Account.${plain}, value:`, value)
            }
          }
        }
        // Step 2: write-only encryption/derived for numeric/date fields
        // Use original values (stored before nulling) to populate derived fields
        const writeNum = (
          field: string,
          encField: string,
          numField: string,
          originalValue: any
        ) => {
          if (originalValue !== null && originalValue !== undefined) {
            const aad = ['Account', field]
            const ct = encryptField(originalValue, aad)
            if (ct) (data as any)[encField] = ct
            ;(data as any)[numField] = originalValue
            // If PLAINTEXT_WRITES_DISABLED=true, set plaintext to null (encrypted-only mode)
            if (PLAINTEXT_WRITES_DISABLED && field in data) {
              (data as any)[field] = null
            }
          }
        }
        writeNum('currentBalance', 'currentBalanceEnc', 'currentBalanceNum', originalCurrentBalance)
        writeNum('availableBalance', 'availableBalanceEnc', 'availableBalanceNum', originalAvailableBalance)
        writeNum('creditLimit', 'creditLimitEnc', 'creditLimitNum', originalCreditLimit)
        writeNum('lastPaymentAmount', 'lastPaymentAmountEnc', 'lastPaymentAmountNum', originalLastPaymentAmount)
        if (originalLastPaymentDate !== null && originalLastPaymentDate !== undefined) {
          const aad = ['Account', 'lastPaymentDate']
          const dateValue = originalLastPaymentDate instanceof Date ? originalLastPaymentDate : new Date(originalLastPaymentDate)
          const ct = encryptField(dateValue.toISOString(), aad)
          if (ct) (data as any).lastPaymentDateEnc = ct
          ;(data as any).lastPaymentDateUtc = dateValue
          // If PLAINTEXT_WRITES_DISABLED=true, set plaintext to null (encrypted-only mode)
          if (PLAINTEXT_WRITES_DISABLED && 'lastPaymentDate' in data) {
            (data as any).lastPaymentDate = null
          }
        }
      }
    }

    const result = await next(params)

    // Decrypt on read (strict to encrypted fields, but don't blank if decryption fails)
    const decryptInPlace = (entity: any, modelName: 'Transaction' | 'Account') => {
      if (!entity || typeof entity !== 'object') return
      const map = modelName === 'Transaction' ? TRANSACTION_ENC_MAP : ACCOUNT_ENC_MAP
      for (const [plain, enc] of Object.entries(map)) {
        // Check if encrypted field exists (could be null, but key should exist)
        if (enc in entity) {
          try {
            const encValue = entity[enc]
            // Log first decryption attempt for debugging
            if (process.env.NODE_ENV === 'development' && modelName === 'Transaction' && plain === 'amount' && !entity._decLogged) {
              console.log(`[Encryption] Decrypting ${modelName}.${plain} for entity ${entity.id}:`, {
                hasEncValue: !!encValue,
                encValuePreview: encValue ? (typeof encValue === 'string' ? encValue.substring(0, 80) : String(encValue).substring(0, 80)) : 'null',
                currentPlainValue: entity[plain]
              })
              entity._decLogged = true
            }
            // Check if encrypted value has empty ciphertext (means it was encrypted with null/empty)
            let hasEmptyCiphertext = false
            if (encValue) {
              try {
                const parsed = JSON.parse(encValue)
                if (parsed.ct === '' || !parsed.ct) {
                  hasEmptyCiphertext = true
                }
              } catch {
                // Invalid JSON, will try to decrypt anyway
              }
            }
            
            const value = !hasEmptyCiphertext && encValue ? decryptField(encValue, [modelName, plain]) : null
            
            // For numeric/date fields, fallback to derived columns if decryption fails or returns empty
            if ((plain === 'amount' || plain === 'currentBalance' || plain === 'availableBalance' || 
                 plain === 'creditLimit' || plain === 'lastPaymentAmount')) {
              const numField = modelName === 'Transaction' && plain === 'amount' ? 'amountNum' :
                               modelName === 'Account' && plain === 'currentBalance' ? 'currentBalanceNum' :
                               modelName === 'Account' && plain === 'availableBalance' ? 'availableBalanceNum' :
                               modelName === 'Account' && plain === 'creditLimit' ? 'creditLimitNum' :
                               modelName === 'Account' && plain === 'lastPaymentAmount' ? 'lastPaymentAmountNum' : null
              
              if (value !== null && value !== undefined && value !== '') {
                entity[plain] = typeof value === 'number' ? value : parseFloat(String(value)) || null
              } else if (numField && entity[numField] !== null && entity[numField] !== undefined) {
                // Fallback to derived numeric field
                entity[plain] = entity[numField]
              }
            } else if (plain === 'date' || plain === 'lastPaymentDate') {
              if (value !== null && value !== undefined && value !== '') {
                // Convert date strings back to Date objects
                const dateObj = typeof value === 'string' ? new Date(value) : value
                if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
                  entity[plain] = dateObj
                } else {
                  // Fallback to dateUtc or lastPaymentDateUtc
                  const utcField = modelName === 'Transaction' ? 'dateUtc' : 'lastPaymentDateUtc'
                  if (entity[utcField]) {
                    entity[plain] = entity[utcField]
                  }
                }
              } else {
                // Fallback to UTC field if decryption failed
                const utcField = modelName === 'Transaction' ? 'dateUtc' : 'lastPaymentDateUtc'
                if (entity[utcField] && !entity[plain]) {
                  entity[plain] = entity[utcField]
                }
              }
            } else {
              // For other fields, only set if decryption succeeded
              if (value !== null && value !== undefined && value !== '') {
                entity[plain] = value
              }
            }
            if (process.env.NODE_ENV === 'development' && modelName === 'Account' && plain === 'name') {
              if (entity[enc] && !entity._decLogged) {
                console.log('[enc] decrypted account name for', entity.id)
                entity._decLogged = true
              }
            }
          } catch {
            // leave as-is on failure, but try UTC fallback for dates
            if ((plain === 'date' || plain === 'lastPaymentDate')) {
              const utcField = modelName === 'Transaction' ? 'dateUtc' : 'lastPaymentDateUtc'
              if (entity[utcField] && !entity[plain]) {
                entity[plain] = entity[utcField]
              }
            }
          }
        }
      }
    }

    const maybeDecrypt = (obj: any) => {
      if (!obj || typeof obj !== 'object') return obj
      if (params.model === 'Transaction') {
        decryptInPlace(obj, 'Transaction')
        // Decrypt nested includes (e.g., account on transaction)
        if (obj.account && typeof obj.account === 'object') {
          decryptInPlace(obj.account, 'Account')
        }
      } else if (params.model === 'Account') {
        decryptInPlace(obj, 'Account')
      }
      return obj
    }

    if (Array.isArray(result)) {
      return result.map(maybeDecrypt)
    }
    return maybeDecrypt(result)
  })
}
