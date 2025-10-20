const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkLocationData() {
  try {
    console.log('Checking location data in transactions...')
    
    const transactions = await prisma.transaction.findMany({
      take: 5,
      select: {
        id: true,
        description: true,
        merchantName: true,
        address: true,
        city: true,
        region: true,
        postalCode: true,
        country: true,
        storeNumber: true,
        isManual: true
      }
    })

    console.log(`Found ${transactions.length} transactions:`)
    transactions.forEach((tx, index) => {
      console.log(`\nTransaction ${index + 1}:`)
      console.log(`  Description: ${tx.description}`)
      console.log(`  Merchant: ${tx.merchantName}`)
      console.log(`  Is Manual: ${tx.isManual}`)
      console.log(`  Location Data:`)
      console.log(`    Address: ${tx.address}`)
      console.log(`    City: ${tx.city}`)
      console.log(`    Region: ${tx.region}`)
      console.log(`    Postal Code: ${tx.postalCode}`)
      console.log(`    Country: ${tx.country}`)
      console.log(`    Store Number: ${tx.storeNumber}`)
    })

    // Check if any transactions have location data
    const withLocation = transactions.filter(tx => 
      tx.address || tx.city || tx.region || tx.postalCode || tx.country || tx.storeNumber
    )
    
    console.log(`\nTransactions with location data: ${withLocation.length}/${transactions.length}`)

  } catch (error) {
    console.error('Error checking location data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkLocationData()
