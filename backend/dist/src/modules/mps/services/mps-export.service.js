"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MpsExportService = void 0;
const common_1 = require("@nestjs/common");
const ExcelJS = __importStar(require("exceljs"));
const date_fns_1 = require("date-fns");
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const manpower_service_1 = require("../../manpower/manpower.service");
const mps_service_1 = require("../mps.service");
let MpsExportService = class MpsExportService {
    manpowerService;
    mpsService;
    constructor(manpowerService, mpsService) {
        this.manpowerService = manpowerService;
        this.mpsService = mpsService;
    }
    async generateProductionScheduleExcel(partName, monthStr) {
        const targetDate = monthStr ? new Date(`${monthStr}-01`) : new Date();
        const monthStart = (0, date_fns_1.startOfMonth)(targetDate);
        const monthEnd = (0, date_fns_1.endOfMonth)(targetDate);
        const currentMonthStr = (0, date_fns_1.format)(monthStart, 'yyyy-MM');
        const daysInterval = (0, date_fns_1.eachDayOfInterval)({ start: monthStart, end: monthEnd });
        const dayDateStrings = daysInterval.map((d) => (0, date_fns_1.format)(d, 'yyyy-MM-dd'));
        const supplies = await prisma_1.default.mpsSupply.findMany({
            where: {
                partName,
                planDate: { gte: monthStart, lte: monthEnd },
            },
        });
        const supplyMap = new Map();
        supplies.forEach((s) => {
            supplyMap.set((0, date_fns_1.format)(new Date(s.planDate), 'yyyy-MM-dd'), Number(s.supplyWeight));
        });
        const [monthlyRecs, weeklyRecs] = await Promise.all([
            prisma_1.default.monthlyChickenReceiving.findMany({
                where: { receiveDate: { gte: monthStart, lte: monthEnd } },
            }),
            prisma_1.default.weeklyChickenReceiving.findMany({
                where: { receiveDate: { gte: monthStart, lte: monthEnd } },
            }),
        ]);
        const avgWeightMap = new Map();
        dayDateStrings.forEach((dStr) => {
            const wForDay = weeklyRecs.filter((w) => (0, date_fns_1.format)(new Date(w.receiveDate), 'yyyy-MM-dd') === dStr);
            const mForDay = monthlyRecs.find((m) => (0, date_fns_1.format)(new Date(m.receiveDate), 'yyyy-MM-dd') === dStr);
            let avgWt = 0;
            if (wForDay.length > 0) {
                const totalCount = wForDay.reduce((s, w) => s + Number(w.totalCount || 0), 0);
                const totalWeight = wForDay.reduce((s, w) => s + Number(w.totalWeight || 0), 0);
                if (totalCount > 0) {
                    avgWt = Number((totalWeight / totalCount).toFixed(2));
                }
            }
            else if (mForDay) {
                avgWt = Number(Number(mForDay.averageWeight || 0).toFixed(2));
            }
            avgWeightMap.set(dStr, avgWt);
        });
        const manpowerDailyMap = new Map();
        try {
            const planData = await this.manpowerService.getDailyPlan(partName, currentMonthStr);
            const actualRecords = await this.manpowerService.getActualRecords(partName, undefined, currentMonthStr, 'ALL');
            const roles = planData.roles || [];
            const matrix = planData.matrix || {};
            const actualByDateRole = new Map();
            actualRecords.forEach((act) => {
                const dStr = (0, date_fns_1.format)(new Date(act.date), 'yyyy-MM-dd');
                const key = `${dStr}_${act.roleId}`;
                const prev = actualByDateRole.get(key) || 0;
                actualByDateRole.set(key, prev + Number(act.presentWorkers || 0));
            });
            dayDateStrings.forEach((dStr) => {
                let cutP = 0;
                let supP = 0;
                let cutA = 0;
                let supA = 0;
                roles.forEach((r) => {
                    const roleCell = matrix[r.id]?.[dStr];
                    const planned = roleCell?.effectiveWorkers || roleCell?.calculatedWorkers || 0;
                    const actual = actualByDateRole.get(`${dStr}_${r.id}`) || 0;
                    if (r.calculationType === 'VARIABLE') {
                        cutP += planned;
                        cutA += actual;
                    }
                    else {
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
        }
        catch (err) {
            console.warn('Manpower data not available for export:', err);
        }
        const partUpper = partName.toUpperCase();
        let machineBlockTitle = '';
        let machineColumns = [];
        const dailyMachineDataMap = new Map();
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
            }
            catch (err) {
                console.warn('Failed to load Toridas metrics for export:', err);
            }
        }
        else if (partUpper === 'BL') {
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
            }
            catch (err) {
                console.warn('Failed to load I-Cut metrics for export:', err);
            }
        }
        const rmSizes = await prisma_1.default.partRmSize.findMany({
            where: { partName },
            orderBy: { minSize: 'asc' },
        });
        const [weightDists, chickenWeightRanges] = await Promise.all([
            prisma_1.default.partWeightDistribution.findMany({ where: { partName } }),
            prisma_1.default.chickenWeight.findMany({ orderBy: { minWeight: 'asc' } }),
        ]);
        const sizeColumns = rmSizes.map((rm) => {
            let label = '';
            if (rm.minSize == null && rm.maxSize != null) {
                label = `${rm.maxSize} Down`;
            }
            else if (rm.minSize != null && rm.maxSize == null) {
                label = `${rm.minSize} Up`;
            }
            else {
                label = `${rm.minSize}-${rm.maxSize}`;
            }
            return {
                id: rm.id,
                label,
            };
        });
        const dailyRmSizeKgMap = new Map();
        dayDateStrings.forEach((dStr) => {
            const daySupply = supplyMap.get(dStr) || 0;
            const avgWt = avgWeightMap.get(dStr) || 2.8;
            const sizeKgMap = new Map();
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
                        const dist = weightDists.find((d) => d.chickenWeightId === matchedCw.id && d.partRmSizeId === col.id);
                        const percent = dist ? Number(dist.percent || 0) : 0;
                        const sizeKg = Math.round((percent / 100) * daySupply);
                        sizeKgMap.set(col.id, sizeKg);
                    });
                }
            }
            dailyRmSizeKgMap.set(dStr, sizeKgMap);
        });
        const mpsPlans = await prisma_1.default.mpsProductionTransaction.findMany({
            where: {
                partName,
                planDate: { gte: monthStart, lte: monthEnd },
            },
        });
        const distinctItemCodes = Array.from(new Set(mpsPlans.map((p) => p.itemCode)));
        const [productSpecs, erpItems] = await Promise.all([
            prisma_1.default.productSpec.findMany({
                where: { erpItemCode: { in: distinctItemCodes } },
            }),
            prisma_1.default.erpItemMaster.findMany({
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
        fgColumns.sort((a, b) => a.description.localeCompare(b.description));
        const dailyFgPlanMap = new Map();
        const dailyRmUsedMap = new Map();
        dayDateStrings.forEach((dStr) => {
            dailyFgPlanMap.set(dStr, new Map());
            dailyRmUsedMap.set(dStr, 0);
        });
        mpsPlans.forEach((plan) => {
            const dStr = (0, date_fns_1.format)(new Date(plan.planDate), 'yyyy-MM-dd');
            const itemMap = dailyFgPlanMap.get(dStr);
            if (itemMap) {
                const currentQty = itemMap.get(plan.itemCode) || 0;
                const addQty = Number(plan.plannedQty || 0);
                itemMap.set(plan.itemCode, currentQty + addQty);
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
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'SUN Product Planner';
        workbook.created = new Date();
        const sheetName = `${partName.substring(0, 20)} MPS Schedule`;
        const worksheet = workbook.addWorksheet(sheetName, {
            views: [{ state: 'frozen', xSplit: 2, ySplit: 3 }],
            properties: { defaultRowHeight: 20 },
        });
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
        const borderThin = {
            top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        };
        const headerFont = {
            name: 'Calibri',
            size: 11,
            bold: true,
            color: { argb: 'FFFFFFFF' },
        };
        const row1 = worksheet.getRow(1);
        row1.height = 26;
        worksheet.mergeCells(1, block1Start, 1, block1End);
        const cellB1 = worksheet.getCell(1, block1Start);
        cellB1.value = 'Supply Control';
        cellB1.font = headerFont;
        cellB1.alignment = { horizontal: 'center', vertical: 'middle' };
        cellB1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
        worksheet.mergeCells(1, block2Start, 1, block2End);
        const cellB2 = worksheet.getCell(1, block2Start);
        cellB2.value = 'Manpower & Execution';
        cellB2.font = headerFont;
        cellB2.alignment = { horizontal: 'center', vertical: 'middle' };
        cellB2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF548235' } };
        if (hasMachines) {
            worksheet.mergeCells(1, machineStart, 1, machineEnd);
            const cellBMachine = worksheet.getCell(1, machineStart);
            cellBMachine.value = machineBlockTitle;
            cellBMachine.font = headerFont;
            cellBMachine.alignment = { horizontal: 'center', vertical: 'middle' };
            cellBMachine.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E7490' } };
        }
        if (hasSizes) {
            worksheet.mergeCells(1, block3Start, 1, block3End);
            const cellB3 = worksheet.getCell(1, block3Start);
            cellB3.value = `RM ${partName.toUpperCase()} by Size`;
            cellB3.font = headerFont;
            cellB3.alignment = { horizontal: 'center', vertical: 'middle' };
            cellB3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC65911' } };
        }
        if (hasFgItems) {
            worksheet.mergeCells(1, block4Start, 1, block4End);
            const cellB4 = worksheet.getCell(1, block4Start);
            cellB4.value = 'Production Plan';
            cellB4.font = headerFont;
            cellB4.alignment = { horizontal: 'center', vertical: 'middle' };
            cellB4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7030A0' } };
        }
        const row2 = worksheet.getRow(2);
        const row3 = worksheet.getRow(3);
        row2.height = 36;
        row3.height = 22;
        const subHeaderStyle = {
            font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } },
            alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F4F7' } },
            border: borderThin,
        };
        const setupMergedSubHeader = (colIdx, title, width) => {
            worksheet.mergeCells(2, colIdx, 3, colIdx);
            const c = worksheet.getCell(2, colIdx);
            c.value = title;
            c.font = subHeaderStyle.font;
            c.alignment = subHeaderStyle.alignment;
            c.fill = subHeaderStyle.fill;
            c.border = subHeaderStyle.border;
            worksheet.getColumn(colIdx).width = width;
        };
        setupMergedSubHeader(1, 'Date', 12);
        setupMergedSubHeader(2, 'Day', 6);
        setupMergedSubHeader(3, 'Avg. Wt', 10);
        setupMergedSubHeader(4, `RM ${partName} Total`, 14);
        setupMergedSubHeader(5, 'RM Used (Demand)', 16);
        setupMergedSubHeader(6, 'RM Balance', 14);
        setupMergedSubHeader(7, 'Cut (P)', 8);
        setupMergedSubHeader(8, 'Sup (P)', 8);
        setupMergedSubHeader(9, 'Cut (A)', 8);
        setupMergedSubHeader(10, 'Sup (A)', 8);
        setupMergedSubHeader(11, 'Variance', 10);
        if (hasMachines) {
            machineColumns.forEach((mCol, idx) => {
                setupMergedSubHeader(machineStart + idx, mCol.label, mCol.width);
            });
        }
        if (hasSizes) {
            sizeColumns.forEach((col, idx) => {
                setupMergedSubHeader(block3Start + idx, col.label, 9);
            });
        }
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
        let currentRowIdx = 4;
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        daysInterval.forEach((d) => {
            const dStr = (0, date_fns_1.format)(d, 'yyyy-MM-dd');
            const dayOfWeek = (0, date_fns_1.getDay)(d);
            const isSunday = dayOfWeek === 0;
            const dataRow = worksheet.getRow(currentRowIdx);
            dataRow.height = 20;
            const rowBgColor = isSunday ? 'FFF1F5F9' : 'FFFFFFFF';
            const defaultFill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: rowBgColor },
            };
            const cDate = dataRow.getCell(1);
            cDate.value = dStr;
            cDate.alignment = { horizontal: 'center', vertical: 'middle' };
            cDate.border = borderThin;
            cDate.fill = defaultFill;
            const cDay = dataRow.getCell(2);
            cDay.value = dayNames[dayOfWeek];
            cDay.alignment = { horizontal: 'center', vertical: 'middle' };
            cDay.border = borderThin;
            cDay.fill = defaultFill;
            const avgWt = avgWeightMap.get(dStr) || 0;
            const cAvg = dataRow.getCell(3);
            cAvg.value = avgWt > 0 ? avgWt : '-';
            cAvg.numFmt = '0.00';
            cAvg.alignment = { horizontal: 'right', vertical: 'middle' };
            cAvg.border = borderThin;
            cAvg.fill = defaultFill;
            const rmTotal = Math.round(supplyMap.get(dStr) || 0);
            const cRmTot = dataRow.getCell(4);
            cRmTot.value = rmTotal > 0 ? rmTotal : 0;
            cRmTot.numFmt = '#,##0';
            cRmTot.alignment = { horizontal: 'right', vertical: 'middle' };
            cRmTot.border = borderThin;
            cRmTot.fill = defaultFill;
            const rmUsed = Math.round(dailyRmUsedMap.get(dStr) || 0);
            const cRmUsed = dataRow.getCell(5);
            cRmUsed.value = rmUsed > 0 ? rmUsed : 0;
            cRmUsed.numFmt = '#,##0';
            cRmUsed.alignment = { horizontal: 'right', vertical: 'middle' };
            cRmUsed.border = borderThin;
            cRmUsed.fill = defaultFill;
            const rmBalance = rmTotal - rmUsed;
            const cRmBal = dataRow.getCell(6);
            cRmBal.value = rmBalance;
            cRmBal.numFmt = '#,##0';
            cRmBal.alignment = { horizontal: 'right', vertical: 'middle' };
            cRmBal.border = borderThin;
            cRmBal.fill = defaultFill;
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
                cVar.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };
                cVar.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFC00000' } };
            }
            else {
                cVar.fill = defaultFill;
            }
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
                    if (mCol.key === 'overflowKg' && rawVal > 0) {
                        cM.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
                        cM.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFB45309' } };
                    }
                    else if (mCol.key === 'utilPct' && rawVal > 1.0) {
                        cM.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
                        cM.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFDC2626' } };
                    }
                });
            }
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
            if (hasFgItems) {
                const planItemMap = dailyFgPlanMap.get(dStr);
                fgColumns.forEach((fg, idx) => {
                    const cFg = dataRow.getCell(block4Start + idx);
                    const plannedQty = Math.round(planItemMap?.get(fg.itemCode) || 0);
                    if (plannedQty > 0) {
                        cFg.value = plannedQty;
                        cFg.numFmt = '#,##0';
                        cFg.alignment = { horizontal: 'right', vertical: 'middle' };
                        cFg.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
                        cFg.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } };
                    }
                    else {
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
        const totalRow = worksheet.getRow(currentRowIdx);
        totalRow.height = 24;
        const totalRowFill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEAECEE' },
        };
        const totalFont = {
            name: 'Calibri',
            size: 11,
            bold: true,
            color: { argb: 'FF1E293B' },
        };
        const borderTotal = {
            top: { style: 'thin', color: { argb: 'FF94A3B8' } },
            bottom: { style: 'double', color: { argb: 'FF1E293B' } },
            left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        };
        worksheet.mergeCells(currentRowIdx, 1, currentRowIdx, 2);
        const cTotLabel = worksheet.getCell(currentRowIdx, 1);
        cTotLabel.value = 'Total';
        cTotLabel.font = totalFont;
        cTotLabel.alignment = { horizontal: 'center', vertical: 'middle' };
        cTotLabel.fill = totalRowFill;
        cTotLabel.border = borderTotal;
        const cTotAvg = totalRow.getCell(3);
        cTotAvg.value = '';
        cTotAvg.fill = totalRowFill;
        cTotAvg.border = borderTotal;
        const cTotRm = totalRow.getCell(4);
        cTotRm.value = { formula: `SUM(D4:D${currentRowIdx - 1})` };
        cTotRm.numFmt = '#,##0';
        cTotRm.font = totalFont;
        cTotRm.alignment = { horizontal: 'right', vertical: 'middle' };
        cTotRm.fill = totalRowFill;
        cTotRm.border = borderTotal;
        const cTotUsed = totalRow.getCell(5);
        cTotUsed.value = { formula: `SUM(E4:E${currentRowIdx - 1})` };
        cTotUsed.numFmt = '#,##0';
        cTotUsed.font = totalFont;
        cTotUsed.alignment = { horizontal: 'right', vertical: 'middle' };
        cTotUsed.fill = totalRowFill;
        cTotUsed.border = borderTotal;
        const cTotBal = totalRow.getCell(6);
        cTotBal.value = { formula: `SUM(F4:F${currentRowIdx - 1})` };
        cTotBal.numFmt = '#,##0';
        cTotBal.font = totalFont;
        cTotBal.alignment = { horizontal: 'right', vertical: 'middle' };
        cTotBal.fill = totalRowFill;
        cTotBal.border = borderTotal;
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
        const uint8Array = await workbook.xlsx.writeBuffer();
        return Buffer.from(uint8Array);
    }
};
exports.MpsExportService = MpsExportService;
exports.MpsExportService = MpsExportService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => mps_service_1.MpsService))),
    __metadata("design:paramtypes", [manpower_service_1.ManpowerService,
        mps_service_1.MpsService])
], MpsExportService);
//# sourceMappingURL=mps-export.service.js.map