"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineCapacityService = exports.SaveWeeklyDefaultsDto = exports.BatchSaveActualMachineDto = exports.SaveDailyActualMachineDto = exports.SaveMachineOverrideDto = exports.UpdateMachineMasterDto = exports.CreateMachineMasterDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const date_fns_1 = require("date-fns");
const icutCapacity_1 = require("../mps/utils/icutCapacity");
class CreateMachineMasterDto {
    partName;
    machineCode;
    machineName;
    machineType;
    machinesCount;
    standardSpeedKgHr;
    workingHoursPerShift;
    shiftsCount;
    targetUtilizationPct;
    weeklyDefaults;
}
exports.CreateMachineMasterDto = CreateMachineMasterDto;
class UpdateMachineMasterDto {
    partName;
    machineCode;
    machineName;
    machineType;
    machinesCount;
    standardSpeedKgHr;
    workingHoursPerShift;
    shiftsCount;
    targetUtilizationPct;
    weeklyDefaults;
    orderIndex;
}
exports.UpdateMachineMasterDto = UpdateMachineMasterDto;
class SaveMachineOverrideDto {
    machineId;
    date;
    shiftsCount;
    availableHours;
    plannedLoadKg;
    notes;
}
exports.SaveMachineOverrideDto = SaveMachineOverrideDto;
class SaveDailyActualMachineDto {
    machineId;
    actualRunHours;
    actualOutputKg;
    downtimeHours;
    downtimeBreakdownHours;
    downtimeChangeoverHours;
    downtimeCleaningHours;
    downtimeShortageHours;
    downtimeOtherHours;
    downtimeReason;
    notes;
}
exports.SaveDailyActualMachineDto = SaveDailyActualMachineDto;
class BatchSaveActualMachineDto {
    date;
    shift;
    recordedBy;
    records;
}
exports.BatchSaveActualMachineDto = BatchSaveActualMachineDto;
class SaveWeeklyDefaultsDto {
    defaults;
}
exports.SaveWeeklyDefaultsDto = SaveWeeklyDefaultsDto;
let MachineCapacityService = class MachineCapacityService {
    DEFAULT_REAL_MACHINES = [
        {
            partName: 'BIL',
            machineCode: 'TRD-01',
            machineName: 'เครื่องเลาะ Toridas',
            machineType: 'TORIDAS',
            machinesCount: 3,
            standardSpeedKgHr: 2100.0,
            workingHoursPerShift: 9.58,
            shiftsCount: 2,
            targetUtilizationPct: 85.0,
            orderIndex: 1,
        },
        {
            partName: 'BL',
            machineCode: 'ICUT-01',
            machineName: 'เครื่องตัด I-Cut',
            machineType: 'ICUT',
            machinesCount: 2,
            standardSpeedKgHr: 500.0,
            workingHoursPerShift: 9.25,
            shiftsCount: 2,
            targetUtilizationPct: 85.0,
            orderIndex: 2,
        },
        {
            partName: 'BL',
            machineCode: 'BG-01',
            machineName: 'เครื่องจัดไซส์ Belt Gate',
            machineType: 'BELT_GATE',
            machinesCount: 1,
            standardSpeedKgHr: 1800.0,
            workingHoursPerShift: 9.25,
            shiftsCount: 2,
            targetUtilizationPct: 85.0,
            orderIndex: 3,
        },
    ];
    async seedDefaultRealMachines() {
        for (const m of this.DEFAULT_REAL_MACHINES) {
            const exists = await prisma_1.default.machineMaster.findFirst({
                where: { machineCode: m.machineCode },
            });
            if (!exists) {
                await prisma_1.default.machineMaster.create({
                    data: {
                        partName: m.partName,
                        machineCode: m.machineCode,
                        machineName: m.machineName,
                        machineType: m.machineType,
                        machinesCount: m.machinesCount,
                        standardSpeedKgHr: m.standardSpeedKgHr,
                        workingHoursPerShift: m.workingHoursPerShift,
                        shiftsCount: m.shiftsCount,
                        targetUtilizationPct: m.targetUtilizationPct,
                        orderIndex: m.orderIndex,
                    },
                });
            }
        }
        return prisma_1.default.machineMaster.findMany({
            orderBy: { orderIndex: 'asc' },
        });
    }
    async getAllMachines(partFilter) {
        const where = {};
        if (partFilter && partFilter.toUpperCase() !== 'ALL') {
            where.partName = partFilter;
        }
        let machines = await prisma_1.default.machineMaster.findMany({
            where,
            orderBy: { orderIndex: 'asc' },
        });
        if (machines.length === 0 && (!partFilter || partFilter.toUpperCase() === 'ALL')) {
            machines = await this.seedDefaultRealMachines();
        }
        return machines.map((m) => {
            let weeklyDefaults = null;
            if (m.weeklyDefaults) {
                try {
                    weeklyDefaults = JSON.parse(m.weeklyDefaults);
                }
                catch {
                    weeklyDefaults = null;
                }
            }
            return {
                id: m.id,
                partName: m.partName,
                machineCode: m.machineCode,
                machineName: m.machineName,
                machineType: m.machineType,
                machinesCount: m.machinesCount,
                standardSpeedKgHr: Number(m.standardSpeedKgHr),
                workingHoursPerShift: Number(m.workingHoursPerShift),
                shiftsCount: m.shiftsCount,
                targetUtilizationPct: Number(m.targetUtilizationPct),
                weeklyDefaults,
                orderIndex: m.orderIndex,
            };
        });
    }
    async getMachinesForPart(partName) {
        return this.getAllMachines(partName);
    }
    async createMachine(partName, dto) {
        const assignedPart = dto.partName || partName || 'BL';
        const last = await prisma_1.default.machineMaster.findFirst({
            orderBy: { orderIndex: 'desc' },
        });
        const nextOrder = (last?.orderIndex || 0) + 1;
        return prisma_1.default.machineMaster.create({
            data: {
                partName: assignedPart,
                machineCode: dto.machineCode,
                machineName: dto.machineName,
                machineType: dto.machineType,
                machinesCount: dto.machinesCount ?? 1,
                standardSpeedKgHr: dto.standardSpeedKgHr ?? 500.0,
                workingHoursPerShift: dto.workingHoursPerShift ?? 8.0,
                shiftsCount: dto.shiftsCount ?? 1,
                targetUtilizationPct: dto.targetUtilizationPct ?? 85.0,
                weeklyDefaults: dto.weeklyDefaults
                    ? typeof dto.weeklyDefaults === 'string'
                        ? dto.weeklyDefaults
                        : JSON.stringify(dto.weeklyDefaults)
                    : null,
                orderIndex: nextOrder,
            },
        });
    }
    async updateMachine(id, dto) {
        const existing = await prisma_1.default.machineMaster.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Machine ${id} not found.`);
        }
        return prisma_1.default.machineMaster.update({
            where: { id },
            data: {
                partName: dto.partName !== undefined ? dto.partName : undefined,
                machineCode: dto.machineCode !== undefined ? dto.machineCode : undefined,
                machineName: dto.machineName !== undefined ? dto.machineName : undefined,
                machineType: dto.machineType !== undefined ? dto.machineType : undefined,
                machinesCount: dto.machinesCount !== undefined ? dto.machinesCount : undefined,
                standardSpeedKgHr: dto.standardSpeedKgHr !== undefined
                    ? Number(dto.standardSpeedKgHr)
                    : undefined,
                workingHoursPerShift: dto.workingHoursPerShift !== undefined
                    ? Number(dto.workingHoursPerShift)
                    : undefined,
                shiftsCount: dto.shiftsCount !== undefined ? dto.shiftsCount : undefined,
                targetUtilizationPct: dto.targetUtilizationPct !== undefined
                    ? Number(dto.targetUtilizationPct)
                    : undefined,
                weeklyDefaults: dto.weeklyDefaults !== undefined
                    ? typeof dto.weeklyDefaults === 'string'
                        ? dto.weeklyDefaults
                        : JSON.stringify(dto.weeklyDefaults)
                    : undefined,
                orderIndex: dto.orderIndex !== undefined ? Number(dto.orderIndex) : undefined,
            },
        });
    }
    async deleteMachine(id) {
        const existing = await prisma_1.default.machineMaster.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Machine ${id} not found.`);
        }
        return prisma_1.default.machineMaster.delete({ where: { id } });
    }
    async getDailyPlan(monthStr, partFilter) {
        const targetDate = monthStr ? new Date(`${monthStr}-01`) : new Date();
        const monthStart = (0, date_fns_1.startOfMonth)(targetDate);
        const monthEnd = (0, date_fns_1.endOfMonth)(targetDate);
        const resolvedMonth = (0, date_fns_1.format)(targetDate, 'yyyy-MM');
        const machines = await this.getAllMachines(partFilter);
        const neededParts = Array.from(new Set(machines.map((m) => m.partName).filter(Boolean)));
        const mpsPlans = await prisma_1.default.mpsProductionTransaction.findMany({
            where: {
                partName: { in: neededParts.length > 0 ? neededParts : ['BL', 'BIL'] },
                planDate: { gte: monthStart, lte: monthEnd },
                plannedQty: { gt: 0 },
            },
        });
        const itemCodes = Array.from(new Set(mpsPlans.map((p) => p.itemCode)));
        const specs = await prisma_1.default.productSpec.findMany({
            where: { erpItemCode: { in: itemCodes } },
        });
        const specMap = new Map(specs.map((s) => [s.erpItemCode, s]));
        const machineIds = machines.map((m) => m.id);
        const savedOverrides = await prisma_1.default.dailyMachineRecord.findMany({
            where: {
                machineId: { in: machineIds },
                date: { gte: monthStart, lte: monthEnd },
            },
        });
        const overrideMap = new Map();
        savedOverrides.forEach((o) => {
            const dKey = `${(0, date_fns_1.format)(new Date(o.date), 'yyyy-MM-dd')}_${o.machineId}`;
            overrideMap.set(dKey, o);
        });
        const daysInterval = (0, date_fns_1.eachDayOfInterval)({
            start: monthStart,
            end: monthEnd,
        });
        const days = daysInterval.map((d) => (0, date_fns_1.format)(d, 'yyyy-MM-dd'));
        const plansByDateAndPart = {};
        days.forEach((dStr) => {
            plansByDateAndPart[dStr] = {};
        });
        mpsPlans.forEach((p) => {
            const dStr = (0, date_fns_1.format)(new Date(p.planDate), 'yyyy-MM-dd');
            if (plansByDateAndPart[dStr]) {
                if (!plansByDateAndPart[dStr][p.partName]) {
                    plansByDateAndPart[dStr][p.partName] = [];
                }
                plansByDateAndPart[dStr][p.partName].push(p);
            }
        });
        const matrix = {};
        const dailyTotalPlannedHours = {};
        const dailyTotalAvailableHours = {};
        const dailyTotalPlannedKg = {};
        const dailyOverallUtilization = {};
        days.forEach((dStr) => {
            dailyTotalPlannedHours[dStr] = 0;
            dailyTotalAvailableHours[dStr] = 0;
            dailyTotalPlannedKg[dStr] = 0;
            dailyOverallUtilization[dStr] = 0;
        });
        for (const machine of machines) {
            matrix[machine.id] = {};
            for (const dStr of days) {
                const dayOfWeek = (0, date_fns_1.parseISO)(dStr).getDay();
                const partPlansToday = plansByDateAndPart[dStr]?.[machine.partName] || [];
                let shiftsCount = machine.shiftsCount || 1;
                if (machine.weeklyDefaults &&
                    machine.weeklyDefaults[dayOfWeek] !== undefined) {
                    shiftsCount = Number(machine.weeklyDefaults[dayOfWeek]);
                }
                const workHours = machine.workingHoursPerShift || 8.0;
                const machinesCount = machine.machinesCount || 1;
                let availableHours = Math.round(shiftsCount * workHours * machinesCount * 100) / 100;
                let plannedLoadKg = 0;
                let requiredHours = 0;
                const itemBreakdowns = [];
                if (machine.machineType === 'ICUT') {
                    const icutPlans = partPlansToday.filter((p) => {
                        const spec = specMap.get(p.itemCode);
                        return (0, icutCapacity_1.isICutItem)(p.itemCode, spec);
                    });
                    for (const p of icutPlans) {
                        const spec = specMap.get(p.itemCode);
                        const speed = spec?.iCutSpeed && Number(spec.iCutSpeed) > 0
                            ? Number(spec.iCutSpeed)
                            : machine.standardSpeedKgHr || 500.0;
                        const plannedQty = Number(p.plannedQty || 0);
                        const hrs = speed > 0 ? plannedQty / speed : 0;
                        requiredHours += hrs;
                        plannedLoadKg += plannedQty;
                        itemBreakdowns.push({
                            itemCode: p.itemCode,
                            itemName: spec?.productType ? `${p.itemCode} (${spec.productType})` : p.itemCode,
                            plannedQty: Math.round(plannedQty * 10) / 10,
                            speedKgHr: speed,
                            machineHours: Math.round(hrs * 100) / 100,
                        });
                    }
                }
                else if (machine.machineType === 'TORIDAS') {
                    const totalBilOutput = partPlansToday.reduce((sum, p) => sum + Number(p.plannedQty || 0), 0);
                    plannedLoadKg = totalBilOutput > 0 ? Math.round(totalBilOutput / 0.8) : 0;
                    const lineSpeed = (machine.standardSpeedKgHr || 2100.0) * machinesCount;
                    if (plannedLoadKg > 0 && lineSpeed > 0) {
                        requiredHours = plannedLoadKg / lineSpeed;
                    }
                    if (partPlansToday.length > 0) {
                        itemBreakdowns.push({
                            itemCode: 'BIL-FEED',
                            itemName: 'วัตถุดิบสะโพกป้อน Toridas',
                            plannedQty: plannedLoadKg,
                            speedKgHr: lineSpeed,
                            machineHours: Math.round(requiredHours * 100) / 100,
                        });
                    }
                }
                else if (machine.machineType === 'BELT_GATE') {
                    const totalBlKg = partPlansToday.reduce((sum, p) => sum + Number(p.plannedQty || 0), 0);
                    plannedLoadKg = totalBlKg;
                    const speed = (machine.standardSpeedKgHr || 1800.0) * machinesCount;
                    if (plannedLoadKg > 0 && speed > 0) {
                        requiredHours = plannedLoadKg / speed;
                    }
                    if (partPlansToday.length > 0) {
                        itemBreakdowns.push({
                            itemCode: 'BL-RM-SIZING',
                            itemName: 'อกไก่สดคัดขนาด Belt Gate',
                            plannedQty: plannedLoadKg,
                            speedKgHr: speed,
                            machineHours: Math.round(requiredHours * 100) / 100,
                        });
                    }
                }
                else {
                    const totalKg = partPlansToday.reduce((sum, p) => sum + Number(p.plannedQty || 0), 0);
                    plannedLoadKg = totalKg;
                    const speed = (machine.standardSpeedKgHr || 1000.0) * machinesCount;
                    if (plannedLoadKg > 0 && speed > 0) {
                        requiredHours = plannedLoadKg / speed;
                    }
                    if (plannedLoadKg > 0) {
                        itemBreakdowns.push({
                            itemCode: `${machine.machineCode}-GENERIC`,
                            itemName: `งานโหลดเครื่องจักร ${machine.machineName}`,
                            plannedQty: plannedLoadKg,
                            speedKgHr: speed,
                            machineHours: Math.round(requiredHours * 100) / 100,
                        });
                    }
                }
                requiredHours = Math.round(requiredHours * 100) / 100;
                plannedLoadKg = Math.round(plannedLoadKg * 100) / 100;
                const overrideKey = `${dStr}_${machine.id}`;
                const override = overrideMap.get(overrideKey);
                let isOverridden = false;
                let notes = null;
                if (override) {
                    isOverridden = Boolean(override.isOverridden);
                    notes = override.notes || null;
                    if (override.shiftsCount !== undefined && override.shiftsCount !== null) {
                        shiftsCount = Number(override.shiftsCount);
                        availableHours =
                            Math.round(shiftsCount * workHours * machinesCount * 100) / 100;
                    }
                    if (override.availableHours !== undefined && override.availableHours !== null) {
                        availableHours = Number(override.availableHours);
                    }
                    if (override.plannedLoadKg !== undefined && override.plannedLoadKg !== null) {
                        plannedLoadKg = Number(override.plannedLoadKg);
                        const speed = (machine.standardSpeedKgHr || 500.0) * machinesCount;
                        requiredHours = Math.round((plannedLoadKg / speed) * 100) / 100;
                    }
                }
                let utilizationPct = 0;
                if (availableHours > 0) {
                    utilizationPct = Math.round((requiredHours / availableHours) * 1000) / 10;
                }
                else if (requiredHours > 0) {
                    utilizationPct = 999.9;
                }
                let status = 'idle';
                if (requiredHours === 0 && availableHours > 0) {
                    status = 'idle';
                }
                else if (utilizationPct > 100) {
                    status = 'overload';
                }
                else if (utilizationPct >= (machine.targetUtilizationPct || 85)) {
                    status = 'high';
                }
                else {
                    status = 'normal';
                }
                matrix[machine.id][dStr] = {
                    machineId: machine.id,
                    date: dStr,
                    plannedLoadKg,
                    requiredHours,
                    availableHours,
                    shiftsCount,
                    utilizationPct,
                    status,
                    isOverridden,
                    notes,
                    items: itemBreakdowns,
                };
                dailyTotalPlannedHours[dStr] =
                    Math.round((dailyTotalPlannedHours[dStr] + requiredHours) * 100) / 100;
                dailyTotalAvailableHours[dStr] =
                    Math.round((dailyTotalAvailableHours[dStr] + availableHours) * 100) / 100;
                dailyTotalPlannedKg[dStr] =
                    Math.round((dailyTotalPlannedKg[dStr] + plannedLoadKg) * 100) / 100;
            }
        }
        days.forEach((dStr) => {
            const av = dailyTotalAvailableHours[dStr];
            const req = dailyTotalPlannedHours[dStr];
            dailyOverallUtilization[dStr] =
                av > 0 ? Math.round((req / av) * 1000) / 10 : 0;
        });
        let sumUtil = 0;
        let workingDaysCount = 0;
        let peakUtil = 0;
        let overloadDaysCount = 0;
        let totalPlannedHoursAll = 0;
        let totalAvailableHoursAll = 0;
        let totalPlannedKgAll = 0;
        days.forEach((dStr) => {
            const u = dailyOverallUtilization[dStr];
            const req = dailyTotalPlannedHours[dStr];
            const av = dailyTotalAvailableHours[dStr];
            const kg = dailyTotalPlannedKg[dStr];
            totalPlannedHoursAll += req;
            totalAvailableHoursAll += av;
            totalPlannedKgAll += kg;
            if (av > 0 || req > 0) {
                workingDaysCount++;
                sumUtil += u;
                if (u > peakUtil)
                    peakUtil = u;
                if (u > 100)
                    overloadDaysCount++;
            }
        });
        const avgDailyUtilization = workingDaysCount > 0 ? Math.round((sumUtil / workingDaysCount) * 10) / 10 : 0;
        return {
            partName: partFilter || 'ALL',
            month: resolvedMonth,
            days,
            machines,
            matrix,
            dailyTotals: {
                plannedHours: dailyTotalPlannedHours,
                availableHours: dailyTotalAvailableHours,
                plannedKg: dailyTotalPlannedKg,
                overallUtilization: dailyOverallUtilization,
            },
            summary: {
                avgDailyUtilization,
                peakUtilization: peakUtil,
                overloadDaysCount,
                totalWorkingDays: workingDaysCount,
                totalPlannedHours: Math.round(totalPlannedHoursAll * 10) / 10,
                totalAvailableHours: Math.round(totalAvailableHoursAll * 10) / 10,
                totalPlannedKg: Math.round(totalPlannedKgAll * 10) / 10,
                machinesCount: machines.length,
            },
        };
    }
    async saveOverrides(partName, overrides) {
        return prisma_1.default.$transaction(async (tx) => {
            for (const item of overrides) {
                const dateObj = new Date(item.date);
                const machine = await tx.machineMaster.findUnique({
                    where: { id: item.machineId },
                });
                const assignedPart = machine?.partName || partName || 'BL';
                await tx.dailyMachineRecord.upsert({
                    where: {
                        partName_date_machineId: {
                            partName: assignedPart,
                            date: dateObj,
                            machineId: item.machineId,
                        },
                    },
                    update: {
                        shiftsCount: item.shiftsCount !== undefined ? item.shiftsCount : undefined,
                        availableHours: item.availableHours !== undefined
                            ? item.availableHours
                            : undefined,
                        plannedLoadKg: item.plannedLoadKg !== undefined ? item.plannedLoadKg : undefined,
                        isOverridden: true,
                        notes: item.notes !== undefined ? item.notes : undefined,
                    },
                    create: {
                        partName: assignedPart,
                        date: dateObj,
                        machineId: item.machineId,
                        shiftsCount: item.shiftsCount || 1,
                        availableHours: item.availableHours || 0,
                        plannedLoadKg: item.plannedLoadKg || 0,
                        isOverridden: true,
                        notes: item.notes || null,
                    },
                });
            }
            return { success: true, count: overrides.length };
        });
    }
    async resetOverrides(partName, machineId, date) {
        const where = {};
        if (partName && partName.toUpperCase() !== 'ALL')
            where.partName = partName;
        if (machineId)
            where.machineId = machineId;
        if (date)
            where.date = new Date(date);
        const deleted = await prisma_1.default.dailyMachineRecord.deleteMany({ where });
        return { success: true, count: deleted.count };
    }
    async getDailyActualForm(dateStr, shift = 'ALL', partFilter) {
        const targetDate = new Date(dateStr);
        const machines = await this.getAllMachines(partFilter);
        const machineIds = machines.map((m) => m.id);
        const monthStr = (0, date_fns_1.format)(targetDate, 'yyyy-MM');
        const planRes = await this.getDailyPlan(monthStr, partFilter);
        const actualRecords = await prisma_1.default.actualMachineRecord.findMany({
            where: {
                machineId: { in: machineIds },
                date: targetDate,
                shift,
            },
        });
        const actualMap = new Map(actualRecords.map((a) => [a.machineId, a]));
        const rows = machines.map((machine) => {
            const planCell = planRes.matrix[machine.id]?.[dateStr] || {
                plannedLoadKg: 0,
                requiredHours: 0,
                availableHours: 0,
                shiftsCount: 1,
                utilizationPct: 0,
            };
            const actual = actualMap.get(machine.id);
            const isRecorded = Boolean(actual);
            const actualRunHours = actual ? Number(actual.actualRunHours) : 0;
            const actualOutputKg = actual ? (actual.actualOutputKg !== null ? Number(actual.actualOutputKg) : null) : null;
            const downtimeHours = actual ? Number(actual.downtimeHours) : 0;
            const downtimeBreakdownHours = actual ? Number(actual.downtimeBreakdownHours) : 0;
            const downtimeChangeoverHours = actual ? Number(actual.downtimeChangeoverHours) : 0;
            const downtimeCleaningHours = actual ? Number(actual.downtimeCleaningHours) : 0;
            const downtimeShortageHours = actual ? Number(actual.downtimeShortageHours) : 0;
            const downtimeOtherHours = actual ? Number(actual.downtimeOtherHours) : 0;
            const downtimeReason = actual?.downtimeReason || '';
            const notes = actual?.notes || '';
            const recordedBy = actual?.recordedBy || '';
            const plannedHours = planCell.requiredHours;
            const availableHours = planCell.availableHours;
            const plannedLoadKg = planCell.plannedLoadKg;
            const hourVariance = Math.round((actualRunHours - plannedHours) * 100) / 100;
            const actualSpeedKgHr = actualRunHours > 0 && actualOutputKg !== null
                ? Math.round((actualOutputKg / actualRunHours) * 10) / 10
                : null;
            let actualUtilizationPct = 0;
            if (availableHours > 0 && isRecorded) {
                actualUtilizationPct =
                    Math.round((actualRunHours / availableHours) * 1000) / 10;
            }
            let status = 'UNRECORDED';
            if (!isRecorded) {
                status = 'UNRECORDED';
            }
            else if (downtimeHours >= 2.0) {
                status = 'HIGH_DOWNTIME';
            }
            else if (actualUtilizationPct > 100) {
                status = 'OVERLOAD';
            }
            else {
                status = 'ON_TARGET';
            }
            return {
                machineId: machine.id,
                partName: machine.partName,
                machineCode: machine.machineCode,
                machineName: machine.machineName,
                machineType: machine.machineType,
                standardSpeedKgHr: machine.standardSpeedKgHr,
                plannedLoadKg,
                plannedHours,
                availableHours,
                shiftsCount: planCell.shiftsCount,
                isRecorded,
                actualRunHours,
                actualOutputKg,
                actualSpeedKgHr,
                downtimeHours,
                downtimeBreakdownHours,
                downtimeChangeoverHours,
                downtimeCleaningHours,
                downtimeShortageHours,
                downtimeOtherHours,
                downtimeReason,
                notes,
                recordedBy,
                hourVariance,
                actualUtilizationPct,
                status,
            };
        });
        const recordedRows = rows.filter((r) => r.isRecorded);
        const totalPlannedHours = rows.reduce((s, r) => s + r.plannedHours, 0);
        const totalActualHours = recordedRows.reduce((s, r) => s + r.actualRunHours, 0);
        const totalPlannedKg = rows.reduce((s, r) => s + r.plannedLoadKg, 0);
        const totalActualKg = recordedRows.reduce((s, r) => s + (r.actualOutputKg || 0), 0);
        const totalDowntimeHours = recordedRows.reduce((s, r) => s + r.downtimeHours, 0);
        const totalAvailableHours = rows.reduce((s, r) => s + r.availableHours, 0);
        const overallActualUtilization = totalAvailableHours > 0
            ? Math.round((totalActualHours / totalAvailableHours) * 1000) / 10
            : 0;
        return {
            partName: partFilter || 'ALL',
            date: dateStr,
            shift,
            summary: {
                totalPlannedHours: Math.round(totalPlannedHours * 10) / 10,
                totalActualHours: Math.round(totalActualHours * 10) / 10,
                hourVariance: Math.round((totalActualHours - totalPlannedHours) * 10) / 10,
                totalPlannedKg: Math.round(totalPlannedKg * 10) / 10,
                totalActualKg: Math.round(totalActualKg * 10) / 10,
                totalDowntimeHours: Math.round(totalDowntimeHours * 10) / 10,
                overallActualUtilization,
                isAllRecorded: rows.length > 0 && recordedRows.length === rows.length,
                isPartiallyRecorded: recordedRows.length > 0 && recordedRows.length < rows.length,
                recordedCount: recordedRows.length,
                totalCount: machines.length,
            },
            rows,
        };
    }
    async saveActualRecords(dto, partName) {
        const targetDate = new Date(dto.date);
        const shift = dto.shift || 'ALL';
        return prisma_1.default.$transaction(async (tx) => {
            for (const rec of dto.records) {
                const machine = await tx.machineMaster.findUnique({
                    where: { id: rec.machineId },
                });
                const assignedPart = machine?.partName || partName || 'BL';
                const totalDowntime = rec.downtimeHours !== undefined && rec.downtimeHours !== null
                    ? Number(rec.downtimeHours)
                    : Number(rec.downtimeBreakdownHours || 0) +
                        Number(rec.downtimeChangeoverHours || 0) +
                        Number(rec.downtimeCleaningHours || 0) +
                        Number(rec.downtimeShortageHours || 0) +
                        Number(rec.downtimeOtherHours || 0);
                await tx.actualMachineRecord.upsert({
                    where: {
                        partName_date_machineId_shift: {
                            partName: assignedPart,
                            date: targetDate,
                            machineId: rec.machineId,
                            shift,
                        },
                    },
                    update: {
                        actualRunHours: rec.actualRunHours,
                        actualOutputKg: rec.actualOutputKg !== undefined ? rec.actualOutputKg : null,
                        downtimeHours: totalDowntime,
                        downtimeBreakdownHours: rec.downtimeBreakdownHours || 0,
                        downtimeChangeoverHours: rec.downtimeChangeoverHours || 0,
                        downtimeCleaningHours: rec.downtimeCleaningHours || 0,
                        downtimeShortageHours: rec.downtimeShortageHours || 0,
                        downtimeOtherHours: rec.downtimeOtherHours || 0,
                        downtimeReason: rec.downtimeReason || null,
                        recordedBy: dto.recordedBy || null,
                        notes: rec.notes || null,
                    },
                    create: {
                        partName: assignedPart,
                        date: targetDate,
                        shift,
                        machineId: rec.machineId,
                        actualRunHours: rec.actualRunHours,
                        actualOutputKg: rec.actualOutputKg !== undefined ? rec.actualOutputKg : null,
                        downtimeHours: totalDowntime,
                        downtimeBreakdownHours: rec.downtimeBreakdownHours || 0,
                        downtimeChangeoverHours: rec.downtimeChangeoverHours || 0,
                        downtimeCleaningHours: rec.downtimeCleaningHours || 0,
                        downtimeShortageHours: rec.downtimeShortageHours || 0,
                        downtimeOtherHours: rec.downtimeOtherHours || 0,
                        downtimeReason: rec.downtimeReason || null,
                        recordedBy: dto.recordedBy || null,
                        notes: rec.notes || null,
                    },
                });
            }
            return { success: true, count: dto.records.length };
        });
    }
    async deleteActualRecords(date, shift = 'ALL', machineId, partName) {
        const where = {
            date: new Date(date),
            shift,
        };
        if (partName && partName.toUpperCase() !== 'ALL')
            where.partName = partName;
        if (machineId)
            where.machineId = machineId;
        const res = await prisma_1.default.actualMachineRecord.deleteMany({ where });
        return { success: true, count: res.count };
    }
    async getPlanVsActual(monthStr, shift = 'ALL', partFilter) {
        const targetDate = monthStr ? new Date(`${monthStr}-01`) : new Date();
        const monthStart = (0, date_fns_1.startOfMonth)(targetDate);
        const monthEnd = (0, date_fns_1.endOfMonth)(targetDate);
        const resolvedMonth = (0, date_fns_1.format)(targetDate, 'yyyy-MM');
        const planRes = await this.getDailyPlan(resolvedMonth, partFilter);
        const machines = planRes.machines;
        const days = planRes.days;
        const machineIds = machines.map((m) => m.id);
        const actuals = await prisma_1.default.actualMachineRecord.findMany({
            where: {
                machineId: { in: machineIds },
                date: { gte: monthStart, lte: monthEnd },
                shift,
            },
        });
        const actualMap = new Map();
        actuals.forEach((a) => {
            const dStr = (0, date_fns_1.format)(new Date(a.date), 'yyyy-MM-dd');
            actualMap.set(`${dStr}_${a.machineId}`, a);
        });
        const dailyTimeline = days.map((dStr) => {
            let dailyPlannedHours = 0;
            let dailyActualHours = null;
            let dailyAvailableHours = 0;
            let dailyPlannedKg = 0;
            let dailyActualKg = null;
            let dailyDowntimeHours = 0;
            let isRecordedDay = false;
            const machineItems = [];
            for (const machine of machines) {
                const pCell = planRes.matrix[machine.id]?.[dStr] || {
                    plannedLoadKg: 0,
                    requiredHours: 0,
                    availableHours: 0,
                };
                dailyPlannedHours += pCell.requiredHours;
                dailyAvailableHours += pCell.availableHours;
                dailyPlannedKg += pCell.plannedLoadKg;
                const actual = actualMap.get(`${dStr}_${machine.id}`);
                if (actual) {
                    isRecordedDay = true;
                    if (dailyActualHours === null)
                        dailyActualHours = 0;
                    dailyActualHours += Number(actual.actualRunHours);
                    if (actual.actualOutputKg !== null) {
                        if (dailyActualKg === null)
                            dailyActualKg = 0;
                        dailyActualKg += Number(actual.actualOutputKg);
                    }
                    dailyDowntimeHours += Number(actual.downtimeHours);
                }
                machineItems.push({
                    machineId: machine.id,
                    machineCode: machine.machineCode,
                    machineName: machine.machineName,
                    plannedHours: pCell.requiredHours,
                    actualHours: actual ? Number(actual.actualRunHours) : null,
                    plannedKg: pCell.plannedLoadKg,
                    actualKg: actual?.actualOutputKg !== null ? Number(actual?.actualOutputKg) : null,
                    downtimeHours: actual ? Number(actual.downtimeHours) : 0,
                    downtimeReason: actual?.downtimeReason || '',
                });
            }
            dailyPlannedHours = Math.round(dailyPlannedHours * 10) / 10;
            dailyAvailableHours = Math.round(dailyAvailableHours * 10) / 10;
            dailyPlannedKg = Math.round(dailyPlannedKg * 10) / 10;
            if (dailyActualHours !== null)
                dailyActualHours = Math.round(dailyActualHours * 10) / 10;
            if (dailyActualKg !== null)
                dailyActualKg = Math.round(dailyActualKg * 10) / 10;
            dailyDowntimeHours = Math.round(dailyDowntimeHours * 10) / 10;
            let plannedUtilization = 0;
            if (dailyAvailableHours > 0) {
                plannedUtilization =
                    Math.round((dailyPlannedHours / dailyAvailableHours) * 1000) / 10;
            }
            let actualUtilization = null;
            if (dailyAvailableHours > 0 && dailyActualHours !== null) {
                actualUtilization =
                    Math.round((dailyActualHours / dailyAvailableHours) * 1000) / 10;
            }
            let status = 'UNRECORDED';
            if (!isRecordedDay) {
                status = 'UNRECORDED';
            }
            else if (dailyDowntimeHours >= 3.0) {
                status = 'HIGH_DOWNTIME';
            }
            else if (actualUtilization && actualUtilization > 100) {
                status = 'OVERLOAD';
            }
            else {
                status = 'ON_TARGET';
            }
            return {
                date: dStr,
                isRecorded: isRecordedDay,
                plannedHours: dailyPlannedHours,
                actualHours: dailyActualHours,
                availableHours: dailyAvailableHours,
                hourVariance: dailyActualHours !== null
                    ? Math.round((dailyActualHours - dailyPlannedHours) * 10) / 10
                    : 0,
                plannedUtilization,
                actualUtilization,
                plannedKg: dailyPlannedKg,
                actualKg: dailyActualKg,
                downtimeHours: dailyDowntimeHours,
                status,
                machines: machineItems,
            };
        });
        const machineSummary = machines.map((machine) => {
            let totalPlannedHours = 0;
            let totalActualHours = 0;
            let totalAvailableHours = 0;
            let totalPlannedKg = 0;
            let totalActualKg = 0;
            let totalDowntimeHours = 0;
            let totalBreakdownHours = 0;
            let totalChangeoverHours = 0;
            let totalCleaningHours = 0;
            let totalShortageHours = 0;
            let recordedDays = 0;
            let overloadDays = 0;
            let highDowntimeDays = 0;
            days.forEach((dStr) => {
                const pCell = planRes.matrix[machine.id]?.[dStr] || {
                    plannedLoadKg: 0,
                    requiredHours: 0,
                    availableHours: 0,
                };
                totalPlannedHours += pCell.requiredHours;
                totalAvailableHours += pCell.availableHours;
                totalPlannedKg += pCell.plannedLoadKg;
                const actual = actualMap.get(`${dStr}_${machine.id}`);
                if (actual) {
                    recordedDays++;
                    totalActualHours += Number(actual.actualRunHours);
                    if (actual.actualOutputKg !== null) {
                        totalActualKg += Number(actual.actualOutputKg);
                    }
                    const dt = Number(actual.downtimeHours);
                    totalDowntimeHours += dt;
                    totalBreakdownHours += Number(actual.downtimeBreakdownHours || 0);
                    totalChangeoverHours += Number(actual.downtimeChangeoverHours || 0);
                    totalCleaningHours += Number(actual.downtimeCleaningHours || 0);
                    totalShortageHours += Number(actual.downtimeShortageHours || 0);
                    if (dt >= 1.5)
                        highDowntimeDays++;
                    const util = pCell.availableHours > 0
                        ? (Number(actual.actualRunHours) / pCell.availableHours) * 100
                        : 0;
                    if (util > 100)
                        overloadDays++;
                }
            });
            const avgPlannedUtil = totalAvailableHours > 0
                ? Math.round((totalPlannedHours / totalAvailableHours) * 1000) / 10
                : 0;
            const avgActualUtil = totalAvailableHours > 0 && recordedDays > 0
                ? Math.round((totalActualHours / totalAvailableHours) * 1000) / 10
                : 0;
            return {
                machineId: machine.id,
                partName: machine.partName,
                machineCode: machine.machineCode,
                machineName: machine.machineName,
                machineType: machine.machineType,
                totalPlannedHours: Math.round(totalPlannedHours * 10) / 10,
                totalActualHours: Math.round(totalActualHours * 10) / 10,
                hourVariance: Math.round((totalActualHours - totalPlannedHours) * 10) / 10,
                totalAvailableHours: Math.round(totalAvailableHours * 10) / 10,
                avgPlannedUtil,
                avgActualUtil,
                totalPlannedKg: Math.round(totalPlannedKg * 10) / 10,
                totalActualKg: Math.round(totalActualKg * 10) / 10,
                totalDowntimeHours: Math.round(totalDowntimeHours * 10) / 10,
                downtimeBreakdown: {
                    breakdown: Math.round(totalBreakdownHours * 10) / 10,
                    changeover: Math.round(totalChangeoverHours * 10) / 10,
                    cleaning: Math.round(totalCleaningHours * 10) / 10,
                    shortage: Math.round(totalShortageHours * 10) / 10,
                },
                recordedDays,
                overloadDays,
                highDowntimeDays,
            };
        });
        const recordedDaysList = dailyTimeline.filter((d) => d.isRecorded);
        const sumActualUtil = recordedDaysList.reduce((s, d) => s + (d.actualUtilization || 0), 0);
        const avgOverallActualUtil = recordedDaysList.length > 0
            ? Math.round((sumActualUtil / recordedDaysList.length) * 10) / 10
            : 0;
        const totalPlantDowntime = machineSummary.reduce((s, m) => s + m.totalDowntimeHours, 0);
        return {
            partName: partFilter || 'ALL',
            month: resolvedMonth,
            shift,
            summary: {
                totalPlannedHours: planRes.summary.totalPlannedHours,
                totalActualHours: machineSummary.reduce((s, m) => s + m.totalActualHours, 0),
                totalAvailableHours: planRes.summary.totalAvailableHours,
                avgPlannedUtilization: planRes.summary.avgDailyUtilization,
                avgActualUtilization: avgOverallActualUtil,
                totalPlannedKg: planRes.summary.totalPlannedKg,
                totalActualKg: machineSummary.reduce((s, m) => s + m.totalActualKg, 0),
                totalDowntimeHours: Math.round(totalPlantDowntime * 10) / 10,
                recordedDaysCount: recordedDaysList.length,
                totalDaysInMonth: days.length,
                overloadDaysCount: planRes.summary.overloadDaysCount,
                highDowntimeDaysCount: recordedDaysList.filter((d) => d.status === 'HIGH_DOWNTIME').length,
            },
            machines,
            machineSummary,
            dailyTimeline,
        };
    }
    async getWeeklyDefaults(partFilter) {
        const machines = await this.getAllMachines(partFilter);
        return machines.map((m) => ({
            machineId: m.id,
            machineCode: m.machineCode,
            machineName: m.machineName,
            shiftsCount: m.shiftsCount,
            weeklyDefaults: m.weeklyDefaults,
        }));
    }
    async saveWeeklyDefaults(dto) {
        return prisma_1.default.$transaction(async (tx) => {
            for (const item of dto.defaults) {
                await tx.machineMaster.update({
                    where: { id: item.machineId },
                    data: {
                        weeklyDefaults: JSON.stringify(item.weeklyDefaults),
                    },
                });
            }
            return { success: true };
        });
    }
};
exports.MachineCapacityService = MachineCapacityService;
exports.MachineCapacityService = MachineCapacityService = __decorate([
    (0, common_1.Injectable)()
], MachineCapacityService);
//# sourceMappingURL=machine-capacity.service.js.map