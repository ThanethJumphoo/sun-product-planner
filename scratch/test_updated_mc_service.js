const { PrismaClient } = require('C:/Users/PCSLHICT-THANETH/Documents/github/sun-product-planner/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
const { calculateToridasCapacity } = require('C:/Users/PCSLHICT-THANETH/Documents/github/sun-product-planner/backend/dist/src/modules/mps/utils/toridasCapacity');

async function test() {
  const supplies = await prisma.mpsSupply.findMany({
    where: { partName: 'BIL', planDate: { gte: new Date('2026-10-01'), lte: new Date('2026-10-06') } }
  });
  console.log('Supplies:', supplies.map(s => ({ d: s.planDate.toISOString().split('T')[0], w: s.supplyWeight })));
}

test().then(() => prisma.$disconnect());

