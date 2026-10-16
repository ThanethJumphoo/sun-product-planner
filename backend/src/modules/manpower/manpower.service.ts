import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import prisma from '../../lib/prisma';
import { ProductSpecService } from '../master-data/product-spec/product-spec.service';

export class CreateManpowerRoleDto {
  roleName!: string;
  calculationType!: 'VARIABLE' | 'MACHINE' | 'FIXED_OVERRIDE';
  defaultWorkers?: number;
  workingHoursPerShift?: number;
  shiftsCount?: number;
  machineType?: string;
  standardSpeedKgHr?: number;
  orderIndex?: number;
}

export class UpdateManpowerRoleDto {
  roleName?: string;
  calculationType?: 'VARIABLE' | 'MACHINE' | 'FIXED_OVERRIDE';
  defaultWorkers?: number;
  workingHoursPerShift?: number;
  shiftsCount?: number;
  machineType?: string;
  standardSpeedKgHr?: number;
  orderIndex?: number;
}

export class SaveManpowerOverrideDto {
  date!: string;
  roleId!: number;
  actualWorkers!: number;
  notes?: string;
}

@Injectable()
export class ManpowerService {
  constructor(private readonly productSpecService: ProductSpecService) {}

  /**
   * Fetch roles for a specific part. If none exist, seed default roles.
   */
  async getRolesForPart(partName: string) {
    let roles = await prisma.manpowerRole.findMany({
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

  /**
   * Seed default roles based on part characteristics
   */
  private async seedDefaultRoles(partName: string) {
    const defaultList: any[] = [];
    const upperPart = partName.toUpperCase();

    if (upperPart === 'FILLET') {
      defaultList.push(
        {
          partName,
          roleName: 'คนตัดแต่งตามยอด Order (Cutting Workers)',
          calculationType: 'VARIABLE',
          defaultWorkers: 0,
          workingHoursPerShift: 10.0,
          shiftsCount: 1,
          standardSpeedKgHr: 45.0,
          orderIndex: 1,
        },
        {
          partName,
          roleName: 'คนประจำสถานี & สนับสนุน (Station Workers)',
          calculationType: 'FIXED_OVERRIDE',
          defaultWorkers: 28.0,
          workingHoursPerShift: 10.0,
          shiftsCount: 1,
          orderIndex: 2,
        },
      );
    } else if (upperPart === 'BIL') {
      defaultList.push(
        {
          partName,
          roleName: 'คนตัดแต่ง BIL (BIL Cutting Staff P1/P2)',
          calculationType: 'VARIABLE',
          defaultWorkers: 0,
          workingHoursPerShift: 9.58,
          shiftsCount: 1,
          standardSpeedKgHr: 45.0,
          orderIndex: 1,
        },
        {
          partName,
          roleName: 'คนคุมเครื่องจักร Toridas (Toridas Debone Operators)',
          calculationType: 'MACHINE',
          machineType: 'TORIDAS',
          defaultWorkers: 5.0,
          workingHoursPerShift: 9.58,
          shiftsCount: 2,
          orderIndex: 2,
        },
        {
          partName,
          roleName: 'คนสายพานตัดแต่ง (Trimming Belt Workers)',
          calculationType: 'MACHINE',
          machineType: 'BELT',
          defaultWorkers: 7.0,
          workingHoursPerShift: 9.58,
          shiftsCount: 2,
          orderIndex: 3,
        },
        {
          partName,
          roleName: 'คนประจำเครื่องเอ็กซเรย์ (X-Ray Inspection Workers)',
          calculationType: 'MACHINE',
          machineType: 'XRAY',
          defaultWorkers: 5.0,
          workingHoursPerShift: 9.58,
          shiftsCount: 2,
          orderIndex: 4,
        },
        {
          partName,
          roleName: 'คนบริการ & ลำเลียง (BIL Service / Logistics)',
          calculationType: 'FIXED_OVERRIDE',
          defaultWorkers: 6.0,
          workingHoursPerShift: 8.0,
          shiftsCount: 1,
          orderIndex: 5,
        },
      );
    } else if (upperPart === 'BL') {
      defaultList.push(
        {
          partName,
          roleName: 'คนตัดแต่ง Manual (Manual Trimming Workers)',
          calculationType: 'VARIABLE',
          defaultWorkers: 0,
          workingHoursPerShift: 8.0,
          shiftsCount: 1,
          standardSpeedKgHr: 25.0, // 200 kg/day / 8 hr = 25 kg/hr
          orderIndex: 1,
        },
        {
          partName,
          roleName: 'คนคุมเครื่องจักร I-Cut (I-Cut Operators)',
          calculationType: 'MACHINE',
          machineType: 'ICUT',
          defaultWorkers: 2.0,
          workingHoursPerShift: 9.25,
          shiftsCount: 2,
          orderIndex: 2,
        },
        {
          partName,
          roleName: 'คนบริการ & สนับสนุน (BL Service & Support)',
          calculationType: 'FIXED_OVERRIDE',
          defaultWorkers: 4.0,
          workingHoursPerShift: 8.0,
          shiftsCount: 1,
          orderIndex: 3,
        },
      );
    } else {
      defaultList.push(
        {
          partName,
          roleName: `คนตัดแต่ง ${partName} (Cutting Workers)`,
          calculationType: 'VARIABLE',
          defaultWorkers: 0,
          workingHoursPerShift: 10.0,
          shiftsCount: 1,
          standardSpeedKgHr: 45.0,
          orderIndex: 1,
        },
        {
          partName,
          roleName: `คนประจำสถานี ${partName} (Station Workers)`,
          calculationType: 'FIXED_OVERRIDE',
          defaultWorkers: 28.0,
          workingHoursPerShift: 10.0,
          shiftsCount: 1,
          orderIndex: 2,
        },
      );
    }

    const created: any[] = [];
    for (const d of defaultList) {
      const res = await prisma.manpowerRole.create({ data: d });
      created.push(res);
    }
    return created;
  }

  async createRole(partName: string, dto: CreateManpowerRoleDto) {
    if (!dto.roleName?.trim()) {
      throw new BadRequestException('Role name is required.');
    }
    if (!dto.calculationType) {
      throw new BadRequestException('Calculation type is required.');
    }

    const maxOrder = await prisma.manpowerRole.aggregate({
      where: { partName },
      _max: { orderIndex: true },
    });

    const nextOrder = dto.orderIndex ?? (maxOrder._max.orderIndex || 0) + 1;

    return prisma.manpowerRole.create({
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

  async updateRole(id: number, dto: UpdateManpowerRoleDto) {
    const existing = await prisma.manpowerRole.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Role ${id} not found.`);
    }

    return prisma.manpowerRole.update({
      where: { id },
      data: {
        roleName: dto.roleName !== undefined ? dto.roleName.trim() : undefined,
        calculationType: dto.calculationType || undefined,
        defaultWorkers: dto.defaultWorkers !== undefined ? Number(dto.defaultWorkers) : undefined,
        workingHoursPerShift:
          dto.workingHoursPerShift !== undefined ? Number(dto.workingHoursPerShift) : undefined,
        shiftsCount: dto.shiftsCount !== undefined ? Number(dto.shiftsCount) : undefined,
        machineType: dto.machineType !== undefined ? dto.machineType?.trim() || null : undefined,
        standardSpeedKgHr:
          dto.standardSpeedKgHr !== undefined ? (dto.standardSpeedKgHr ? Number(dto.standardSpeedKgHr) : null) : undefined,
        orderIndex: dto.orderIndex !== undefined ? Number(dto.orderIndex) : undefined,
      },
    });
  }

  async deleteRole(id: number) {
    const existing = await prisma.manpowerRole.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Role ${id} not found.`);
    }
    return prisma.manpowerRole.delete({ where: { id } });
  }

  /**
   * Generate daily manpower planning matrix for month
   */
  async getDailyPlan(partName: string, monthStr: string) {
    const targetDate = monthStr ? new Date(`${monthStr}-01`) : new Date();
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);

    // 1. Fetch roles
    const roles = await this.getRolesForPart(partName);

    // 2. Fetch MPS Production transactions for this month and part
    const mpsPlans = await prisma.mpsProductionTransaction.findMany({
      where: {
        partName,
        planDate: { gte: monthStart, lte: monthEnd },
      },
    });

    // 3. Fetch ProductSpecs for items planned
    const itemCodes = Array.from(new Set(mpsPlans.map((p) => p.itemCode)));
    const specs = await prisma.productSpec.findMany({
      where: { erpItemCode: { in: itemCodes } },
    });
    const specMap = new Map(specs.map((s) => [s.erpItemCode, s]));

    // 4. Fetch daily overrides already saved in database
    const savedOverrides = await prisma.dailyManpowerRecord.findMany({
      where: {
        partName,
        date: { gte: monthStart, lte: monthEnd },
      },
    });

    const overrideMap = new Map<string, any>();
    savedOverrides.forEach((o) => {
      const dKey = `${format(new Date(o.date), 'yyyy-MM-dd')}_${o.roleId}`;
      overrideMap.set(dKey, o);
    });

    // 5. Generate days array for the month
    const daysInterval = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const days = daysInterval.map((d) => format(d, 'yyyy-MM-dd'));

    // Map plans by date
    const plansByDate: Record<string, any[]> = {};
    const totalQtyByDate: Record<string, number> = {};

    days.forEach((dStr) => {
      plansByDate[dStr] = [];
      totalQtyByDate[dStr] = 0;
    });

    mpsPlans.forEach((p) => {
      const dStr = format(new Date(p.planDate), 'yyyy-MM-dd');
      if (plansByDate[dStr]) {
        plansByDate[dStr].push(p);
        totalQtyByDate[dStr] += Number(p.plannedQty || 0);
      }
    });

    // 6. Build matrix per role and date
    const matrix: Record<number, Record<string, any>> = {};
    const dailyTotalCalculated: Record<string, number> = {};
    const dailyTotalActual: Record<string, number> = {};

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
          // Cutting Workers formula:
          // SUMPRODUCT(Qty Demand / Product spec Man Speed) / workingHours (10 ชม./วัน)
          const workHours =
            role.workingHoursPerShift && Number(role.workingHoursPerShift) > 0
              ? Number(role.workingHoursPerShift)
              : 10.0;
          let totalHoursNeeded = 0;

          if (plansToday.length > 0) {
            for (const p of plansToday) {
              const spec = specMap.get(p.itemCode);
              const speed =
                spec?.manSpeed && Number(spec.manSpeed) > 0
                  ? Number(spec.manSpeed)
                  : role.standardSpeedKgHr && Number(role.standardSpeedKgHr) > 0
                    ? Number(role.standardSpeedKgHr)
                    : 45.0; // Standard default speed 45 kg/hr/person
              const plannedQty = Number(p.plannedQty || 0);
              const hoursForItem = plannedQty / speed;
              totalHoursNeeded += hoursForItem;
            }
            calculatedWorkers = Math.ceil(totalHoursNeeded / workHours);
          } else if (totalKgToday > 0) {
            const speed =
              role.standardSpeedKgHr && Number(role.standardSpeedKgHr) > 0
                ? Number(role.standardSpeedKgHr)
                : 45.0;
            calculatedWorkers = Math.ceil((totalKgToday / speed) / workHours);
          } else {
            // หากวันใดไม่มีการผลิตหรือไม่มี Order จะแสดงเป็น 0 คน
            calculatedWorkers = 0;
          }
        } else if (role.calculationType === 'MACHINE') {
          // Machine workers: operate when there is production / machine is active
          const isMachineActive = totalKgToday > 0;
          if (isMachineActive) {
            calculatedWorkers = Math.ceil((role.defaultWorkers || 1) * (role.shiftsCount || 1));
          } else {
            calculatedWorkers = 0;
          }
        } else {
          // FIXED_OVERRIDE (Station Workers: 28 คน/วัน)
          // หากวันใดไม่มีการผลิตหรือไม่มี Order จะแสดงเป็น 0 คน
          if (totalKgToday <= 0 && plansToday.length === 0) {
            calculatedWorkers = 0;
          } else {
            calculatedWorkers = Math.round((role.defaultWorkers || 0) * (role.shiftsCount || 1));
          }
        }

        // Check if override exists
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

    // 7. Calculate summary stats
    const totalWorkingDays = days.filter((d) => (totalQtyByDate[d] || 0) > 0).length || days.length;
    const avgDailyWorkers =
      Math.round((days.reduce((sum, d) => sum + dailyTotalActual[d], 0) / (totalWorkingDays || 1)) * 10) / 10;
    const peakWorkers = Math.max(...days.map((d) => dailyTotalActual[d]), 0);

    return {
      partName,
      month: monthStr || format(new Date(), 'yyyy-MM'),
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

  /**
   * Save overrides for multiple dates/roles
   */
  async saveOverrides(partName: string, overrides: SaveManpowerOverrideDto[]) {
    return prisma.$transaction(async (tx) => {
      const results: any[] = [];
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

  /**
   * Reset overrides for dates/roles back to calculated values
   */
  async resetOverrides(partName: string, roleId?: number, date?: string) {
    const whereClause: any = { partName };
    if (roleId) whereClause.roleId = Number(roleId);
    if (date) whereClause.date = new Date(date);

    return prisma.dailyManpowerRecord.deleteMany({
      where: whereClause,
    });
  }
}
