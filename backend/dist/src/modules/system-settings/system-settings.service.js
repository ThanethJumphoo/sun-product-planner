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
exports.SystemSettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = __importDefault(require("../../lib/prisma"));
let SystemSettingsService = class SystemSettingsService {
    async getSettings() {
        return prisma_1.default.systemSetting.findMany({
            orderBy: { category: 'asc' },
        });
    }
    async getSettingByKey(key, defaultValue = '') {
        const setting = await prisma_1.default.systemSetting.findUnique({
            where: { key },
        });
        return setting?.value ?? defaultValue;
    }
    async updateSettings(settings) {
        await prisma_1.default.$transaction(settings.map((s) => prisma_1.default.systemSetting.upsert({
            where: { key: s.key },
            update: {
                value: s.value,
                description: s.description ?? undefined,
                category: s.category ?? undefined,
            },
            create: {
                key: s.key,
                value: s.value,
                description: s.description ?? '',
                category: s.category ?? 'GENERAL',
            },
        })));
        return { success: true };
    }
};
exports.SystemSettingsService = SystemSettingsService;
exports.SystemSettingsService = SystemSettingsService = __decorate([
    (0, common_1.Injectable)()
], SystemSettingsService);
//# sourceMappingURL=system-settings.service.js.map