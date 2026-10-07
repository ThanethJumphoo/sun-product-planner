const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const demands = await prisma.demandPlanLine.findMany({ take: 3 });
  console.log("Demands sample:", demands);
  
  for (const d of demands) {
    const soLine = await prisma.erpSaleOrderLine.findFirst({
      where: {
        header: { erpOrderNumber: d.soNumber },
        erpLineNumber: d.lineNumber,
        erpItemCode: d.itemCode
      },
      include: { header: true }
    });
    console.log(`Matched SO for ${d.soNumber}:`, soLine);
    
    if (!soLine) {
        // Try finding just by SO Number
        const anyLines = await prisma.erpSaleOrderLine.findMany({
            where: { header: { erpOrderNumber: d.soNumber } },
            include: { header: true },
            take: 2
        });
        console.log(`Any lines matching SO ${d.soNumber}:`, anyLines);
    }
  }
}

check().finally(() => prisma.$disconnect());
