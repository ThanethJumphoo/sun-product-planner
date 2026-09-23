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
exports.WeightDistributionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = __importDefault(require("../../../lib/prisma"));
let WeightDistributionService = class WeightDistributionService {
    async findParts() {
        const parts = await prisma_1.default.flowNode.findMany({
            where: { nodeType: { typeCode: 'PART' } },
            select: { name: true },
            distinct: ['name'],
        });
        return parts.map(p => p.name).sort();
    }
    async findMatrixByPart(partName) {
        const chickenWeights = await prisma_1.default.chickenWeight.findMany({
            orderBy: { minWeight: 'asc' }
        });
        const rmSizes = await prisma_1.default.partRmSize.findMany({
            where: { partName },
            orderBy: { minSize: 'asc' }
        });
        const distributions = await prisma_1.default.partWeightDistribution.findMany({
            where: { partName }
        });
        const matrix = chickenWeights.map(cw => {
            return {
                chickenWeight: cw,
                rmSizes: rmSizes.map(rm => {
                    const existingDist = distributions.find(d => d.chickenWeightId === cw.id && d.partRmSizeId === rm.id);
                    return {
                        rmSize: rm,
                        distributionId: existingDist?.id || null,
                        percent: existingDist?.percent || 0
                    };
                })
            };
        });
        return matrix;
    }
    async saveMatrix(partName, updates) {
        const results = [];
        await prisma_1.default.$transaction(async (tx) => {
            await tx.partWeightDistribution.deleteMany({
                where: { partName }
            });
            if (updates.length > 0) {
                await tx.partWeightDistribution.createMany({
                    data: updates.map(u => ({
                        partName,
                        chickenWeightId: u.chickenWeightId,
                        partRmSizeId: u.partRmSizeId,
                        percent: u.percent
                    }))
                });
            }
        });
        return { success: true };
    }
};
exports.WeightDistributionService = WeightDistributionService;
exports.WeightDistributionService = WeightDistributionService = __decorate([
    (0, common_1.Injectable)()
], WeightDistributionService);
//# sourceMappingURL=weight-distribution.service.js.map