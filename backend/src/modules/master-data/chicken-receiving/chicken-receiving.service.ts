import { Injectable, NotFoundException } from '@nestjs/common';
import prisma from '../../../lib/prisma';

@Injectable()
export class ChickenReceivingService {
  async getMonthlyRecords(query: any) {
    const { page = 1, limit = 50, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (dateFrom || dateTo) {
      where.receiveDate = {};
      if (dateFrom) where.receiveDate.gte = new Date(dateFrom);
      if (dateTo) where.receiveDate.lte = new Date(dateTo);
    }

    const [data, total] = await Promise.all([
      prisma.monthlyChickenReceiving.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { receiveDate: 'desc' },
      }),
      prisma.monthlyChickenReceiving.count({ where }),
    ]);

    return { data, total, page: Number(page), limit: Number(limit) };
  }

  async createMonthlyRecord(data: any) {
    const receiveDate = new Date(data.receiveDate);

    // Check if record for this month already exists
    // Since it's monthly, we might want to ensure unique month?
    // The requirement says "วันที่รับ" (Receive Date) so it might be specific dates in that month, or just a monthly summary with a start date. Let's just create it.

    // Auto-calculate average weight
    const totalWeight = Number(data.totalWeight);
    const numberOfChickens = Number(data.numberOfChickens);
    const averageWeight =
      numberOfChickens > 0 ? (totalWeight / numberOfChickens).toFixed(2) : 0;

    return prisma.monthlyChickenReceiving.create({
      data: {
        receiveDate,
        numberOfChickens,
        totalWeight,
        averageWeight: Number(averageWeight),
      },
    });
  }

  async bulkCreateMonthlyRecords(records: any[]) {
    const formattedRecords = records.map((data) => {
      const receiveDate = new Date(data.receiveDate);
      const totalWeight = Number(data.totalWeight);
      const numberOfChickens = Number(data.numberOfChickens);
      const averageWeight =
        numberOfChickens > 0
          ? Number((totalWeight / numberOfChickens).toFixed(2))
          : 0;
      return {
        receiveDate,
        numberOfChickens,
        totalWeight,
        averageWeight,
      };
    });

    return prisma.monthlyChickenReceiving.createMany({
      data: formattedRecords,
    });
  }

  async updateMonthlyRecord(id: string, data: any) {
    const record = await prisma.monthlyChickenReceiving.findUnique({
      where: { id },
    });
    if (!record) throw new NotFoundException('Record not found');

    const updateData: any = {};
    if (data.receiveDate) updateData.receiveDate = new Date(data.receiveDate);

    const numberOfChickens =
      data.numberOfChickens !== undefined
        ? Number(data.numberOfChickens)
        : Number(record.numberOfChickens);
    const totalWeight =
      data.totalWeight !== undefined
        ? Number(data.totalWeight)
        : Number(record.totalWeight);

    if (data.numberOfChickens !== undefined)
      updateData.numberOfChickens = numberOfChickens;
    if (data.totalWeight !== undefined) updateData.totalWeight = totalWeight;

    // Recalculate average weight
    if (data.numberOfChickens !== undefined || data.totalWeight !== undefined) {
      updateData.averageWeight =
        numberOfChickens > 0
          ? Number((totalWeight / numberOfChickens).toFixed(2))
          : 0;
    }

    return prisma.monthlyChickenReceiving.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteMonthlyRecord(id: string) {
    return prisma.monthlyChickenReceiving.delete({
      where: { id },
    });
  }

  // --- Weekly Methods ---
  
  async getWeeklyRecords(query: any) {
    const { page = 1, limit = 1000, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (dateFrom || dateTo) {
      where.receiveDate = {};
      if (dateFrom) where.receiveDate.gte = new Date(dateFrom);
      if (dateTo) where.receiveDate.lte = new Date(dateTo);
    }

    const [data, total] = await Promise.all([
      prisma.weeklyChickenReceiving.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { receiveDate: 'asc' },
      }),
      prisma.weeklyChickenReceiving.count({ where }),
    ]);

    return { data, total, page: Number(page), limit: Number(limit) };
  }

  async createWeeklyRecord(data: any) {
    const receiveDate = new Date(data.receiveDate);
    const totalCount = Number(data.totalCount);
    const totalWeight = Number(data.totalWeight);
    const averageWeight = totalCount > 0 ? Number((totalWeight / totalCount).toFixed(2)) : 0;

    return prisma.weeklyChickenReceiving.create({
      data: {
        receiveDate,
        shift: data.shift || 'A',
        totalCount,
        totalWeight,
        averageWeight,
        farmName: data.farmName || '',
        standardFarmName: data.standardFarmName || '',
        house: data.house || '',
        sex: data.sex || 'ผู้',
        healthStatus: data.healthStatus || 'ปกติ',
        batch: data.batch || '',
      },
    });
  }

  async bulkCreateWeeklyRecords(records: any[]) {
    const formattedRecords = records.map((data) => {
      const receiveDate = new Date(data.receiveDate);
      const totalCount = Number(data.totalCount);
      const totalWeight = Number(data.totalWeight);
      const averageWeight = totalCount > 0 ? Number((totalWeight / totalCount).toFixed(2)) : 0;
      
      return {
        receiveDate,
        shift: data.shift || 'A',
        totalCount,
        totalWeight,
        averageWeight,
        farmName: data.farmName || '',
        standardFarmName: data.standardFarmName || '',
        house: data.house || '',
        sex: data.sex || 'ผู้',
        healthStatus: data.healthStatus || 'ปกติ',
        batch: data.batch || '',
      };
    });

    return prisma.weeklyChickenReceiving.createMany({
      data: formattedRecords,
    });
  }

  async updateWeeklyRecord(id: string, data: any) {
    const record = await prisma.weeklyChickenReceiving.findUnique({
      where: { id },
    });
    if (!record) throw new NotFoundException('Record not found');

    const updateData: any = { ...data };
    if (data.receiveDate) updateData.receiveDate = new Date(data.receiveDate);

    const totalCount = data.totalCount !== undefined ? Number(data.totalCount) : Number(record.totalCount);
    const totalWeight = data.totalWeight !== undefined ? Number(data.totalWeight) : Number(record.totalWeight);

    if (data.totalCount !== undefined) updateData.totalCount = totalCount;
    if (data.totalWeight !== undefined) updateData.totalWeight = totalWeight;

    if (data.totalCount !== undefined || data.totalWeight !== undefined) {
      updateData.averageWeight = totalCount > 0 ? Number((totalWeight / totalCount).toFixed(2)) : 0;
    }

    // Clean up unnecessary fields if they exist in the payload
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    return prisma.weeklyChickenReceiving.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteWeeklyRecord(id: string) {
    return prisma.weeklyChickenReceiving.delete({
      where: { id },
    });
  }

  // --- Daily Methods ---
  
  async getDailyRecords(query: any) {
    const { page = 1, limit = 1000, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (dateFrom || dateTo) {
      where.receiveDate = {};
      if (dateFrom) where.receiveDate.gte = new Date(dateFrom);
      if (dateTo) where.receiveDate.lte = new Date(dateTo);
    }

    const [data, total] = await Promise.all([
      prisma.dailyChickenReceiving.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: [
          { receiveDate: 'asc' },
          { actualReceiveDate: 'asc' },
          { receiveTime: 'asc' }
        ],
      }),
      prisma.dailyChickenReceiving.count({ where }),
    ]);

    return { data, total, page: Number(page), limit: Number(limit) };
  }

  async createDailyRecord(data: any) {
    let actualReceiveDate = new Date(data.receiveDate);
    let receiveDate = new Date(data.receiveDate);
    // If no time is provided, default to a safe time like 12:00 so it doesn't shift to the previous day
    const time = data.receiveTime && data.receiveTime.trim() !== '' ? data.receiveTime : '12:00';
    
    // Shift date by -1 if time is between 00:00 and 03:49
    const [hours, minutes] = time.split(':').map(Number);
    if (hours < 3 || (hours === 3 && minutes <= 49)) {
      receiveDate.setDate(receiveDate.getDate() - 1);
    }

    const totalCount = Number(data.totalCount);
    const totalWeight = Number(data.totalWeight);
    const averageWeight = totalCount > 0 ? Number((totalWeight / totalCount).toFixed(2)) : 0;

    return prisma.dailyChickenReceiving.create({
      data: {
        receiveDate,
        actualReceiveDate,
        shift: data.shift || '',
        receiveTime: time,
        totalCount,
        totalWeight,
        averageWeight,
        farmName: data.farmName || '',
        standardFarmName: data.standardFarmName || '',
        house: data.house || '',
        sex: data.sex || 'ผู้',
        sublot: data.sublot || '',
      },
    });
  }

  async bulkCreateDailyRecords(records: any[]) {
    const formattedRecords = records.map((data) => {
      let actualReceiveDate = new Date(data.receiveDate);
      let receiveDate = new Date(data.receiveDate);
      const time = data.receiveTime && data.receiveTime.trim() !== '' ? data.receiveTime : '12:00';
      
      const [hours, minutes] = time.split(':').map(Number);
      if (hours < 3 || (hours === 3 && minutes <= 49)) {
        receiveDate.setDate(receiveDate.getDate() - 1);
      }

      const totalCount = Number(data.totalCount);
      const totalWeight = Number(data.totalWeight);
      const averageWeight = totalCount > 0 ? Number((totalWeight / totalCount).toFixed(2)) : 0;
      
      return {
        receiveDate,
        actualReceiveDate,
        shift: data.shift || '',
        receiveTime: time,
        totalCount,
        totalWeight,
        averageWeight,
        farmName: data.farmName || '',
        standardFarmName: data.standardFarmName || '',
        house: data.house || '',
        sex: data.sex || 'ผู้',
        sublot: data.sublot || '',
      };
    });

    return prisma.dailyChickenReceiving.createMany({
      data: formattedRecords,
    });
  }

  async updateDailyRecord(id: string, data: any) {
    const record = await prisma.dailyChickenReceiving.findUnique({
      where: { id },
    });
    if (!record) throw new NotFoundException('Record not found');

    const updateData: any = { ...data };
    
    if (data.receiveDate || data.receiveTime) {
      const time = (data.receiveTime && data.receiveTime.trim() !== '') ? data.receiveTime : (record.receiveTime || '12:00');
      const baseDate = data.receiveDate ? new Date(data.receiveDate) : new Date(record.actualReceiveDate || record.receiveDate);
      
      let actualReceiveDate = new Date(baseDate);
      let receiveDate = new Date(baseDate);
      
      const [hours, minutes] = time.split(':').map(Number);
      if (hours < 3 || (hours === 3 && minutes <= 49)) {
        receiveDate.setDate(receiveDate.getDate() - 1);
      }

      updateData.receiveDate = receiveDate;
      updateData.actualReceiveDate = actualReceiveDate;
      updateData.receiveTime = time;
    }

    const totalCount = data.totalCount !== undefined ? Number(data.totalCount) : Number(record.totalCount);
    const totalWeight = data.totalWeight !== undefined ? Number(data.totalWeight) : Number(record.totalWeight);

    if (data.totalCount !== undefined) updateData.totalCount = totalCount;
    if (data.totalWeight !== undefined) updateData.totalWeight = totalWeight;

    if (data.totalCount !== undefined || data.totalWeight !== undefined) {
      updateData.averageWeight = totalCount > 0 ? Number((totalWeight / totalCount).toFixed(2)) : 0;
    }

    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    return prisma.dailyChickenReceiving.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteDailyRecord(id: string) {
    return prisma.dailyChickenReceiving.delete({
      where: { id },
    });
  }

  async clearDailyRecords(query: any) {
    const { dateFrom, dateTo } = query;
    const where: any = {};
    if (dateFrom || dateTo) {
      where.receiveDate = {};
      if (dateFrom) where.receiveDate.gte = new Date(dateFrom);
      if (dateTo) where.receiveDate.lte = new Date(dateTo);
    }
    
    // Safety check: require at least one date boundary to avoid accidental full wipes
    if (!where.receiveDate) {
       throw new Error('Please specify dateFrom or dateTo to clear data.');
    }

    return prisma.dailyChickenReceiving.deleteMany({
      where,
    });
  }
}
