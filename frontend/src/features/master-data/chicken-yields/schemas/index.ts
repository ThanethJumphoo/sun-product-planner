import { z } from 'zod';
import { ChickenYieldStatus } from '../types';

export const chickenYieldSchema = z.object({
  partCode: z.string().min(1, 'Part Code is required'),
  partName: z.string().min(1, 'Part Name is required'),
  yieldPercent: z.number().min(0, 'Yield % cannot be negative').max(100, 'Yield % cannot exceed 100'),
  sortOrder: z.number().int().default(0),
  status: z.nativeEnum(ChickenYieldStatus),
});

export type ChickenYieldFormValues = z.infer<typeof chickenYieldSchema>;
