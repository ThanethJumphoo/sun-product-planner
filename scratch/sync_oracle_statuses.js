const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
const { OracleService } = require('../backend/dist/src/modules/oracle/oracle.service');
const { SystemSettingsService } = require('../backend/dist/src/modules/system-settings/system-settings.service');
const oracle = new OracleService(new SystemSettingsService());

async function syncStatuses() {
  await oracle.onModuleInit();
  const allHeaders = await prisma.erpSaleOrderHeader.findMany({
    select: { erpOrderNumber: true, erpOrderStatus: true }
  });
  console.log('Total headers in SQL Server:', allHeaders.length);

  const chunkSize = 900;
  let closedCount = 0;
  let cancelledCount = 0;
  let stillBookedCount = 0;

  for (let i = 0; i < allHeaders.length; i += chunkSize) {
    const chunk = allHeaders.slice(i, i + chunkSize);
    const numbers = chunk.map(c => c.erpOrderNumber).filter(n => /^\d+$/.test(n));
    if (numbers.length === 0) continue;
    const sql = `
      SELECT ODH.ORDER_NUMBER,
             CASE 
               WHEN ODH.CANCELLED_FLAG = 'Y' THEN 'CANCELLED'
               ELSE ODH.FLOW_STATUS_CODE
             END AS STATUS
      FROM OE_ORDER_HEADERS_ALL ODH
      WHERE ODH.ORDER_NUMBER IN (${numbers.join(',')})
    `;
    const rows = await oracle.executeQuery(sql);
    
    // Batch update SQL Server where status changed
    const toClose = [];
    const toCancel = [];

    for (const r of rows) {
      if (r.STATUS === 'CLOSED') {
        toClose.push(String(r.ORDER_NUMBER));
        closedCount++;
      } else if (r.STATUS === 'CANCELLED') {
        toCancel.push(String(r.ORDER_NUMBER));
        cancelledCount++;
      } else {
        stillBookedCount++;
      }
    }

    if (toClose.length > 0) {
      await prisma.erpSaleOrderHeader.updateMany({
        where: { erpOrderNumber: { in: toClose }, erpOrderStatus: { not: 'CLOSED' } },
        data: { erpOrderStatus: 'CLOSED', lastSyncedAt: new Date() }
      });
    }

    if (toCancel.length > 0) {
      await prisma.erpSaleOrderHeader.updateMany({
        where: { erpOrderNumber: { in: toCancel }, erpOrderStatus: { not: 'CANCELLED' } },
        data: { erpOrderStatus: 'CANCELLED', lastSyncedAt: new Date() }
      });
    }

    if (i % 3000 === 0) {
      console.log(`Processed ${i} of ${allHeaders.length}...`);
    }
  }

  console.log('=== Status Sync Finished ===');
  console.log('CLOSED:', closedCount);
  console.log('CANCELLED:', cancelledCount);
  console.log('STILL ACTIVE (BOOKED/ENTERED):', stillBookedCount);
}

syncStatuses().finally(() => prisma.$disconnect());
