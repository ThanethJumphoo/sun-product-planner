import { Injectable, forwardRef, Inject } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from 'date-fns';
import prisma from '../../../lib/prisma';
import { ManpowerService } from '../../manpower/manpower.service';
import { MpsService } from '../mps.service';

@Injectable()
export class MpsExportService {
  constructor(
    private readonly manpowerService: ManpowerService,
    @Inject(forwardRef(() => MpsService))
    private readonly mpsService: MpsService,
  ) {}

  /**
   * Generates a comprehensive MPS Production Schedule Excel file matching the factory standard:
   * Block 1: Supply Control (Date, Day, Avg Wt, RM Total, RM Used, RM Balance)
   * Block 2: Manpower & Execution (Cut P, Sup P, Cut A, Sup A, Variance)
   * Block 3: Machine Execution (Dynamic: Toridas TRD-01 for BIL, I-Cut ICUT-01 for BL, etc.)
   * Block 4: RM [Part] by Size (Dynamic based on PartRmSize and ChickenWeightDistribution)
   * Block 5: Production Plan (Dynamic 2-level header with FG Description and Item Code, green highlights)
   */
  async generateProductionScheduleExcel(
    partName: string,
    monthStr: string,
  ): Promise<Buffer> {
    const targetDate = monthStr ? new Date(`${monthStr}-01`) : new Date();
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);
    const currentMonthStr = format(monthStart, 'yyyy-MM');

    // 1. Fetch days in the month
    const daysInterval = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const dayDateStrings = daysInterval.map((d) => format(d, 'yyyy-MM-dd'));

    // 2. Fetch MPS Supply for this part
    const supplies = await prisma.mpsSupply.findMany({
      where: {
        partName,
        planDate: { gte: monthStart, lte: monthEnd },
      },
    });
    const supplyMap = new Map<string, number>();
    supplies.forEach((s) => {
      supplyMap.set(format(new Date(s.planDate), 'yyyy-MM-dd'), Number(s.supplyWeight));
    });

    // 3. Fetch Chicken Receiving for daily average weight
    const [monthlyRecs, weeklyRecs] = await Promise.all([
      prisma.monthlyChickenReceiving.findMany({
        where: { receiveDate: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.weeklyChickenReceiving.findMany({
        where: { receiveDate: { gte: monthStart, lte: monthEnd } },
      }),
    ]);

    const avgWeightMap = new Map<string, number>();
    dayDateStrings.forEach((dStr) => {
      const wForDay = weeklyRecs.filter(
        (w) => format(new Date(w.receiveDate), 'yyyy-MM-dd') === dStr,
      );
      const mForDay = monthlyRecs.find(
        (m) => format(new Date(m.receiveDate), 'yyyy-MM-dd') === dStr,
      );

      let avgWt = 0;
      if (wForDay.length > 0) {
        const totalCount = wForDay.reduce((s, w) => s + Number(w.totalCount || 0), 0);
        const totalWeight = wForDay.reduce((s, w) => s + Number(w.totalWeight || 0), 0);
        if (totalCount > 0) {
          avgWt = Number((totalWeight / totalCount).toFixed(2));
        }
      } else if (mForDay) {
        avgWt = Number(Number(mForDay.averageWeight || 0).toFixed(2));
      }
      avgWeightMap.set(dStr, avgWt);
    });

    // 4. Fetch Manpower plan vs actual
    const manpowerDailyMap = new Map<
      string,
      { cutP: number; supP: number; cutA: number; supA: number; variance: number }
    >();

    try {
      const planData = await this.manpowerService.getDailyPlan(
        partName,
        currentMonthStr,
      );
      const actualRecords = await this.manpowerService.getActualRecords(
        partName,
        undefined,
        currentMonthStr,
        'ALL',
      );

      const roles = planData.roles || [];
      const matrix = planData.matrix || {};

      // Map actuals by date and roleId
      const actualByDateRole = new Map<string, number>();
      actualRecords.forEach((act) => {
        const dStr = format(new Date(act.date), 'yyyy-MM-dd');
        const key = `${dStr}_${act.roleId}`;
        const prev = actualByDateRole.get(key) || 0;
        actualByDateRole.set(key, prev + Number(act.presentWorkers || 0));
      });

      dayDateStrings.forEach((dStr) => {
        let cutP = 0;
        let supP = 0;
        let cutA = 0;
        let supA = 0;

        roles.forEach((r: any) => {
          const roleCell = matrix[r.id]?.[dStr];
          const planned = roleCell?.effectiveWorkers || roleCell?.calculatedWorkers || 0;
          const actual = actualByDateRole.get(`${dStr}_${r.id}`) || 0;

          if (r.calculationType === 'VARIABLE') {
            cutP += planned;
            cutA += actual;
          } else {
            supP += planned;
            supA += actual;
          }
        });

        const totalPlanned = cutP + supP;
        const totalActual = cutA + supA;
        const variance = totalActual > 0 || totalPlanned > 0 ? totalActual - totalPlanned : 0;

        manpowerDailyMap.set(dStr, {
          cutP,
          supP,
          cutA,
          supA,
          variance,
        });
      });
    } catch (err) {
      console.warn('Manpower data not available for export:', err);
    }

    // 5. Fetch MACHINE EXECUTION DATA (Dedicated for BIL Toridas, BL I-Cut, or any registered machine)
    const partUpper = partName.toUpperCase();
    let machineBlockTitle = '';
    let machineColumns: { key: string; label: string; width: number; numFmt: string; isAvgSummary?: boolean }[] = [];
    const dailyMachineDataMap = new Map<string, Record<string, number>>();

    if (partUpper === 'BIL') {
      machineBlockTitle = 'Machine Execution (Toridas TRD-01)';
      machineColumns = [
        { key: 'inputKg', label: 'TRD Input (Kg)', width: 14, numFmt: '#,##0' },
        { key: 'outputKg', label: 'TRD Output BL (Kg)', width: 15, numFmt: '#,##0' },
        { key: 'lines', label: 'TRD Lines', width: 9, numFmt: '#,##0', isAvgSummary: true },
        { key: 'shifts', label: 'TRD Shifts', width: 9, numFmt: '#,##0', isAvgSummary: true },
        { key: 'utilPct', label: 'TRD % Cap', width: 10, numFmt: '0.0%', isAvgSummary: true },
        { key: 'overflowKg', label: 'TRD Overflow (Kg)', width: 15, numFmt: '#,##0' },
      ];

      try {
        const toridasRes = await this.mpsService.getToridasMetrics('BIL', currentMonthStr);
        const dailyToridas = toridasRes?.daily || {};
        dayDateStrings.forEach((dStr) => {
          const m = dailyToridas[dStr];
          dailyMachineDataMap.set(dStr, {
            inputKg: Math.round(m?.toridasInputKg || 0),
            outputKg: Math.round(m?.bonelessOutputKg || 0),
            lines: m?.linesNeeded || 0,
            shifts: m?.shiftsNeeded || 0,
            utilPct: m ? (m.capacityUtilizationPct || 0) / 100 : 0,
            overflowKg: Math.round(m?.overflowBoneInKg || 0),
          });
        });
      } catch (err) {
        console.warn('Failed to load Toridas metrics for export:', err);
      }
    } else if (partUpper === 'BL') {
      machineBlockTitle = 'Machine Execution (I-Cut ICUT-01)';
      machineColumns = [
        { key: 'inputRmKg', label: 'I-Cut Input RM (Kg)', width: 15, numFmt: '#,##0' },
        { key: 'outputBlkKg', label: 'I-Cut Output BLK (Kg)', width: 15, numFmt: '#,##0' },
        { key: 'coproductBlbKg', label: 'Co-Product BLB (Kg)', width: 15, numFmt: '#,##0' },
        { key: 'hours', label: 'I-Cut Hours', width: 11, numFmt: '0.0' },
        { key: 'shifts', label: 'I-Cut Shifts', width: 9, numFmt: '#,##0', isAvgSummary: true },
        { key: 'utilPct', label: 'I-Cut % Cap', width: 10, numFmt: '0.0%', isAvgSummary: true },
      ];

      try {
        const icutRes = await this.mpsService.getICutMetrics('BL', currentMonthStr);
        const dailyIcut = icutRes?.daily || {};
        dayDateStrings.forEach((dStr) => {
          const m = dailyIcut[dStr];
          dailyMachineDataMap.set(dStr, {
            inputRmKg: Math.round(m?.totalRmRequiredKg || 0),
            outputBlkKg: Math.round(m?.totalPlannedKg || 0),
            coproductBlbKg: Math.round(m?.coProductBlbKg || 0),
            hours: Number((m?.totalHoursNeeded || 0).toFixed(1)),
            shifts: m?.shiftsNeeded || 0,
            utilPct: m ? (m.capacityUtilizationPct || 0) / 100 : 0,
          });
        });
      } catch (err) {
        console.warn('Failed to load I-Cut metrics for export:', err);
      }
    }

    // 6. Fetch RM Sizes & Weight distribution for dynamic RM by Size block
    const rmSizes = await prisma.partRmSize.findMany({
      where: { partName },
      orderBy: { minSize: 'asc' },
    });

    const [weightDists, chickenWeightRanges] = await Promise.all([
      prisma.partWeightDistribution.findMany({ where: { partName } }),
      prisma.chickenWeight.findMany({ orderBy: { minWeight: 'asc' } }),
    ]);

    // Build size column labels
    const sizeColumns = rmSizes.map((rm) => {
      let label = '';
      if (rm.minSize == null && rm.maxSize != null) {
        label = `${rm.maxSize} Down`;
      } else if (rm.minSize != null && rm.maxSize == null) {
        label = `${rm.minSize} Up`;
      } else {
        label = `${rm.minSize}-${rm.maxSize}`;
      }
      return {
        id: rm.id,
        label,
      };
    });

    // Helper: calculate size distribution kg for a given date
    const dailyRmSizeKgMap = new Map<string, Map<number, number>>();
    dayDateStrings.forEach((dStr) => {
      const daySupply = supplyMap.get(dStr) || 0;
      const avgWt = avgWeightMap.get(dStr) || 2.8;
      const sizeKgMap = new Map<number, number>();

      if (daySupply > 0 && chickenWeightRanges.length > 0) {
        let matchedCw = chickenWeightRanges.find((cw) => {
          const minOk = cw.minWeight == null || avgWt >= Number(cw.minWeight);
          const maxOk = cw.maxWeight == null || avgWt <= Number(cw.maxWeight);
          return minOk && maxOk;
        });
        if (!matchedCw && chickenWeightRanges.length > 0) {
          matchedCw = chickenWeightRanges[0];
        }

        if (matchedCw) {
          sizeColumns.forEach((col) => {
            const dist = weightDists.find(
              (d) => d.chickenWeightId === matchedCw!.id && d.partRmSizeId === col.id,
            );
            const percent = dist ? Number(dist.percent || 0) : 0;
            const sizeKg = Math.round((percent / 100) * daySupply);
            sizeKgMap.set(col.id, sizeKg);
          });
        }
      }
      dailyRmSizeKgMap.set(dStr, sizeKgMap);
    });

    // 7. Fetch Production Transactions for Production Plan Block
    const mpsPlans = await prisma.mpsProductionTransaction.findMany({
      where: {
        partName,
        planDate: { gte: monthStart, lte: monthEnd },
      },
    });

    // Find all planned FG items
    const distinctItemCodes = Array.from(new Set(mpsPlans.map((p) => p.itemCode)));
    const [productSpecs, erpItems] = await Promise.all([
      prisma.productSpec.findMany({
        where: { erpItemCode: { in: distinctItemCodes } },
      }),
      prisma.erpItemMaster.findMany({
        where: { erpItemCode: { in: distinctItemCodes } },
      }),
    ]);

    const specMap = new Map(productSpecs.map((s) => [s.erpItemCode, s]));
    const erpItemMap = new Map(erpItems.map((i) => [i.erpItemCode, i]));

    const fgColumns = distinctItemCodes.map((code) => {
      const spec = specMap.get(code);
      const erp = erpItemMap.get(code);
      const desc = erp?.erpItemDesc || code;
      const yieldPercent = Number(spec?.yieldPercent || 100);
      return {
        itemCode: code,
        description: desc,
        yieldPercent,
      };
    });

    // Sort FG columns by description
    fgColumns.sort((a, b) => a.description.localeCompare(b.description));

    // Matrix of planned qty by date and item code: [dateStr][itemCode] -> qty
    const dailyFgPlanMap = new Map<string, Map<string, number>>();
    const dailyRmUsedMap = new Map<string, number>();

    dayDateStrings.forEach((dStr) => {
      dailyFgPlanMap.set(dStr, new Map<string, number>());
      dailyRmUsedMap.set(dStr, 0);
    });

    mpsPlans.forEach((plan) => {
      const dStr = format(new Date(plan.planDate), 'yyyy-MM-dd');
      const itemMap = dailyFgPlanMap.get(dStr);
      if (itemMap) {
        const currentQty = itemMap.get(plan.itemCode) || 0;
        const addQty = Number(plan.plannedQty || 0);
        itemMap.set(plan.itemCode, currentQty + addQty);

        // Accumulate RM used (Only main products consume the primary incoming RM supply)
        const spec = specMap.get(plan.itemCode);
        const category = (spec?.itemCategory || 'product').toLowerCase();
        if (category === 'product') {
          const yPercent = Number(spec?.yieldPercent || 100);
          const rmNeeded = yPercent > 0 ? addQty / (yPercent / 100) : addQty;
          const currentRmUsed = dailyRmUsedMap.get(dStr) || 0;
          dailyRmUsedMap.set(dStr, currentRmUsed + rmNeeded);
        }
      }
    });

    // 8. BUILD EXCEL WORKBOOK
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SUN Product Planner';
    workbook.created = new Date();

    const sheetName = `${partName.substring(0, 20)} MPS Schedule`;
    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ state: 'frozen', xSplit: 2, ySplit: 3 }],
      properties: { defaultRowHeight: 20 },
    });

    // Compute column indices
    // Block 1: Cols 1..6 (A..F) -> Supply Control
    // Block 2: Cols 7..11 (G..K) -> Manpower & Execution
    // Block 3 (Optional): Machine Execution
    // Block 4: RM [Part] by Size
    // Block 5: Production Plan
    const block1Start = 1;
    const block1End = 6;
    const block2Start = 7;
    const block2End = 11;

    const hasMachines = machineColumns.length > 0;
    const machineStart = block2End + 1;
    const machineEnd = hasMachines ? machineStart + machineColumns.length - 1 : machineStart;

    const hasSizes = sizeColumns.length > 0;
    const block3Start = hasMachines ? machineEnd + 1 : block2End + 1;
    const block3End = hasSizes ? block3Start + sizeColumns.length - 1 : block3Start;

    const block4Start = hasSizes ? block3End + 1 : (hasMachines ? machineEnd + 1 : block2End + 1);
    const hasFgItems = fgColumns.length > 0;
    const block4End = hasFgItems ? block4Start + fgColumns.length - 1 : block4Start;

    // Standard Styles
    const borderThin: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
    };

    const headerFont: Partial<ExcelJS.Font> = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };

    // ROW 1: Group Headers
    const row1 = worksheet.getRow(1);
    row1.height = 26;

    // 1. Supply Control Block
    worksheet.mergeCells(1, block1Start, 1, block1End);
    const cellB1 = worksheet.getCell(1, block1Start);
    cellB1.value = 'Supply Control';
    cellB1.font = headerFont;
    cellB1.alignment = { horizontal: 'center', vertical: 'middle' };
    cellB1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } }; // Navy Blue

    // 2. Manpower & Execution Block
    worksheet.mergeCells(1, block2Start, 1, block2End);
    const cellB2 = worksheet.getCell(1, block2Start);
    cellB2.value = 'Manpower & Execution';
    cellB2.font = headerFont;
    cellB2.alignment = { horizontal: 'center', vertical: 'middle' };
    cellB2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF548235' } }; // Forest Green

    // 3. Machine Execution Block (Teal)
    if (hasMachines) {
      worksheet.mergeCells(1, machineStart, 1, machineEnd);
      const cellBMachine = worksheet.getCell(1, machineStart);
      cellBMachine.value = machineBlockTitle;
      cellBMachine.font = headerFont;
      cellBMachine.alignment = { horizontal: 'center', vertical: 'middle' };
      cellBMachine.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E7490' } }; // Cyan / Deep Teal
    }

    // 4. RM by Size Block (Orange)
    if (hasSizes) {
      worksheet.mergeCells(1, block3Start, 1, block3End);
      const cellB3 = worksheet.getCell(1, block3Start);
      cellB3.value = `RM ${partName.toUpperCase()} by Size`;
      cellB3.font = headerFont;
      cellB3.alignment = { horizontal: 'center', vertical: 'middle' };
      cellB3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC65911' } }; // Rust Orange
    }

    // 5. Production Plan Block (Purple)
    if (hasFgItems) {
      worksheet.mergeCells(1, block4Start, 1, block4End);
      const cellB4 = worksheet.getCell(1, block4Start);
      cellB4.value = 'Production Plan';
      cellB4.font = headerFont;
      cellB4.alignment = { horizontal: 'center', vertical: 'middle' };
      cellB4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7030A0' } }; // Deep Purple
    }

    // ROW 2 & ROW 3: Sub Headers
    const row2 = worksheet.getRow(2);
    const row3 = worksheet.getRow(3);
    row2.height = 36;
    row3.height = 22;

    const subHeaderStyle = {
      font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF2F4F7' } },
      border: borderThin,
    };

    const setupMergedSubHeader = (colIdx: number, title: string, width: number) => {
      worksheet.mergeCells(2, colIdx, 3, colIdx);
      const c = worksheet.getCell(2, colIdx);
      c.value = title;
      c.font = subHeaderStyle.font;
      c.alignment = subHeaderStyle.alignment;
      c.fill = subHeaderStyle.fill;
      c.border = subHeaderStyle.border;
      worksheet.getColumn(colIdx).width = width;
    };

    // Supply Subheaders (1..6)
    setupMergedSubHeader(1, 'Date', 12);
    setupMergedSubHeader(2, 'Day', 6);
    setupMergedSubHeader(3, 'Avg. Wt', 10);
    setupMergedSubHeader(4, `RM ${partName} Total`, 14);
    setupMergedSubHeader(5, 'RM Used (Demand)', 16);
    setupMergedSubHeader(6, 'RM Balance', 14);

    // Manpower Subheaders (7..11)
    setupMergedSubHeader(7, 'Cut (P)', 8);
    setupMergedSubHeader(8, 'Sup (P)', 8);
    setupMergedSubHeader(9, 'Cut (A)', 8);
    setupMergedSubHeader(10, 'Sup (A)', 8);
    setupMergedSubHeader(11, 'Variance', 10);

    // Machine Subheaders (if part has machines)
    if (hasMachines) {
      machineColumns.forEach((mCol, idx) => {
        setupMergedSubHeader(machineStart + idx, mCol.label, mCol.width);
      });
    }

    // RM Size Subheaders (block3Start..block3End)
    if (hasSizes) {
      sizeColumns.forEach((col, idx) => {
        setupMergedSubHeader(block3Start + idx, col.label, 9);
      });
    }

    // Production Plan Subheaders (Two-level header: Row 2 = Desc, Row 3 = Code)
    if (hasFgItems) {
      fgColumns.forEach((fg, idx) => {
        const colIdx = block4Start + idx;
        worksheet.getColumn(colIdx).width = 16;

        const cellDesc = worksheet.getCell(2, colIdx);
        cellDesc.value = fg.description;
        cellDesc.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF1E293B' } };
        cellDesc.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cellDesc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
        cellDesc.border = borderThin;

        const cellCode = worksheet.getCell(3, colIdx);
        cellCode.value = fg.itemCode;
        cellCode.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF475569' } };
        cellCode.alignment = { horizontal: 'center', vertical: 'middle' };
        cellCode.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        cellCode.border = borderThin;
      });
    }

    // DATA ROWS (Row 4 to Row 4 + daysInterval.length - 1)
    let currentRowIdx = 4;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    daysInterval.forEach((d) => {
      const dStr = format(d, 'yyyy-MM-dd');
      const dayOfWeek = getDay(d);
      const isSunday = dayOfWeek === 0;

      const dataRow = worksheet.getRow(currentRowIdx);
      dataRow.height = 20;

      const rowBgColor = isSunday ? 'FFF1F5F9' : 'FFFFFFFF';
      const defaultFill: ExcelJS.Fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowBgColor },
      };

      // 1. Date
      const cDate = dataRow.getCell(1);
      cDate.value = dStr;
      cDate.alignment = { horizontal: 'center', vertical: 'middle' };
      cDate.border = borderThin;
      cDate.fill = defaultFill;

      // 2. Day
      const cDay = dataRow.getCell(2);
      cDay.value = dayNames[dayOfWeek];
      cDay.alignment = { horizontal: 'center', vertical: 'middle' };
      cDay.border = borderThin;
      cDay.fill = defaultFill;

      // 3. Avg Wt
      const avgWt = avgWeightMap.get(dStr) || 0;
      const cAvg = dataRow.getCell(3);
      cAvg.value = avgWt > 0 ? avgWt : '-';
      cAvg.numFmt = '0.00';
      cAvg.alignment = { horizontal: 'right', vertical: 'middle' };
      cAvg.border = borderThin;
      cAvg.fill = defaultFill;

      // 4. RM Total
      const rmTotal = Math.round(supplyMap.get(dStr) || 0);
      const cRmTot = dataRow.getCell(4);
      cRmTot.value = rmTotal > 0 ? rmTotal : 0;
      cRmTot.numFmt = '#,##0';
      cRmTot.alignment = { horizontal: 'right', vertical: 'middle' };
      cRmTot.border = borderThin;
      cRmTot.fill = defaultFill;

      // 5. RM Used
      const rmUsed = Math.round(dailyRmUsedMap.get(dStr) || 0);
      const cRmUsed = dataRow.getCell(5);
      cRmUsed.value = rmUsed > 0 ? rmUsed : 0;
      cRmUsed.numFmt = '#,##0';
      cRmUsed.alignment = { horizontal: 'right', vertical: 'middle' };
      cRmUsed.border = borderThin;
      cRmUsed.fill = defaultFill;

      // 6. RM Balance
      const rmBalance = rmTotal - rmUsed;
      const cRmBal = dataRow.getCell(6);
      cRmBal.value = rmBalance;
      cRmBal.numFmt = '#,##0';
      cRmBal.alignment = { horizontal: 'right', vertical: 'middle' };
      cRmBal.border = borderThin;
      cRmBal.fill = defaultFill;

      // 7..11 Manpower
      const mp = manpowerDailyMap.get(dStr) || { cutP: 0, supP: 0, cutA: 0, supA: 0, variance: 0 };
      const cCutP = dataRow.getCell(7);
      cCutP.value = mp.cutP;
      cCutP.numFmt = '#,##0';
      cCutP.alignment = { horizontal: 'right', vertical: 'middle' };
      cCutP.border = borderThin;
      cCutP.fill = defaultFill;

      const cSupP = dataRow.getCell(8);
      cSupP.value = mp.supP;
      cSupP.numFmt = '#,##0';
      cSupP.alignment = { horizontal: 'right', vertical: 'middle' };
      cSupP.border = borderThin;
      cSupP.fill = defaultFill;

      const cCutA = dataRow.getCell(9);
      cCutA.value = mp.cutA;
      cCutA.numFmt = '#,##0';
      cCutA.alignment = { horizontal: 'right', vertical: 'middle' };
      cCutA.border = borderThin;
      cCutA.fill = defaultFill;

      const cSupA = dataRow.getCell(10);
      cSupA.value = mp.supA;
      cSupA.numFmt = '#,##0';
      cSupA.alignment = { horizontal: 'right', vertical: 'middle' };
      cSupA.border = borderThin;
      cSupA.fill = defaultFill;

      const cVar = dataRow.getCell(11);
      cVar.value = mp.variance;
      cVar.numFmt = '#,##0';
      cVar.alignment = { horizontal: 'right', vertical: 'middle' };
      cVar.border = borderThin;
      if (mp.variance < 0) {
        cVar.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } }; // Soft red
        cVar.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFC00000' } };
      } else {
        cVar.fill = defaultFill;
      }

      // Machine Columns (if present)
      if (hasMachines) {
        const mData = dailyMachineDataMap.get(dStr) || {};
        machineColumns.forEach((mCol, idx) => {
          const cM = dataRow.getCell(machineStart + idx);
          const rawVal = mData[mCol.key] || 0;
          cM.value = rawVal;
          cM.numFmt = mCol.numFmt;
          cM.alignment = { horizontal: 'right', vertical: 'middle' };
          cM.border = borderThin;
          cM.fill = defaultFill;

          // Special highlight for overflow or overload
          if (mCol.key === 'overflowKg' && rawVal > 0) {
            cM.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Soft Amber
            cM.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFB45309' } };
          } else if (mCol.key === 'utilPct' && rawVal > 1.0) {
            cM.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Soft Red
            cM.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFDC2626' } };
          }
        });
      }

      // RM Sizes (block3Start..block3End)
      if (hasSizes) {
        const sizeMap = dailyRmSizeKgMap.get(dStr);
        sizeColumns.forEach((col, idx) => {
          const cSize = dataRow.getCell(block3Start + idx);
          const val = sizeMap?.get(col.id) || 0;
          cSize.value = val;
          cSize.numFmt = '#,##0';
          cSize.alignment = { horizontal: 'right', vertical: 'middle' };
          cSize.border = borderThin;
          cSize.fill = defaultFill;
        });
      }

      // Production Plan FG items (block4Start..block4End)
      if (hasFgItems) {
        const planItemMap = dailyFgPlanMap.get(dStr);
        fgColumns.forEach((fg, idx) => {
          const cFg = dataRow.getCell(block4Start + idx);
          const plannedQty = Math.round(planItemMap?.get(fg.itemCode) || 0);

          if (plannedQty > 0) {
            cFg.value = plannedQty;
            cFg.numFmt = '#,##0';
            cFg.alignment = { horizontal: 'right', vertical: 'middle' };
            cFg.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } }; // Pale Green Highlight
            cFg.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } };
          } else {
            cFg.value = '-';
            cFg.alignment = { horizontal: 'center', vertical: 'middle' };
            cFg.fill = defaultFill;
            cFg.font = { name: 'Calibri', size: 10, color: { argb: 'FF94A3B8' } };
          }
          cFg.border = borderThin;
        });
      }

      currentRowIdx++;
    });

    // TOTALS ROW
    const totalRow = worksheet.getRow(currentRowIdx);
    totalRow.height = 24;
    const totalRowFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEAECEE' },
    };
    const totalFont: Partial<ExcelJS.Font> = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FF1E293B' },
    };
    const borderTotal: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'double', color: { argb: 'FF1E293B' } },
      left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
    };

    // Total label
    worksheet.mergeCells(currentRowIdx, 1, currentRowIdx, 2);
    const cTotLabel = worksheet.getCell(currentRowIdx, 1);
    cTotLabel.value = 'Total';
    cTotLabel.font = totalFont;
    cTotLabel.alignment = { horizontal: 'center', vertical: 'middle' };
    cTotLabel.fill = totalRowFill;
    cTotLabel.border = borderTotal;

    // Col 3: blank
    const cTotAvg = totalRow.getCell(3);
    cTotAvg.value = '';
    cTotAvg.fill = totalRowFill;
    cTotAvg.border = borderTotal;

    // Col 4: RM Total Sum
    const cTotRm = totalRow.getCell(4);
    cTotRm.value = { formula: `SUM(D4:D${currentRowIdx - 1})` };
    cTotRm.numFmt = '#,##0';
    cTotRm.font = totalFont;
    cTotRm.alignment = { horizontal: 'right', vertical: 'middle' };
    cTotRm.fill = totalRowFill;
    cTotRm.border = borderTotal;

    // Col 5: RM Used Sum
    const cTotUsed = totalRow.getCell(5);
    cTotUsed.value = { formula: `SUM(E4:E${currentRowIdx - 1})` };
    cTotUsed.numFmt = '#,##0';
    cTotUsed.font = totalFont;
    cTotUsed.alignment = { horizontal: 'right', vertical: 'middle' };
    cTotUsed.fill = totalRowFill;
    cTotUsed.border = borderTotal;

    // Col 6: RM Balance Sum
    const cTotBal = totalRow.getCell(6);
    cTotBal.value = { formula: `SUM(F4:F${currentRowIdx - 1})` };
    cTotBal.numFmt = '#,##0';
    cTotBal.font = totalFont;
    cTotBal.alignment = { horizontal: 'right', vertical: 'middle' };
    cTotBal.fill = totalRowFill;
    cTotBal.border = borderTotal;

    // Manpower totals (7..11)
    for (let c = 7; c <= 11; c++) {
      const cell = totalRow.getCell(c);
      const colLetter = worksheet.getColumn(c).letter;
      cell.value = { formula: `SUM(${colLetter}4:${colLetter}${currentRowIdx - 1})` };
      cell.numFmt = '#,##0';
      cell.font = totalFont;
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      cell.fill = totalRowFill;
      cell.border = borderTotal;
    }

    // Machine totals (if present)
    if (hasMachines) {
      machineColumns.forEach((mCol, idx) => {
        const colNum = machineStart + idx;
        const cell = totalRow.getCell(colNum);
        const colLetter = worksheet.getColumn(colNum).letter;
        const fn = mCol.isAvgSummary ? 'AVERAGE' : 'SUM';
        cell.value = { formula: `${fn}(${colLetter}4:${colLetter}${currentRowIdx - 1})` };
        cell.numFmt = mCol.numFmt;
        cell.font = totalFont;
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.fill = totalRowFill;
        cell.border = borderTotal;
      });
    }

    // Size columns totals
    if (hasSizes) {
      for (let c = block3Start; c <= block3End; c++) {
        const cell = totalRow.getCell(c);
        const colLetter = worksheet.getColumn(c).letter;
        cell.value = { formula: `SUM(${colLetter}4:${colLetter}${currentRowIdx - 1})` };
        cell.numFmt = '#,##0';
        cell.font = totalFont;
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.fill = totalRowFill;
        cell.border = borderTotal;
      }
    }

    // Production plan totals
    if (hasFgItems) {
      for (let c = block4Start; c <= block4End; c++) {
        const cell = totalRow.getCell(c);
        const colLetter = worksheet.getColumn(c).letter;
        cell.value = { formula: `SUM(${colLetter}4:${colLetter}${currentRowIdx - 1})` };
        cell.numFmt = '#,##0';
        cell.font = totalFont;
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.fill = totalRowFill;
        cell.border = borderTotal;
      }
    }

    // Generate buffer
    const uint8Array = await workbook.xlsx.writeBuffer();
    return Buffer.from(uint8Array);
  }
}
