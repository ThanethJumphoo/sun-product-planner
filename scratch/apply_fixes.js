const fs = require('fs');
const path = require('path');

// 1. Update demand-planning.controller.ts
{
  const filePath = path.join(__dirname, '../backend/src/modules/demand-planning/demand-planning.controller.ts');
  let content = fs.readFileSync(filePath, 'utf8');

  const oldCode = `@Get(':partName/sales-orders')
  async getSalesOrdersForPart(
    @Param('partName') partName: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('onlySelected') onlySelected?: string,
  ) {
    return this.service.getSalesOrdersForPart(partName, startDate, endDate, onlySelected === 'true');
  }`;

  const newCode = `@Get(':partName/sales-orders')
  async getSalesOrdersForPart(
    @Param('partName') partName: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('onlySelected') onlySelected?: string,
    @Query('includeClosed') includeClosed?: string,
  ) {
    return this.service.getSalesOrdersForPart(
      partName,
      startDate,
      endDate,
      onlySelected === 'true',
      includeClosed === 'true',
    );
  }`;

  // Normalize line endings for replacement
  const normalizedContent = content.replace(/\r\n/g, '\n');
  const normalizedOld = oldCode.replace(/\r\n/g, '\n');
  const normalizedNew = newCode.replace(/\r\n/g, '\n');

  if (normalizedContent.includes(normalizedOld)) {
    content = normalizedContent.replace(normalizedOld, normalizedNew);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Updated demand-planning.controller.ts');
  } else {
    console.warn('⚠️ Could not find target in demand-planning.controller.ts');
  }
}

// 2. Update demand-planning.service.ts
{
  const filePath = path.join(__dirname, '../backend/src/modules/demand-planning/demand-planning.service.ts');
  let content = fs.readFileSync(filePath, 'utf8');

  // Add includeClosed parameter
  const oldSig = `async getSalesOrdersForPart(
    partName: string,
    startDate?: string,
    endDate?: string,
    onlySelected?: boolean,
  ) {`;

  const newSig = `async getSalesOrdersForPart(
    partName: string,
    startDate?: string,
    endDate?: string,
    onlySelected?: boolean,
    includeClosed?: boolean,
  ) {`;

  // Add soLineWhere filter for erpOrderStatus
  const oldWhere = `    // 2. Fetch SO Lines for these items (filter by shipDate range if provided)
    const soLineWhere: any = {
      erpItemCode: { in: itemCodes },
    };`;

  const newWhere = `    // 2. Fetch SO Lines for these items (filter by shipDate range if provided)
    const soLineWhere: any = {
      erpItemCode: { in: itemCodes },
    };

    if (!includeClosed) {
      soLineWhere.header = {
        erpOrderStatus: {
          notIn: ['CLOSED', 'CANCELLED'],
        },
      };
    }`;

  let norm = content.replace(/\r\n/g, '\n');
  const normOldSig = oldSig.replace(/\r\n/g, '\n');
  const normNewSig = newSig.replace(/\r\n/g, '\n');
  const normOldWhere = oldWhere.replace(/\r\n/g, '\n');
  const normNewWhere = newWhere.replace(/\r\n/g, '\n');

  if (norm.includes(normOldSig) && norm.includes(normOldWhere)) {
    norm = norm.replace(normOldSig, normNewSig);
    norm = norm.replace(normOldWhere, normNewWhere);
    fs.writeFileSync(filePath, norm, 'utf8');
    console.log('✅ Updated demand-planning.service.ts');
  } else {
    console.warn('⚠️ Could not find targets in demand-planning.service.ts');
  }
}

// 3. Update autoGeneratePlan.ts
{
  const filePath = path.join(__dirname, '../backend/src/modules/mps/utils/autoGeneratePlan.ts');
  let content = fs.readFileSync(filePath, 'utf8');

  let norm = content.replace(/\r\n/g, '\n');

  // Add inactiveHeaders to Promise.all
  const oldPromiseAll = `    // item masters with conversion rate from MTL_UOM_CLASS_CONVERSIONS
    prisma.erpItemMaster.findMany({
      select: { erpItemCode: true, erpConversionRate: true },
    }),
  ]);`;

  const newPromiseAll = `    // item masters with conversion rate from MTL_UOM_CLASS_CONVERSIONS
    prisma.erpItemMaster.findMany({
      select: { erpItemCode: true, erpConversionRate: true },
    }),
    // Inactive orders (CLOSED / CANCELLED) to exclude from plan
    prisma.erpSaleOrderHeader.findMany({
      where: {
        erpOrderStatus: { in: ['CLOSED', 'CANCELLED'] },
      },
      select: { erpOrderNumber: true },
    }),
  ]);`;

  const oldDestructure = `    flowBoards,
    externalSupplies,
    dateLocks,
    itemMasters,
  ] = await Promise.all([`;

  const newDestructure = `    flowBoards,
    externalSupplies,
    dateLocks,
    itemMasters,
    inactiveHeaders,
  ] = await Promise.all([`;

  const oldFilterSection = `  const soNumbers = Array.from(
    new Set(plannedDemandsDb.map((d: any) => d.soNumber)),
  ).filter((s) => s && s.trim());
  const itemCodes = Array.from(
    new Set(plannedDemandsDb.map((d: any) => d.itemCode)),
  ).filter((i) => i && i.trim());`;

  const newFilterSection = `  const inactiveOrderNumbers = new Set(
    inactiveHeaders.map((h: any) => h.erpOrderNumber),
  );
  const activePlannedDemandsDb = plannedDemandsDb.filter(
    (d: any) => !inactiveOrderNumbers.has(d.soNumber),
  );

  const soNumbers = Array.from(
    new Set(activePlannedDemandsDb.map((d: any) => d.soNumber)),
  ).filter((s) => s && s.trim());
  const itemCodes = Array.from(
    new Set(activePlannedDemandsDb.map((d: any) => d.itemCode)),
  ).filter((i) => i && i.trim());`;

  const oldPlannedDemands = `  const plannedDemands = plannedDemandsDb.map((d: any) => ({`;
  const newPlannedDemands = `  const plannedDemands = activePlannedDemandsDb.map((d: any) => ({`;

  if (
    norm.includes(oldDestructure.replace(/\r\n/g, '\n')) &&
    norm.includes(oldPromiseAll.replace(/\r\n/g, '\n')) &&
    norm.includes(oldFilterSection.replace(/\r\n/g, '\n')) &&
    norm.includes(oldPlannedDemands.replace(/\r\n/g, '\n'))
  ) {
    norm = norm.replace(oldDestructure.replace(/\r\n/g, '\n'), newDestructure.replace(/\r\n/g, '\n'));
    norm = norm.replace(oldPromiseAll.replace(/\r\n/g, '\n'), newPromiseAll.replace(/\r\n/g, '\n'));
    norm = norm.replace(oldFilterSection.replace(/\r\n/g, '\n'), newFilterSection.replace(/\r\n/g, '\n'));
    norm = norm.replace(oldPlannedDemands.replace(/\r\n/g, '\n'), newPlannedDemands.replace(/\r\n/g, '\n'));
    fs.writeFileSync(filePath, norm, 'utf8');
    console.log('✅ Updated autoGeneratePlan.ts');
  } else {
    console.warn('⚠️ Could not find targets in autoGeneratePlan.ts');
  }
}

// 4. Update erp-sale-order.service.ts missingSql CASE status
{
  const filePath = path.join(__dirname, '../backend/src/modules/master-data/erp-sale-order/erp-sale-order.service.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  let norm = content.replace(/\r\n/g, '\n');

  const oldMissing = `                 ODH.CREATION_DATE     AS ERP_CREATION_DATE,
                 ODH.LAST_UPDATE_DATE  AS ERP_LAST_UPDATE_DATE,
                 ODH.FLOW_STATUS_CODE  AS ERP_ORDER_STATUS
          FROM   OE_ORDER_HEADERS_ALL ODH`;

  const newMissing = `                 ODH.CREATION_DATE     AS ERP_CREATION_DATE,
                 ODH.LAST_UPDATE_DATE  AS ERP_LAST_UPDATE_DATE,
                 CASE 
                   WHEN ODH.CANCELLED_FLAG = 'Y' THEN 'CANCELLED'
                   ELSE ODH.FLOW_STATUS_CODE
                 END                   AS ERP_ORDER_STATUS
          FROM   OE_ORDER_HEADERS_ALL ODH`;

  if (norm.includes(oldMissing.replace(/\r\n/g, '\n'))) {
    norm = norm.replace(oldMissing.replace(/\r\n/g, '\n'), newMissing.replace(/\r\n/g, '\n'));
    fs.writeFileSync(filePath, norm, 'utf8');
    console.log('✅ Updated erp-sale-order.service.ts missingSql');
  } else {
    console.warn('⚠️ Could not find oldMissing in erp-sale-order.service.ts');
  }
}

