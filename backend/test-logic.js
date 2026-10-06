const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function t() {
  const lines = await prisma.demandPlanLine.findMany();
  console.log(lines.length);
  const so = await prisma.erpSaleOrder.findMany({take:5});
  console.log(so.map(s => s.targetDate));
}
t().catch(console.error).finally(()=>prisma.$disconnect());
