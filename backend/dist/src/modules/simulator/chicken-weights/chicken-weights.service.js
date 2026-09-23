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
exports.ChickenWeightsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = __importDefault(require("../../../lib/prisma"));
let ChickenWeightsService = class ChickenWeightsService {
    async findAll() {
        return prisma_1.default.chickenWeight.findMany({
            orderBy: { minWeight: 'asc' }
        });
    }
    async create(data) {
        return prisma_1.default.chickenWeight.create({
            data: {
                minWeight: data.minWeight,
                maxWeight: data.maxWeight
            }
        });
    }
    async update(id, data) {
        const existing = await prisma_1.default.chickenWeight.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Chicken weight not found');
        return prisma_1.default.chickenWeight.update({
            where: { id },
            data: {
                minWeight: data.minWeight,
                maxWeight: data.maxWeight
            }
        });
    }
    async remove(id) {
        const existing = await prisma_1.default.chickenWeight.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Chicken weight not found');
        return prisma_1.default.chickenWeight.delete({
            where: { id }
        });
    }
};
exports.ChickenWeightsService = ChickenWeightsService;
exports.ChickenWeightsService = ChickenWeightsService = __decorate([
    (0, common_1.Injectable)()
], ChickenWeightsService);
//# sourceMappingURL=chicken-weights.service.js.map