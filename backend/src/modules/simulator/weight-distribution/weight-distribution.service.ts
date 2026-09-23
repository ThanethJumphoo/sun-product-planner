import { Injectable, NotFoundException } from '@nestjs/common';
import prisma from '../../../lib/prisma';

@Injectable()
export class WeightDistributionService {
  
  async findParts() {
    const parts = await prisma.flowNode.findMany({
      where: { nodeType: { typeCode: 'PART' } },
      select: { name: true },
      distinct: ['name'],
    });
    return parts.map(p => p.name).sort();
  }

  // Gets the matrix of ChickenWeights and RM Sizes for a part
  async findMatrixByPart(partName: string) {
    // Get all global chicken weights
    const chickenWeights = await prisma.chickenWeight.findMany({
      orderBy: { minWeight: 'asc' }
    });

    // Get all part-specific RM sizes
    const rmSizes = await prisma.partRmSize.findMany({
      where: { partName },
      orderBy: { minSize: 'asc' }
    });

    // Get existing distributions
    const distributions = await prisma.partWeightDistribution.findMany({
      where: { partName }
    });

    // Map them into a structured format for the frontend
    // Group by ChickenWeight
    const matrix = chickenWeights.map(cw => {
      return {
        chickenWeight: cw,
        rmSizes: rmSizes.map(rm => {
          const existingDist = distributions.find(
            d => d.chickenWeightId === cw.id && d.partRmSizeId === rm.id
          );
          
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

  // Saves a batch of percentages for the matrix
  async saveMatrix(partName: string, updates: { chickenWeightId: number, partRmSizeId: number, percent: number }[]) {
    const results = [];
    
    // We can do this in a transaction
    await prisma.$transaction(async (tx) => {
      // First delete all existing for this part, then recreate. It's safer and cleaner than upserting individually if there are many.
      // Wait, deleting all might be bad if there are other relations (not currently).
      // Let's just use upsert or delete and recreate.
      await tx.partWeightDistribution.deleteMany({
        where: { partName }
      });

      if (updates.length > 0) {
        // Filter out 0% if they don't want to save 0, but maybe they do. We'll save them all.
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
}
