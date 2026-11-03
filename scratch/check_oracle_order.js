const { OracleService } = require('../backend/dist/src/modules/oracle/oracle.service');
const { SystemSettingsService } = require('../backend/dist/src/modules/system-settings/system-settings.service');
const oracle = new OracleService(new SystemSettingsService());

async function checkOracle() {
  await oracle.onModuleInit();
  const sql = `
    SELECT ORDER_NUMBER, FLOW_STATUS_CODE, CANCELLED_FLAG, ORDERED_DATE
    FROM OE_ORDER_HEADERS_ALL
    WHERE ORDER_NUMBER IN ('1111012600004', '1111022600002')
  `;
  const result = await oracle.executeQuery(sql);
  console.log('Oracle result:', result);
  await oracle.onModuleDestroy();
}
checkOracle().catch(console.error);
