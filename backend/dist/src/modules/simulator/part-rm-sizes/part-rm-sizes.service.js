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
exports.PartRmSizesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = __importDefault(require("../../../lib/prisma"));
let PartRmSizesService = class PartRmSizesService {
    async findAllByPart(partName) {
        return prisma_1.default.partRmSize.findMany({
            where: { partName },
            orderBy: { minSize: 'asc' }
        });
    }
    async create(partName, data) {
        return prisma_1.default.partRmSize.create({
            data: {
                partName,
                minSize: data.minSize ?? null,
                maxSize: data.maxSize ?? null
            }
        });
    }
    async update(id, data) {
        const existing = await prisma_1.default.partRmSize.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Part RM Size not found');
        return prisma_1.default.partRmSize.update({
            where: { id },
            data: {
                minSize: data.minSize ?? null,
                maxSize: data.maxSize ?? null
            }
        });
    }
    async remove(id) {
        const existing = await prisma_1.default.partRmSize.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Part RM Size not found');
        return prisma_1.default.partRmSize.delete({
            where: { id }
        });
    }
};
exports.PartRmSizesService = PartRmSizesService;
exports.PartRmSizesService = PartRmSizesService = __decorate([
    (0, common_1.Injectable)()
], PartRmSizesService);
//# sourceMappingURL=part-rm-sizes.service.js.map