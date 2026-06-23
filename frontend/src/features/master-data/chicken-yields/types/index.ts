export interface ChickenYield {
  id: number;
  partCode: string;
  partName: string;
  yieldPercent: number;
  sortOrder: number;
  status: string;
  createdAt: string;
  createdBy: number | null;
  updatedAt: string;
  updatedBy: number | null;
  deletedAt: string | null;
  deletedBy: number | null;
}

export enum ChickenYieldStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}
