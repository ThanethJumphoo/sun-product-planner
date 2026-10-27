"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManpowerService = exports.BatchSaveActualManpowerDto = exports.SaveActualManpowerItemDto = exports.SaveManpowerOverrideDto = exports.SaveWeeklyDefaultsDto = exports.RoleWeeklyDefaultItemDto = exports.UpdateManpowerRoleDto = exports.CreateManpowerRoleDto = void 0;
const common_1 = require("@nestjs/common");
const date_fns_1 = require("date-fns");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const product_spec_service_1 = require("../master-data/product-spec/product-spec.service");
class CreateManpowerRoleDto {
    roleName;
    calculationType;
    defaultWorkers;
    weeklyDefaults;
    workingHoursPerShift;
    shiftsCount;
    machineType;
    standardSpeedKgHr;
    orderIndex;
}
exports.CreateManpowerRoleDto = CreateManpowerRoleDto;
class UpdateManpowerRoleDto {
    roleName;
    calculationType;
    defaultWorkers;
    weeklyDefaults;
    workingHoursPerShift;
    shiftsCount;
    machineType;
    standardSpeedKgHr;
    orderIndex;
}
exports.UpdateManpowerRoleDto = UpdateManpowerRoleDto;
class RoleWeeklyDefaultItemDto {
    roleId;
    weeklyDefaults;
}
exports.RoleWeeklyDefaultItemDto = RoleWeeklyDefaultItemDto;
class SaveWeeklyDefaultsDto {
    roles;
    month;
    applyToMonth;
    overrideExistingOverrides;
}
exports.SaveWeeklyDefaultsDto = SaveWeeklyDefaultsDto;
class SaveManpowerOverrideDto {
    date;
    roleId;
    actualWorkers;
    notes;
}
exports.SaveManpowerOverrideDto = SaveManpowerOverrideDto;
class SaveActualManpowerItemDto {
    roleId;
    presentWorkers;
    otWorkers;
    otHours;
    absentWorkers;
    borrowedWorkers;
    loanedWorkers;
    actualOutputKg;
    notes;
}
exports.SaveActualManpowerItemDto = SaveActualManpowerItemDto;
class BatchSaveActualManpowerDto {
    date;
    shift;
    recordedBy;
    records;
}
exports.BatchSaveActualManpowerDto = BatchSaveActualManpowerDto;
let ManpowerService = class ManpowerService {
    productSpecService;
    constructor(productSpecService) {
        this.productSpecService = productSpecService;
    }
    async getRolesForPart(partName) {
        let roles = await prisma_1.default.manpowerRole.findMany({
            where: { partName },
            orderBy: { orderIndex: 'asc' },
        });
        if (roles.length === 0) {
            roles = await this.seedDefaultRoles(partName);
        }
        return roles.map((r) => {
            let weeklyDefaults = null;
            if (r.weeklyDefaults) {
                try {
                    weeklyDefaults = JSON.parse(r.weeklyDefaults);
                }
                catch {
                    weeklyDefaults = null;
                }
            }
            return {
                id: r.id,
                partName: r.partName,
                roleName: r.roleName,
                calculationType: r.calculationType,
                defaultWorkers: Number(r.defaultWorkers),
                weeklyDefaults,
                workingHoursPerShift: Number(r.workingHoursPerShift),
                shiftsCount: r.shiftsCount,
                machineType: r.machineType || null,
                standardSpeedKgHr: r.standardSpeedKgHr ? Number(r.standardSpeedKgHr) : null,
                orderIndex: r.orderIndex,
            };
        });
    }
    async seedDefaultRoles(partName) {
        const defaultList = [];
        const upperPart = partName.toUpperCase();
        if (upperPart === 'FILLET') {
            defaultList.push({
                partName,
                roleName: 'คนตัดแต่งตามยอด Order (Cutting Workers)',
                calculationType: 'VARIABLE',
                defaultWorkers: 0,
                workingHoursPerShift: 10.0,
                shiftsCount: 1,
                standardSpeedKgHr: 45.0,
                orderIndex: 1,
            }, {
                partName,
                roleName: 'คนประจำสถานี & สนับสนุน (Station Workers)',
                calculationType: 'FIXED_OVERRIDE',
                defaultWorkers: 28.0,
                workingHoursPerShift: 10.0,
                shiftsCount: 1,
                orderIndex: 2,
            });
        }
        else if (upperPart === 'BIL') {
            defaultList.push({
                partName,
                roleName: 'คนตัดแต่ง BIL (BIL Cutting Staff P1/P2)',
                calculationType: 'VARIABLE',
                defaultWorkers: 0,
                workingHoursPerShift: 9.58,
                shiftsCount: 1,
                standardSpeedKgHr: 45.0,
                orderIndex: 1,
            }, {
                partName,
                roleName: 'คนคุมเครื่องจักร Toridas (Toridas Debone Operators)',
                calculationType: 'MACHINE',
                machineType: 'TORIDAS',
                defaultWorkers: 5.0,
                workingHoursPerShift: 9.58,
                shiftsCount: 2,
                orderIndex: 2,
            }, {
                partName,
                roleName: 'คนสายพานตัดแต่ง (Trimming Belt Workers)',
                calculationType: 'MACHINE',
                machineType: 'BELT',
                defaultWorkers: 7.0,
                workingHoursPerShift: 9.58,
                shiftsCount: 2,
                orderIndex: 3,
            }, {
                partName,
                roleName: 'คนประจำเครื่องเอ็กซเรย์ (X-Ray Inspection Workers)',
                calculationType: 'MACHINE',
                machineType: 'XRAY',
                defaultWorkers: 5.0,
                workingHoursPerShift: 9.58,
                shiftsCount: 2,
                orderIndex: 4,
            }, {
                partName,
                roleName: 'คนบริการ & ลำเลียง (BIL Service / Logistics)',
                calculationType: 'FIXED_OVERRIDE',
                defaultWorkers: 6.0,
                workingHoursPerShift: 8.0,
                shiftsCount: 1,
                orderIndex: 5,
            });
        }
        else if (upperPart === 'BL') {
            defaultList.push({
                partName,
                roleName: 'คนตัดแต่ง Manual (Manual Trimming Workers)',
                calculationType: 'VARIABLE',
                defaultWorkers: 0,
                workingHoursPerShift: 8.0,
                shiftsCount: 1,
                standardSpeedKgHr: 25.0,
                orderIndex: 1,
            }, {
                partName,
                roleName: 'คนคุมเครื่องจักร I-Cut (I-Cut Operators)',
                calculationType: 'MACHINE',
                machineType: 'ICUT',
                defaultWorkers: 2.0,
                workingHoursPerShift: 9.25,
                shiftsCount: 2,
                orderIndex: 2,
            }, {
                partName,
                roleName: 'คนบริการ & สนับสนุน (BL Service & Support)',
                calculationType: 'FIXED_OVERRIDE',
                defaultWorkers: 4.0,
                workingHoursPerShift: 8.0,
                shiftsCount: 1,
                orderIndex: 3,
            });
        }
        else {
            defaultList.push({
                partName,
                roleName: `คนตัดแต่ง ${partName} (Cutting Workers)`,
                calculationType: 'VARIABLE',
                defaultWorkers: 0,
                workingHoursPerShift: 10.0,
                shiftsCount: 1,
                standardSpeedKgHr: 45.0,
                orderIndex: 1,
            }, {
                partName,
                roleName: `คนประจำสถานี ${partName} (Station Workers)`,
                calculationType: 'FIXED_OVERRIDE',
                defaultWorkers: 28.0,
                workingHoursPerShift: 10.0,
                shiftsCount: 1,
                orderIndex: 2,
            });
        }
        const created = [];
        for (const d of defaultList) {
            const res = await prisma_1.default.manpowerRole.create({ data: d });
            created.push(res);
        }
        return created;
    }
    async createRole(partName, dto) {
        if (!dto.roleName?.trim()) {
            throw new common_1.BadRequestException('Role name is required.');
        }
        if (!dto.calculationType) {
            throw new common_1.BadRequestException('Calculation type is required.');
        }
        const maxOrder = await prisma_1.default.manpowerRole.aggregate({
            where: { partName },
            _max: { orderIndex: true },
        });
        const nextOrder = dto.orderIndex ?? (maxOrder._max.orderIndex || 0) + 1;
        return prisma_1.default.manpowerRole.create({
            data: {
                partName,
                roleName: dto.roleName.trim(),
                calculationType: dto.calculationType,
                defaultWorkers: dto.defaultWorkers ? Number(dto.defaultWorkers) : 0,
                weeklyDefaults: dto.weeklyDefaults
                    ? typeof dto.weeklyDefaults === 'string'
                        ? dto.weeklyDefaults
                        : JSON.stringify(dto.weeklyDefaults)
                    : null,
                workingHoursPerShift: dto.workingHoursPerShift ? Number(dto.workingHoursPerShift) : 8.0,
                shiftsCount: dto.shiftsCount ? Number(dto.shiftsCount) : 1,
                machineType: dto.machineType?.trim() || null,
                standardSpeedKgHr: dto.standardSpeedKgHr ? Number(dto.standardSpeedKgHr) : null,
                orderIndex: nextOrder,
            },
        });
    }
    async updateRole(id, dto) {
        const existing = await prisma_1.default.manpowerRole.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Role ${id} not found.`);
        }
        return prisma_1.default.manpowerRole.update({
            where: { id },
            data: {
                roleName: dto.roleName !== undefined ? dto.roleName.trim() : undefined,
                calculationType: dto.calculationType || undefined,
                defaultWorkers: dto.defaultWorkers !== undefined ? Number(dto.defaultWorkers) : undefined,
                weeklyDefaults: dto.weeklyDefaults !== undefined
                    ? typeof dto.weeklyDefaults === 'string'
                        ? dto.weeklyDefaults
                        : JSON.stringify(dto.weeklyDefaults)
                    : undefined,
                workingHoursPerShift: dto.workingHoursPerShift !== undefined ? Number(dto.workingHoursPerShift) : undefined,
                shiftsCount: dto.shiftsCount !== undefined ? Number(dto.shiftsCount) : undefined,
                machineType: dto.machineType !== undefined ? dto.machineType?.trim() || null : undefined,
                standardSpeedKgHr: dto.standardSpeedKgHr !== undefined ? (dto.standardSpeedKgHr ? Number(dto.standardSpeedKgHr) : null) : undefined,
                orderIndex: dto.orderIndex !== undefined ? Number(dto.orderIndex) : undefined,
            },
        });
    }
    async deleteRole(id) {
        const existing = await prisma_1.default.manpowerRole.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Role ${id} not found.`);
        }
        return prisma_1.default.manpowerRole.delete({ where: { id } });
    }
    async getDailyPlan(partName, monthStr) {
        const targetDate = monthStr ? new Date(`${monthStr}-01`) : new Date();
        const monthStart = (0, date_fns_1.startOfMonth)(targetDate);
        const monthEnd = (0, date_fns_1.endOfMonth)(targetDate);
        const roles = await this.getRolesForPart(partName);
        const mpsPlans = await prisma_1.default.mpsProductionTransaction.findMany({
            where: {
                partName,
                planDate: { gte: monthStart, lte: monthEnd },
            },
        });
        const itemCodes = Array.from(new Set(mpsPlans.map((p) => p.itemCode)));
        const specs = await prisma_1.default.productSpec.findMany({
            where: { erpItemCode: { in: itemCodes } },
        });
        const specMap = new Map(specs.map((s) => [s.erpItemCode, s]));
        const savedOverrides = await prisma_1.default.dailyManpowerRecord.findMany({
            where: {
                partName,
                date: { gte: monthStart, lte: monthEnd },
            },
        });
        const overrideMap = new Map();
        savedOverrides.forEach((o) => {
            const dKey = `${(0, date_fns_1.format)(new Date(o.date), 'yyyy-MM-dd')}_${o.roleId}`;
            overrideMap.set(dKey, o);
        });
        const daysInterval = (0, date_fns_1.eachDayOfInterval)({ start: monthStart, end: monthEnd });
        const days = daysInterval.map((d) => (0, date_fns_1.format)(d, 'yyyy-MM-dd'));
        const plansByDate = {};
        const totalQtyByDate = {};
        days.forEach((dStr) => {
            plansByDate[dStr] = [];
            totalQtyByDate[dStr] = 0;
        });
        mpsPlans.forEach((p) => {
            const dStr = (0, date_fns_1.format)(new Date(p.planDate), 'yyyy-MM-dd');
            if (plansByDate[dStr]) {
                plansByDate[dStr].push(p);
                totalQtyByDate[dStr] += Number(p.plannedQty || 0);
            }
        });
        const matrix = {};
        const dailyTotalCalculated = {};
        const dailyTotalActual = {};
        days.forEach((dStr) => {
            dailyTotalCalculated[dStr] = 0;
            dailyTotalActual[dStr] = 0;
        });
        for (const role of roles) {
            matrix[role.id] = {};
            for (const dStr of days) {
                const plansToday = plansByDate[dStr] || [];
                const totalKgToday = totalQtyByDate[dStr] || 0;
                let calculatedWorkers = 0;
                if (role.calculationType === 'VARIABLE') {
                    const workHours = role.workingHoursPerShift && Number(role.workingHoursPerShift) > 0
                        ? Number(role.workingHoursPerShift)
                        : 10.0;
                    let totalHoursNeeded = 0;
                    if (plansToday.length > 0) {
                        for (const p of plansToday) {
                            const spec = specMap.get(p.itemCode);
                            const speed = spec?.manSpeed && Number(spec.manSpeed) > 0
                                ? Number(spec.manSpeed)
                                : role.standardSpeedKgHr && Number(role.standardSpeedKgHr) > 0
                                    ? Number(role.standardSpeedKgHr)
                                    : 45.0;
                            const plannedQty = Number(p.plannedQty || 0);
                            const hoursForItem = plannedQty / speed;
                            totalHoursNeeded += hoursForItem;
                        }
                        calculatedWorkers = Math.ceil(totalHoursNeeded / workHours);
                    }
                    else if (totalKgToday > 0) {
                        const speed = role.standardSpeedKgHr && Number(role.standardSpeedKgHr) > 0
                            ? Number(role.standardSpeedKgHr)
                            : 45.0;
                        calculatedWorkers = Math.ceil((totalKgToday / speed) / workHours);
                    }
                    else {
                        calculatedWorkers = 0;
                    }
                }
                else if (role.calculationType === 'MACHINE') {
                    const isMachineActive = totalKgToday > 0;
                    if (isMachineActive) {
                        const dayOfWeek = (0, date_fns_1.parseISO)(dStr).getDay();
                        let baseWorkers = Number(role.defaultWorkers || 1);
                        if (role.weeklyDefaults && role.weeklyDefaults[dayOfWeek] !== undefined) {
                            baseWorkers = Number(role.weeklyDefaults[dayOfWeek]);
                        }
                        calculatedWorkers = Math.ceil(baseWorkers * (role.shiftsCount || 1));
                    }
                    else {
                        calculatedWorkers = 0;
                    }
                }
                else {
                    const dayOfWeek = (0, date_fns_1.parseISO)(dStr).getDay();
                    const hasExplicitWeekly = role.weeklyDefaults && role.weeklyDefaults[dayOfWeek] !== undefined;
                    if (hasExplicitWeekly) {
                        const baseWorkers = Number(role.weeklyDefaults[dayOfWeek]);
                        calculatedWorkers = Math.round(baseWorkers * (role.shiftsCount || 1));
                    }
                    else if (totalKgToday <= 0 && plansToday.length === 0) {
                        calculatedWorkers = 0;
                    }
                    else {
                        calculatedWorkers = Math.round((role.defaultWorkers || 0) * (role.shiftsCount || 1));
                    }
                }
                const overrideKey = `${dStr}_${role.id}`;
                const existingOverride = overrideMap.get(overrideKey);
                const actualWorkers = existingOverride?.isOverridden
                    ? Number(existingOverride.actualWorkers)
                    : calculatedWorkers;
                const isOverridden = !!existingOverride?.isOverridden;
                const notes = existingOverride?.notes || '';
                matrix[role.id][dStr] = {
                    date: dStr,
                    roleId: role.id,
                    calculatedWorkers,
                    actualWorkers,
                    isOverridden,
                    notes,
                    plannedQtyKg: totalKgToday,
                };
                dailyTotalCalculated[dStr] += calculatedWorkers;
                dailyTotalActual[dStr] += actualWorkers;
            }
        }
        const totalWorkingDays = days.filter((d) => (totalQtyByDate[d] || 0) > 0).length || days.length;
        const avgDailyWorkers = Math.round((days.reduce((sum, d) => sum + dailyTotalActual[d], 0) / (totalWorkingDays || 1)) * 10) / 10;
        const peakWorkers = Math.max(...days.map((d) => dailyTotalActual[d]), 0);
        return {
            partName,
            month: monthStr || (0, date_fns_1.format)(new Date(), 'yyyy-MM'),
            days,
            roles,
            matrix,
            dailyTotals: {
                calculated: dailyTotalCalculated,
                actual: dailyTotalActual,
                plannedQtyKg: totalQtyByDate,
            },
            summary: {
                avgDailyWorkers,
                peakWorkers,
                totalWorkingDays,
                totalPlannedQtyKg: days.reduce((sum, d) => sum + (totalQtyByDate[d] || 0), 0),
                rolesCount: roles.length,
            },
        };
    }
    async saveOverrides(partName, overrides) {
        return prisma_1.default.$transaction(async (tx) => {
            const results = [];
            for (const item of overrides) {
                const dateObj = new Date(item.date);
                const record = await tx.dailyManpowerRecord.upsert({
                    where: {
                        partName_date_roleId: {
                            partName,
                            date: dateObj,
                            roleId: Number(item.roleId),
                        },
                    },
                    update: {
                        actualWorkers: Number(item.actualWorkers),
                        isOverridden: true,
                        notes: item.notes?.trim() || null,
                    },
                    create: {
                        partName,
                        date: dateObj,
                        roleId: Number(item.roleId),
                        actualWorkers: Number(item.actualWorkers),
                        isOverridden: true,
                        notes: item.notes?.trim() || null,
                    },
                });
                results.push(record);
            }
            return results;
        });
    }
    async resetOverrides(partName, roleId, date) {
        const whereClause = { partName };
        if (roleId)
            whereClause.roleId = Number(roleId);
        if (date)
            whereClause.date = new Date(date);
        return prisma_1.default.dailyManpowerRecord.deleteMany({
            where: whereClause,
        });
    }
    async getWeeklyDefaults(partName) {
        const roles = await this.getRolesForPart(partName);
        return roles.map((r) => {
            const defaultVal = Number(r.defaultWorkers || 0);
            const defaults = r.weeklyDefaults || {
                0: defaultVal,
                1: defaultVal,
                2: defaultVal,
                3: defaultVal,
                4: defaultVal,
                5: defaultVal,
                6: defaultVal,
            };
            return {
                roleId: r.id,
                roleName: r.roleName,
                calculationType: r.calculationType,
                defaultWorkers: defaultVal,
                weeklyDefaults: defaults,
                workingHoursPerShift: r.workingHoursPerShift,
                shiftsCount: r.shiftsCount,
                machineType: r.machineType,
                orderIndex: r.orderIndex,
            };
        });
    }
    async saveWeeklyDefaults(partName, dto) {
        if (!dto.roles || !Array.isArray(dto.roles)) {
            throw new common_1.BadRequestException('Roles array is required.');
        }
        return prisma_1.default.$transaction(async (tx) => {
            const updatedRoles = [];
            for (const item of dto.roles) {
                const weeklyDefaultsStr = typeof item.weeklyDefaults === 'string'
                    ? item.weeklyDefaults
                    : JSON.stringify(item.weeklyDefaults);
                let primaryDefault = 0;
                if (typeof item.weeklyDefaults === 'object' && item.weeklyDefaults !== null) {
                    primaryDefault = Number(item.weeklyDefaults[1] ?? item.weeklyDefaults[2] ?? 0);
                }
                const role = await tx.manpowerRole.update({
                    where: { id: Number(item.roleId) },
                    data: {
                        weeklyDefaults: weeklyDefaultsStr,
                        ...(primaryDefault > 0 ? { defaultWorkers: primaryDefault } : {}),
                    },
                });
                updatedRoles.push(role);
            }
            if (dto.applyToMonth && dto.month) {
                const targetDate = new Date(`${dto.month}-01`);
                const monthStart = (0, date_fns_1.startOfMonth)(targetDate);
                const monthEnd = (0, date_fns_1.endOfMonth)(targetDate);
                if (dto.overrideExistingOverrides) {
                    const roleIds = dto.roles.map((r) => Number(r.roleId));
                    await tx.dailyManpowerRecord.deleteMany({
                        where: {
                            partName,
                            roleId: { in: roleIds },
                            date: { gte: monthStart, lte: monthEnd },
                        },
                    });
                }
            }
            return updatedRoles;
        });
    }
    async getActualRecords(partName, dateStr, monthStr, shift = 'ALL') {
        const whereClause = { partName };
        if (dateStr) {
            whereClause.date = new Date(dateStr);
        }
        else if (monthStr) {
            const targetDate = new Date(`${monthStr}-01`);
            whereClause.date = {
                gte: (0, date_fns_1.startOfMonth)(targetDate),
                lte: (0, date_fns_1.endOfMonth)(targetDate),
            };
        }
        if (shift && shift !== 'ALL') {
            whereClause.shift = shift;
        }
        const records = await prisma_1.default.actualManpowerRecord.findMany({
            where: whereClause,
            include: {
                role: true,
            },
            orderBy: [{ date: 'asc' }, { roleId: 'asc' }],
        });
        return records.map((r) => ({
            id: r.id,
            partName: r.partName,
            date: (0, date_fns_1.format)(new Date(r.date), 'yyyy-MM-dd'),
            shift: r.shift,
            roleId: r.roleId,
            roleName: r.role?.roleName || `Role #${r.roleId}`,
            calculationType: r.role?.calculationType || 'VARIABLE',
            presentWorkers: Number(r.presentWorkers),
            otWorkers: Number(r.otWorkers),
            otHours: Number(r.otHours),
            absentWorkers: Number(r.absentWorkers),
            borrowedWorkers: Number(r.borrowedWorkers),
            loanedWorkers: Number(r.loanedWorkers),
            actualOutputKg: r.actualOutputKg ? Number(r.actualOutputKg) : null,
            notes: r.notes || '',
            recordedBy: r.recordedBy || '',
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
        }));
    }
    async getDailyActualForm(partName, dateStr, shift = 'ALL') {
        const targetDate = dateStr ? new Date(dateStr) : new Date();
        const dStr = (0, date_fns_1.format)(targetDate, 'yyyy-MM-dd');
        const monthStr = (0, date_fns_1.format)(targetDate, 'yyyy-MM');
        const dailyPlan = await this.getDailyPlan(partName, monthStr);
        const roles = dailyPlan.roles;
        const whereClause = {
            partName,
            date: targetDate,
        };
        if (shift && shift !== 'ALL') {
            whereClause.shift = shift;
        }
        const existingRecords = await prisma_1.default.actualManpowerRecord.findMany({
            where: whereClause,
            include: { role: true },
        });
        const recordMap = new Map();
        existingRecords.forEach((r) => {
            recordMap.set(r.roleId, r);
        });
        let totalPlannedWorkers = 0;
        let totalActualWorkers = 0;
        let totalAbsentWorkers = 0;
        let totalOtWorkers = 0;
        let totalOtHours = 0;
        let totalBorrowedWorkers = 0;
        let totalLoanedWorkers = 0;
        let recordedRolesCount = 0;
        const rows = roles.map((role) => {
            const planCell = dailyPlan.matrix[role.id]?.[dStr];
            const plannedWorkers = planCell?.actualWorkers || 0;
            const plannedQtyKg = planCell?.plannedQtyKg || 0;
            const calculatedWorkers = planCell?.calculatedWorkers || 0;
            totalPlannedWorkers += plannedWorkers;
            const actual = recordMap.get(role.id);
            const isRecorded = !!actual;
            const presentWorkers = actual ? Number(actual.presentWorkers) : 0;
            const otWorkers = actual ? Number(actual.otWorkers) : 0;
            const otHours = actual ? Number(actual.otHours) : 0;
            const absentWorkers = actual ? Number(actual.absentWorkers) : 0;
            const borrowedWorkers = actual ? Number(actual.borrowedWorkers) : 0;
            const loanedWorkers = actual ? Number(actual.loanedWorkers) : 0;
            const actualOutputKg = actual?.actualOutputKg ? Number(actual.actualOutputKg) : null;
            const notes = actual?.notes || '';
            const recordedBy = actual?.recordedBy || '';
            if (isRecorded) {
                recordedRolesCount += 1;
                totalActualWorkers += presentWorkers;
                totalAbsentWorkers += absentWorkers;
                totalOtWorkers += otWorkers;
                totalOtHours += otHours;
                totalBorrowedWorkers += borrowedWorkers;
                totalLoanedWorkers += loanedWorkers;
            }
            const variance = isRecorded ? presentWorkers - plannedWorkers : 0;
            let status = 'UNRECORDED';
            if (isRecorded) {
                if (presentWorkers === plannedWorkers)
                    status = 'ON_TARGET';
                else if (presentWorkers < plannedWorkers)
                    status = 'SHORTAGE';
                else
                    status = 'SURPLUS';
            }
            return {
                roleId: role.id,
                roleName: role.roleName,
                calculationType: role.calculationType,
                machineType: role.machineType,
                workingHoursPerShift: role.workingHoursPerShift,
                shiftsCount: role.shiftsCount,
                calculatedWorkers,
                plannedWorkers,
                plannedQtyKg,
                isRecorded,
                presentWorkers: isRecorded ? presentWorkers : plannedWorkers,
                actualRecordedWorkers: isRecorded ? presentWorkers : null,
                otWorkers,
                otHours,
                absentWorkers,
                borrowedWorkers,
                loanedWorkers,
                actualOutputKg,
                notes,
                recordedBy,
                variance,
                status,
            };
        });
        const isAllRecorded = recordedRolesCount > 0 && recordedRolesCount === roles.length;
        const isPartiallyRecorded = recordedRolesCount > 0 && recordedRolesCount < roles.length;
        return {
            partName,
            date: dStr,
            shift,
            summary: {
                totalPlannedWorkers,
                totalActualWorkers: recordedRolesCount > 0 ? totalActualWorkers : 0,
                netVariance: recordedRolesCount > 0 ? totalActualWorkers - totalPlannedWorkers : 0,
                totalAbsentWorkers,
                totalOtWorkers,
                totalOtHours,
                totalBorrowedWorkers,
                totalLoanedWorkers,
                totalPlannedQtyKg: dailyPlan.dailyTotals.plannedQtyKg[dStr] || 0,
                isAllRecorded,
                isPartiallyRecorded,
                recordedRolesCount,
                totalRolesCount: roles.length,
            },
            rows,
        };
    }
    async saveActualRecords(partName, dto) {
        if (!dto.date) {
            throw new common_1.BadRequestException('Date is required for actual records.');
        }
        if (!dto.records || !Array.isArray(dto.records) || dto.records.length === 0) {
            throw new common_1.BadRequestException('Records array is required.');
        }
        const targetDate = new Date(dto.date);
        const shift = dto.shift || 'ALL';
        return prisma_1.default.$transaction(async (tx) => {
            const results = [];
            for (const item of dto.records) {
                const record = await tx.actualManpowerRecord.upsert({
                    where: {
                        partName_date_roleId_shift: {
                            partName,
                            date: targetDate,
                            roleId: Number(item.roleId),
                            shift,
                        },
                    },
                    update: {
                        presentWorkers: Number(item.presentWorkers || 0),
                        otWorkers: Number(item.otWorkers || 0),
                        otHours: Number(item.otHours || 0),
                        absentWorkers: Number(item.absentWorkers || 0),
                        borrowedWorkers: Number(item.borrowedWorkers || 0),
                        loanedWorkers: Number(item.loanedWorkers || 0),
                        actualOutputKg: item.actualOutputKg !== undefined && item.actualOutputKg !== null
                            ? Number(item.actualOutputKg)
                            : null,
                        notes: item.notes?.trim() || null,
                        recordedBy: dto.recordedBy?.trim() || null,
                    },
                    create: {
                        partName,
                        date: targetDate,
                        shift,
                        roleId: Number(item.roleId),
                        presentWorkers: Number(item.presentWorkers || 0),
                        otWorkers: Number(item.otWorkers || 0),
                        otHours: Number(item.otHours || 0),
                        absentWorkers: Number(item.absentWorkers || 0),
                        borrowedWorkers: Number(item.borrowedWorkers || 0),
                        loanedWorkers: Number(item.loanedWorkers || 0),
                        actualOutputKg: item.actualOutputKg !== undefined && item.actualOutputKg !== null
                            ? Number(item.actualOutputKg)
                            : null,
                        notes: item.notes?.trim() || null,
                        recordedBy: dto.recordedBy?.trim() || null,
                    },
                });
                results.push(record);
            }
            return results;
        });
    }
    async deleteActualRecords(partName, dateStr, shift, roleId) {
        const whereClause = {
            partName,
            date: new Date(dateStr),
        };
        if (shift && shift !== 'ALL') {
            whereClause.shift = shift;
        }
        if (roleId) {
            whereClause.roleId = Number(roleId);
        }
        return prisma_1.default.actualManpowerRecord.deleteMany({
            where: whereClause,
        });
    }
    async getPlanVsActual(partName, monthStr, shift = 'ALL') {
        const targetDate = monthStr ? new Date(`${monthStr}-01`) : new Date();
        const monthStart = (0, date_fns_1.startOfMonth)(targetDate);
        const monthEnd = (0, date_fns_1.endOfMonth)(targetDate);
        const currentMonthStr = monthStr || (0, date_fns_1.format)(new Date(), 'yyyy-MM');
        const dailyPlan = await this.getDailyPlan(partName, currentMonthStr);
        const { days, roles, matrix, dailyTotals } = dailyPlan;
        const whereClause = {
            partName,
            date: { gte: monthStart, lte: monthEnd },
        };
        if (shift && shift !== 'ALL') {
            whereClause.shift = shift;
        }
        const actualRecords = await prisma_1.default.actualManpowerRecord.findMany({
            where: whereClause,
            include: { role: true },
            orderBy: [{ date: 'asc' }, { roleId: 'asc' }],
        });
        const actualMap = new Map();
        const recordedDatesSet = new Set();
        actualRecords.forEach((r) => {
            const dStr = (0, date_fns_1.format)(new Date(r.date), 'yyyy-MM-dd');
            const key = `${dStr}_${r.roleId}`;
            recordedDatesSet.add(dStr);
            const existing = actualMap.get(key);
            if (existing) {
                existing.presentWorkers += Number(r.presentWorkers);
                existing.otWorkers += Number(r.otWorkers);
                existing.otHours += Number(r.otHours);
                existing.absentWorkers += Number(r.absentWorkers);
                existing.borrowedWorkers += Number(r.borrowedWorkers);
                existing.loanedWorkers += Number(r.loanedWorkers);
                if (r.actualOutputKg) {
                    existing.actualOutputKg = (existing.actualOutputKg || 0) + Number(r.actualOutputKg);
                }
            }
            else {
                actualMap.set(key, {
                    presentWorkers: Number(r.presentWorkers),
                    otWorkers: Number(r.otWorkers),
                    otHours: Number(r.otHours),
                    absentWorkers: Number(r.absentWorkers),
                    borrowedWorkers: Number(r.borrowedWorkers),
                    loanedWorkers: Number(r.loanedWorkers),
                    actualOutputKg: r.actualOutputKg ? Number(r.actualOutputKg) : null,
                    notes: r.notes || '',
                    recordedBy: r.recordedBy || '',
                });
            }
        });
        const roleStats = {};
        roles.forEach((r) => {
            roleStats[r.id] = {
                roleId: r.id,
                roleName: r.roleName,
                calculationType: r.calculationType,
                totalPlanned: 0,
                totalActual: 0,
                netVariance: 0,
                shortageDays: 0,
                surplusDays: 0,
                onTargetDays: 0,
                recordedDays: 0,
                totalOtWorkers: 0,
                totalAbsentWorkers: 0,
            };
        });
        const dailyTimeline = [];
        let monthlyTotalPlanned = 0;
        let monthlyTotalActual = 0;
        let monthlyTotalOtWorkers = 0;
        let monthlyTotalOtHours = 0;
        let monthlyTotalAbsent = 0;
        let monthlyTotalBorrowed = 0;
        let monthlyTotalLoaned = 0;
        let shortageDaysCount = 0;
        let surplusDaysCount = 0;
        let onTargetDaysCount = 0;
        days.forEach((dStr) => {
            const isRecorded = recordedDatesSet.has(dStr);
            const plannedWorkersToday = dailyTotals.actual[dStr] || 0;
            const plannedQtyKg = dailyTotals.plannedQtyKg[dStr] || 0;
            let actualWorkersToday = 0;
            let otWorkersToday = 0;
            let otHoursToday = 0;
            let absentWorkersToday = 0;
            let borrowedToday = 0;
            let loanedToday = 0;
            let actualOutputKgToday = 0;
            const roleDetails = [];
            roles.forEach((r) => {
                const plannedRoleWorkers = matrix[r.id]?.[dStr]?.actualWorkers || 0;
                const key = `${dStr}_${r.id}`;
                const actualItem = actualMap.get(key);
                const presentRole = actualItem ? actualItem.presentWorkers : 0;
                const otRole = actualItem ? actualItem.otWorkers : 0;
                const otHoursRole = actualItem ? actualItem.otHours : 0;
                const absentRole = actualItem ? actualItem.absentWorkers : 0;
                const borrowedRole = actualItem ? actualItem.borrowedWorkers : 0;
                const loanedRole = actualItem ? actualItem.loanedWorkers : 0;
                const outputRole = actualItem?.actualOutputKg || 0;
                if (isRecorded) {
                    actualWorkersToday += presentRole;
                    otWorkersToday += otRole;
                    otHoursToday += otHoursRole;
                    absentWorkersToday += absentRole;
                    borrowedToday += borrowedRole;
                    loanedToday += loanedRole;
                    actualOutputKgToday += outputRole;
                    roleStats[r.id].totalActual += presentRole;
                    roleStats[r.id].totalOtWorkers += otRole;
                    roleStats[r.id].totalAbsentWorkers += absentRole;
                    roleStats[r.id].recordedDays += 1;
                    if (presentRole === plannedRoleWorkers) {
                        roleStats[r.id].onTargetDays += 1;
                    }
                    else if (presentRole < plannedRoleWorkers) {
                        roleStats[r.id].shortageDays += 1;
                    }
                    else {
                        roleStats[r.id].surplusDays += 1;
                    }
                }
                roleStats[r.id].totalPlanned += plannedRoleWorkers;
                const roleVariance = isRecorded ? presentRole - plannedRoleWorkers : 0;
                let roleStatus = 'UNRECORDED';
                if (isRecorded) {
                    if (presentRole === plannedRoleWorkers)
                        roleStatus = 'ON_TARGET';
                    else if (presentRole < plannedRoleWorkers)
                        roleStatus = 'SHORTAGE';
                    else
                        roleStatus = 'SURPLUS';
                }
                roleDetails.push({
                    roleId: r.id,
                    roleName: r.roleName,
                    calculationType: r.calculationType,
                    plannedWorkers: plannedRoleWorkers,
                    presentWorkers: isRecorded ? presentRole : null,
                    otWorkers: otRole,
                    absentWorkers: absentRole,
                    variance: roleVariance,
                    status: roleStatus,
                    notes: actualItem?.notes || '',
                });
            });
            monthlyTotalPlanned += plannedWorkersToday;
            if (isRecorded) {
                monthlyTotalActual += actualWorkersToday;
                monthlyTotalOtWorkers += otWorkersToday;
                monthlyTotalOtHours += otHoursToday;
                monthlyTotalAbsent += absentWorkersToday;
                monthlyTotalBorrowed += borrowedToday;
                monthlyTotalLoaned += loanedToday;
                if (actualWorkersToday === plannedWorkersToday) {
                    onTargetDaysCount += 1;
                }
                else if (actualWorkersToday < plannedWorkersToday) {
                    shortageDaysCount += 1;
                }
                else {
                    surplusDaysCount += 1;
                }
            }
            const dailyVariance = isRecorded ? actualWorkersToday - plannedWorkersToday : 0;
            const fulfillmentRate = plannedWorkersToday > 0 && isRecorded
                ? Math.round((actualWorkersToday / plannedWorkersToday) * 1000) / 10
                : isRecorded
                    ? 100
                    : null;
            let dailyStatus = 'UNRECORDED';
            if (isRecorded) {
                if (actualWorkersToday === plannedWorkersToday)
                    dailyStatus = 'ON_TARGET';
                else if (actualWorkersToday < plannedWorkersToday)
                    dailyStatus = 'SHORTAGE';
                else
                    dailyStatus = 'SURPLUS';
            }
            dailyTimeline.push({
                date: dStr,
                isRecorded,
                plannedWorkers: plannedWorkersToday,
                actualWorkers: isRecorded ? actualWorkersToday : null,
                variance: dailyVariance,
                fulfillmentRate,
                status: dailyStatus,
                plannedQtyKg,
                actualOutputKg: actualOutputKgToday > 0 ? actualOutputKgToday : null,
                otWorkers: otWorkersToday,
                otHours: otHoursToday,
                absentWorkers: absentWorkersToday,
                borrowedWorkers: borrowedToday,
                loanedWorkers: loanedToday,
                roles: roleDetails,
            });
        });
        Object.values(roleStats).forEach((rs) => {
            rs.netVariance = rs.totalActual - rs.totalPlanned;
        });
        const recordedDaysCount = recordedDatesSet.size;
        const netVariance = recordedDaysCount > 0 ? monthlyTotalActual - monthlyTotalPlanned : 0;
        const avgFulfillmentRate = monthlyTotalPlanned > 0 && recordedDaysCount > 0
            ? Math.round((monthlyTotalActual / monthlyTotalPlanned) * 1000) / 10
            : null;
        return {
            partName,
            month: currentMonthStr,
            shift,
            summary: {
                totalPlannedWorkers: monthlyTotalPlanned,
                totalActualWorkers: monthlyTotalActual,
                netVariance,
                avgFulfillmentRate,
                recordedDaysCount,
                totalDaysInMonth: days.length,
                shortageDaysCount,
                surplusDaysCount,
                onTargetDaysCount,
                totalOtWorkers: monthlyTotalOtWorkers,
                totalOtHours: Math.round(monthlyTotalOtHours * 10) / 10,
                totalAbsentWorkers: monthlyTotalAbsent,
                totalBorrowedWorkers: monthlyTotalBorrowed,
                totalLoanedWorkers: monthlyTotalLoaned,
            },
            roles,
            roleSummary: Object.values(roleStats),
            dailyTimeline,
        };
    }
};
exports.ManpowerService = ManpowerService;
exports.ManpowerService = ManpowerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [product_spec_service_1.ProductSpecService])
], ManpowerService);
//# sourceMappingURL=manpower.service.js.map