const { PrismaClient } = require('C:/Users/PCSLHICT-THANETH/Documents/github/sun-product-planner/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
const { MachineCapacityService } = require('C:/Users/PCSLHICT-THANETH/Documents/github/sun-product-planner/backend/dist/src/modules/machine-capacity/machine-capacity.service');
const { ProductSpecService } = require('C:/Users/PCSLHICT-THANETH/Documents/github/sun-product-planner/backend/dist/src/modules/master-data/product-spec/product-spec.service');
const { MpsService } = require('C:/Users/PCSLHICT-THANETH/Documents/github/sun-product-planner/backend/dist/src/modules/mps/mps.service');

async function compare() {
  const specSvc = new ProductSpecService();
  const mcSvc = new MachineCapacityService(specSvc);
  const mpsSvc = new MpsService();

  console.log('================================================================');
  console.log('COMPARING MACHINE CAPACITY IN MPS vs MACHINE-CAPACITY');
  console.log('================================================================');

  // 1. Check Toridas (BIL)
  console.log('\n--- 1. TORIDAS (Part: BIL) ---');
  const toridasMps = await mpsSvc.getToridasMetrics('BIL', '2026-10');
  const mcBil = await mcSvc.getDailyPlan('2026-10', 'BIL');
  
  const trdMachine = mcBil.machines.find(m => m.machineType === 'TORIDAS');
  console.log('MachineMaster TRD-01:', {
    code: trdMachine.machineCode,
    name: trdMachine.machineName,
    speed: trdMachine.standardSpeedKgHr,
    hoursPerShift: trdMachine.workingHoursPerShift,
    shiftsCount: trdMachine.shiftsCount,
    machinesCount: trdMachine.machinesCount
  });

  const datesToTest = ['2026-10-01', '2026-10-02', '2026-10-05', '2026-10-06'];
  console.log('\nDate       | MPS Toridas Input | MPS Output BL | MPS Lines/Shifts | MPS % Cap | MC PlannedLoad | MC ReqHours | MC AvailHours | MC % Cap');
  console.log('----------------------------------------------------------------------------------------------------------------------------------');
  for (const d of datesToTest) {
    const mpsDay = toridasMps.daily[d];
    const mcDay = mcBil.matrix[trdMachine.id]?.[d];
    console.log(
      `${d} | ` +
      `${String(Math.round(mpsDay?.toridasInputKg || 0)).padStart(17)} | ` +
      `${String(Math.round(mpsDay?.bonelessOutputKg || 0)).padStart(13)} | ` +
      `${String((mpsDay?.linesNeeded || 0) + 'L / ' + (mpsDay?.shiftsNeeded || 0) + 'S').padStart(16)} | ` +
      `${String((mpsDay?.capacityUtilizationPct || 0).toFixed(1) + '%').padStart(9)} | ` +
      `${String(mcDay?.plannedLoadKg || 0).padStart(14)} | ` +
      `${String(mcDay?.requiredHours || 0).padStart(11)} | ` +
      `${String(mcDay?.availableHours || 0).padStart(13)} | ` +
      `${String((mcDay?.utilizationPct || 0).toFixed(1) + '%').padStart(8)}`
    );
  }

  // 2. Check I-Cut (BL)
  console.log('\n--- 2. I-CUT (Part: BL) ---');
  const icutMps = await mpsSvc.getICutMetrics('BL', '2026-10');
  const mcBl = await mcSvc.getDailyPlan('2026-10', 'BL');
  const icutMachine = mcBl.machines.find(m => m.machineType === 'ICUT');
  console.log('MachineMaster ICUT-01:', {
    code: icutMachine.machineCode,
    name: icutMachine.machineName,
    speed: icutMachine.standardSpeedKgHr,
    hoursPerShift: icutMachine.workingHoursPerShift,
    shiftsCount: icutMachine.shiftsCount,
    machinesCount: icutMachine.machinesCount
  });

  // 3. Check Settings & Formulas
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: { contains: 'toridas' }
    }
  });
  console.log('\nToridas System Settings in DB:', settings);

  const icutSettings = await prisma.systemSetting.findMany({
    where: {
      key: { contains: 'icut' }
    }
  });
  console.log('I-Cut System Settings in DB:', icutSettings);
}

compare().then(() => prisma.$disconnect());
