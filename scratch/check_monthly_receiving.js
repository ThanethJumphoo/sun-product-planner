const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const recs = await prisma.monthlyChickenReceiving.findMany({
    where: {
      receiveDate: {
        gte: new Date('2026-10-25T00:00:00.000Z'),
        lte: new Date('2026-12-05T23:59:59.999Z')
      }
    },
    orderBy: { receiveDate: 'asc' }
  });
  console.log('Count:', recs.length);
  recs.forEach(r => {
    console.log(r.receiveDate.toISOString(), 'Raw date:', r.receiveDate, 'Chickens:', r.numberOfChickens, 'Weight:', r.totalWeight);
  });
  await prisma.$disconnect();
}
check().catch(console.error);

