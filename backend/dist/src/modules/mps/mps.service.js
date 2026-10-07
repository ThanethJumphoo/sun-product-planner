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
exports.MpsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const autoGeneratePlan_1 = require("./utils/autoGeneratePlan");
let MpsService = class MpsService {
    async saveMpsSupply(partName, payload) {
        const result = await prisma_1.default.$transaction(payload.map((item) => prisma_1.default.mpsSupply.upsert({
            where: {
                partName_planDate: {
                    partName: partName,
                    planDate: new Date(item.date),
                },
            },
            update: {
                supplyWeight: item.weight,
            },
            create: {
                partName: partName,
                planDate: new Date(item.date),
                supplyWeight: item.weight,
            },
        })));
        return { success: true, count: result.length };
    }
    async getMpsSupply(partName, startDate, endDate) {
        const supplies = await prisma_1.default.mpsSupply.findMany({
            where: {
                partName: partName,
                planDate: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
        });
        const supplyMap = {};
        supplies.forEach((s) => {
            const dateStr = s.planDate.toISOString().split('T')[0];
            supplyMap[dateStr] = Number(s.supplyWeight);
        });
        return supplyMap;
    }
    async autoGeneratePlan(partName, currentMonth) {
        const { generatedTransactions, stats } = await (0, autoGeneratePlan_1.generateAutoPlanOnServer)(partName, currentMonth);
        if (generatedTransactions.length > 0) {
            await prisma_1.default.$transaction(async (tx) => {
                const upserts = generatedTransactions.map((line) => {
                    const planDate = new Date(line.planDate);
                    return tx.mpsProductionTransaction.upsert({
                        where: {
                            unique_plan_line: {
                                partName,
                                planDate,
                                soNumber: line.soNumber,
                                lineNumber: line.lineNumber,
                                itemCode: line.itemCode,
                                splitIndex: line.splitIndex || 0,
                            }
                        },
                        update: {
                            plannedQty: line.plannedQty,
                            allocatedRmSize: line.allocatedRmSize || null,
                        },
                        create: {
                            partName,
                            planDate,
                            soNumber: line.soNumber,
                            lineNumber: line.lineNumber,
                            itemCode: line.itemCode,
                            splitIndex: line.splitIndex || 0,
                            plannedQty: line.plannedQty,
                            allocatedRmSize: line.allocatedRmSize || null,
                        }
                    });
                });
                await Promise.all(upserts);
                await tx.mpsProductionTransaction.deleteMany({
                    where: {
                        partName,
                        planDate: {
                            gte: new Date(currentMonth),
                        },
                        plannedQty: { lte: 0 }
                    }
                });
            });
        }
        return {
            success: true,
            generatedCount: generatedTransactions.length,
            stats
        };
    }
    async clearPlans(partName, startDate, endDate) {
        const result = await prisma_1.default.mpsProductionTransaction.deleteMany({
            where: {
                partName,
                planDate: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
        });
        return { success: true, deletedCount: result.count };
    }
};
exports.MpsService = MpsService;
exports.MpsService = MpsService = __decorate([
    (0, common_1.Injectable)()
], MpsService);
//# sourceMappingURL=mps.service.js.map