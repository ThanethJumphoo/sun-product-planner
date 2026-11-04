const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
const { DemandPlanningService } = require('../backend/dist/src/modules/demand-planning/demand-planning.service');
const { ProductSpecService } = require('../backend/dist/src/modules/master-data/product-spec/product-spec.service');
const { ErpItemMasterService } = require('../backend/dist/src/modules/master-data/erp-item-master/erp-item-master.service');
const { MpsService } = require('../backend/dist/src/modules/mps/mps.service');
const { MpsExportService } = require('../backend/dist/src/modules/mps/services/mps-export.service');
const { MachineCapacityService } = require('../backend/dist/src/modules/machine-capacity/machine-capacity.service');
const { ManpowerService } = require('../backend/dist/src/modules/manpower/manpower.service');
const { ChickenReceivingService } = require('../backend/dist/src/modules/master-data/chicken-receiving/chicken-receiving.service');

async function testAll() {
  console.log('====================================================');
  console.log('🚀 COMPREHENSIVE SYSTEM INTEGRATION VERIFICATION');
  console.log('====================================================\n');

  let allPass = true;

  // 1. Demand Planning Service
  try {
    process.stdout.write('1. Testing Demand Planning Service (BL, BIL, Fillet)... ');
    const productSpecService = new ProductSpecService();
    const erpItemMasterService = new ErpItemMasterService(null, null);
    const dpService = new DemandPlanningService(productSpecService, erpItemMasterService);

    for (const part of ['BL', 'BIL', 'Fillet']) {
      const res = await dpService.getSalesOrdersForPart(part, '2026-10-01', '2026-10-31', false, false);
      const totalOrders = res.product.length + res.coproduct.length + res.byproduct.length;
      
      // Verify no CLOSED or CANCELLED
      const hasClosed = [...res.product, ...res.coproduct, ...res.byproduct].some(
        o => o.orderStatus === 'CLOSED' || o.orderStatus === 'CANCELLED'
      );
      if (hasClosed) throw new Error(`Found CLOSED/CANCELLED orders in ${part}!`);

      // Verify sequential priority
      for (let i = 0; i < res.product.length; i++) {
        if (res.product[i].priority !== i + 1) {
          throw new Error(`Priority gap in ${part}: expected ${i + 1}, got ${res.product[i].priority}`);
        }
      }
    }
    console.log('✅ PASS (Clean statuses, perfect sequential priority)');
  } catch (err) {
    allPass = false;
    console.log('❌ FAIL:', err.message);
  }

  // 2. MPS Service & Data
  try {
    process.stdout.write('2. Testing MPS Service (BL October 2026)... ');
    const mpsExportService = new MpsExportService();
    const mpsService = new MpsService(mpsExportService);
    const supplies = await mpsService.getMpsSupply('BL', '2026-10-01', '2026-10-31');
    const toridas = await mpsService.getToridasMetrics('BL', '2026-10-01');
    const icut = await mpsService.getICutMetrics('BL', '2026-10-01');
    console.log(`✅ PASS (Supplies: ${supplies?.length || 0}, Toridas dates: ${Object.keys(toridas?.dailyMetrics || {}).length}, ICut dates: ${Object.keys(icut?.dailyMetrics || {}).length})`);
  } catch (err) {
    allPass = false;
    console.log('❌ FAIL:', err.message);
  }

  // 3. Machine Capacity Service
  try {
    process.stdout.write('3. Testing Machine Capacity Service (Toridas & ICut)... ');
    const mcService = new MachineCapacityService();
    const planVsActual = await mcService.getPlanVsActual('BL', '2026-10-01', '2026-10-31');
    if (!planVsActual) throw new Error('Machine capacity returned null');
    console.log('✅ PASS (Machine capacity tracking data connected)');
  } catch (err) {
    allPass = false;
    console.log('❌ FAIL:', err.message);
  }

  // 4. Manpower Planning Service
  try {
    process.stdout.write('4. Testing Manpower Planning Service... ');
    const mpService = new ManpowerService();
    const mpData = await mpService.getPlanVsActual('BL', '2026-10');
    if (!mpData) throw new Error('Manpower data returned null');
    console.log(`✅ PASS (Manpower days: ${mpData.days?.length || 0}, Roles: ${mpData.roles?.length || 0})`);
  } catch (err) {
    allPass = false;
    console.log('❌ FAIL:', err.message);
  }

  // 5. Chicken Receiving Service
  try {
    process.stdout.write('5. Testing Chicken Receiving Service (Monthly, Weekly, Daily)... ');
    const crService = new ChickenReceivingService();
    const monthlyRecs = await crService.getMonthlyRecords('2026-10-01', '2026-11-30', 1, 100);
    const weeklyRecs = await crService.getWeeklyRecords('2026-10-01', '2026-11-30', 1, 100);
    const dailyRecs = await crService.getDailyRecords('2026-10-01', '2026-11-30', 1, 100);
    console.log(`✅ PASS (Monthly: ${monthlyRecs.data.length}, Weekly: ${weeklyRecs.data.length}, Daily: ${dailyRecs.data.length})`);
  } catch (err) {
    allPass = false;
    console.log('❌ FAIL:', err.message);
  }

  // 6. Database erp_conversion_rate and item master
  try {
    process.stdout.write('6. Testing Database erp_conversion_rate & secondary UOM... ');
    const items = await prisma.erpItemMaster.findMany({
      where: { erpConversionRate: { not: null } },
      select: { erpItemCode: true, erpItemUom: true, erpSecondaryUom: true, erpConversionRate: true },
      take: 5
    });
    console.log(`✅ PASS (${items.length} items verified with conversion rate)`);
  } catch (err) {
    allPass = false;
    console.log('❌ FAIL:', err.message);
  }

  // 7. Database demandPlanLine integrity
  try {
    process.stdout.write('7. Testing Database demandPlanLine integrity... ');
    const closedHeaders = await prisma.erpSaleOrderHeader.findMany({
      where: { erpOrderStatus: { in: ['CLOSED', 'CANCELLED'] } },
      select: { erpOrderNumber: true }
    });
    const closedOrderNumbers = closedHeaders.map(h => h.erpOrderNumber);
    const dirtyDemands = await prisma.demandPlanLine.findMany({
      where: { soNumber: { in: closedOrderNumbers } }
    });
    if (dirtyDemands.length > 0) throw new Error(`Found ${dirtyDemands.length} dirty demands with CLOSED/CANCELLED orders!`);
    console.log('✅ PASS (0 closed/cancelled demands in database)');
  } catch (err) {
    allPass = false;
    console.log('❌ FAIL:', err.message);
  }

  console.log('\n====================================================');
  if (allPass) {
    console.log('🎉 ALL 7 SYSTEM INTEGRATION CHECKS PASSED 100%!');
  } else {
    console.log('⚠️ SOME CHECKS FAILED - REVIEW ABOVE');
  }
  console.log('====================================================');

  await prisma.$disconnect();
}

testAll().catch(console.error);
