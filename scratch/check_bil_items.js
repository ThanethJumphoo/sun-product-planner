const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== CHECKING OTHER ITEMS IN BIL PRODUCT SPECS ===');

  const specs = await prisma.productSpec.findMany();
  const bilItems = await prisma.erpItemMaster.findMany({
    where: {
      erpItemDesc: { contains: 'น่อง' }
    }
  });

  console.log('Items with น่อง:');
  for (const item of bilItems.slice(0, 15)) {
    const sp = specs.find(s => s.erpItemCode === item.erpItemCode);
    console.log(`- Code: ${item.erpItemCode} | Desc: ${item.erpItemDesc} | rmSizes: ${sp?.rmSizesJson} | Category: ${sp?.itemCategory}`);
  }

  // Check if any other item uses rmSize "21"
  const itemsUsing21 = specs.filter(s => s.rmSizesJson && s.rmSizesJson.includes('21'));
  console.log('\nItems using RM size 21:');
  for (const sp of itemsUsing21) {
    const it = bilItems.find(i => i.erpItemCode === sp.erpItemCode) || await prisma.erpItemMaster.findFirst({ where: { erpItemCode: sp.erpItemCode } });
    console.log(`- Code: ${sp.erpItemCode} | Desc: ${it?.erpItemDesc} | rmSizesJson: ${sp.rmSizesJson}`);
  }

  // Check if any item uses rmSize "20"
  const itemsUsing20 = specs.filter(s => s.rmSizesJson && s.rmSizesJson.includes('20'));
  console.log('\nItems using RM size 20:');
  for (const sp of itemsUsing20) {
    const it = await prisma.erpItemMaster.findFirst({ where: { erpItemCode: sp.erpItemCode } });
    console.log(`- Code: ${sp.erpItemCode} | Desc: ${it?.erpItemDesc} | rmSizesJson: ${sp.rmSizesJson}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

