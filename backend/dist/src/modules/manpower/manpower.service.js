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
exports.ManpowerService = exports.SaveManpowerOverrideDto = exports.UpdateManpowerRoleDto = exports.CreateManpowerRoleDto = void 0;
const common_1 = require("@nestjs/common");
const date_fns_1 = require("date-fns");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const product_spec_service_1 = require("../master-data/product-spec/product-spec.service");
class CreateManpowerRoleDto {
    roleName;
    calculationType;
    defaultWorkers;
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
    workingHoursPerShift;
    shiftsCount;
    machineType;
    standardSpeedKgHr;
    orderIndex;
}
exports.UpdateManpowerRoleDto = UpdateManpowerRoleDto;
class SaveManpowerOverrideDto {
    date;
    roleId;
    actualWorkers;
    notes;
}
exports.SaveManpowerOverrideDto = SaveManpowerOverrideDto;
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
        return roles.map((r) => ({
            id: r.id,
            partName: r.partName,
            roleName: r.roleName,
            calculationType: r.calculationType,
            defaultWorkers: Number(r.defaultWorkers),
            workingHoursPerShift: Number(r.workingHoursPerShift),
            shiftsCount: r.shiftsCount,
            machineType: r.machineType || null,
            standardSpeedKgHr: r.standardSpeedKgHr ? Number(r.standardSpeedKgHr) : null,
            orderIndex: r.orderIndex,
        }));
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
                        calculatedWorkers = Math.ceil((role.defaultWorkers || 1) * (role.shiftsCount || 1));
                    }
                    else {
                        calculatedWorkers = 0;
                    }
                }
                else {
                    if (totalKgToday <= 0 && plansToday.length === 0) {
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
};
exports.ManpowerService = ManpowerService;
exports.ManpowerService = ManpowerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [product_spec_service_1.ProductSpecService])
], ManpowerService);
//# sourceMappingURL=manpower.service.js.map