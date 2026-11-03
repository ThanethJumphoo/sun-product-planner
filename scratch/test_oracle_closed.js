const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
const { OracleService } = require('../backend/dist/src/modules/oracle/oracle.service');
const { SystemSettingsService } = require('../backend/dist/src/modules/system-settings/system-settings.service');
const oracle = new OracleService(new SystemSettingsService());

async function test() {
  await oracle.onModuleInit();
  // Get sample 200 header numbers currently in our DB as BOOKED
  const booked = await prisma.erpSaleOrderHeader.findMany({
    where: { erpOrderStatus: 'BOOKED' },
    select: { erpOrderNumber: true },
    take: 200
  });
  const numbers = booked.map(b => b.erpOrderNumber);

  const sql = `
    SELECT ODH.ORDER_NUMBER, ODH.FLOW_STATUS_CODE, ODH.CANCELLED_FLAG
    FROM OE_ORDER_HEADERS_ALL ODH
    WHERE ODH.ORDER_NUMBER IN (${numbers.map(n => "'" + n + "'").join(',')})
  `;
  const oracleRows = await oracle.executeQuery(sql);
  const oracleStatuses = {};
  for (const r of oracleRows) {
    oracleStatuses[r.FLOW_STATUS_CODE] = (oracleStatuses[r.FLOW_STATUS_CODE] || 0) + 1;
  }
  console.log('Oracle Statuses for sample 200 headers in DB:', oracleStatuses);
}
test().finally(() => prisma.$disconnect());

