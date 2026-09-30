import { Injectable } from '@nestjs/common';
import prisma from '../../lib/prisma';

@Injectable()
export class SystemSettingsService {
  async getSettings() {
    return prisma.systemSetting.findMany({
      orderBy: { category: 'asc' },
    });
  }

  async getSettingByKey(
    key: string,
    defaultValue: string = '',
  ): Promise<string> {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });
    return setting?.value ?? defaultValue;
  }

  async updateSettings(
    settings: {
      key: string;
      value: string;
      description?: string;
      category?: string;
    }[],
  ) {
    await prisma.$transaction(
      settings.map((s) =>
        prisma.systemSetting.upsert({
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
        }),
      ),
    );
    return { success: true };
  }
}
