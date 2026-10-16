export interface ICutConfig {
  machinesCount?: number;
  hoursPerShift?: number;
  maxShifts?: number;
  defaultSpeedKgH?: number;
}

export interface ICutItemDetail {
  itemCode: string;
  itemName?: string;
  plannedQty: number;
  iCutSpeed: number;
  isDefaultSpeed: boolean;
  hoursNeeded: number;
  sharePercent: number;
  rmRequiredKg: number;
}

export interface ICutDailyResult {
  dateStr: string;
  machineCode: string;
  totalPlannedKg: number;
  totalRmRequiredKg: number;
  coProductBlbKg: number;
  totalHoursNeeded: number;
  effectiveHoursPerShift: number;
  maxShifts: number;
  shiftsNeeded: number;
  availableHours: number;
  capacityUtilizationPct: number;
  status: 'idle' | 'normal' | 'high' | 'overload';
  items: ICutItemDetail[];
}

export const DEFAULT_ICUT_CONFIG: Required<ICutConfig> = {
  machinesCount: 2,
  hoursPerShift: 9.25,
  maxShifts: 2,
  defaultSpeedKgH: 500,
};

/**
 * Standard known BLK item codes connected to I-CUT Machine in Master Production Flow - BL
 */
export const KNOWN_ICUT_ITEM_CODES = new Set([
  '111117289',
  '111117299',
  '1111172B0',
  '1111172B7',
  '211117111',
  '211117113',
  '211117114',
  '211117115',
  '211117120',
  '211117121',
  '211117126',
  '211117130',
  '211117131',
  '211117132',
  '211117135',
  '211117139',
]);

/**
 * Determines whether an item goes through the I-CUT machine.
 */
export function isICutItem(
  itemCode: string,
  spec?: { iCutSpeed?: number | null; productName?: string; itemDesc?: string },
  icutItemSet?: Set<string>,
): boolean {
  if (spec && typeof spec.iCutSpeed === 'number' && spec.iCutSpeed > 0) {
    return true;
  }
  if (icutItemSet && icutItemSet.has(itemCode)) {
    return true;
  }
  if (KNOWN_ICUT_ITEM_CODES.has(itemCode)) {
    return true;
  }
  const desc = spec?.itemDesc || spec?.productName || '';
  if (desc.includes('BLK') || desc.includes('I-CUT') || desc.includes('ICUT')) {
    return true;
  }
  return false;
}

/**
 * Calculates I-CUT machine line capacity, hours needed, shifts, and outputs for a single day.
 * Demand/Plan-driven calculation based on planned BLK items and their iCutSpeed (kg/h).
 */
export function calculateICutCapacity(
  plans: Array<{ itemCode: string; plannedQty: number | string; itemName?: string }>,
  specsMap: Record<string, any> = {},
  config: ICutConfig = {},
  dateStr: string = '',
  icutItemSet?: Set<string>,
): ICutDailyResult {
  const cfg = { ...DEFAULT_ICUT_CONFIG, ...config };

  // 1. Filter plans belonging to I-CUT
  const icutPlans = plans.filter((p) => {
    const qty = Number(p.plannedQty) || 0;
    if (qty <= 0) return false;
    const spec = specsMap[p.itemCode];
    return isICutItem(p.itemCode, spec, icutItemSet);
  });

  let totalPlannedKg = 0;
  let totalRmRequiredKg = 0;
  let totalHoursNeeded = 0;

  const itemDetails: Array<{
    itemCode: string;
    itemName?: string;
    plannedQty: number;
    iCutSpeed: number;
    isDefaultSpeed: boolean;
    hoursNeeded: number;
    rmRequiredKg: number;
  }> = [];

  for (const p of icutPlans) {
    const qty = Number(p.plannedQty) || 0;
    const spec = specsMap[p.itemCode];
    const rawSpeed = Number(spec?.iCutSpeed);
    const hasCustomSpeed = !isNaN(rawSpeed) && rawSpeed > 0;
    const speed = hasCustomSpeed ? rawSpeed : cfg.defaultSpeedKgH;
    const isDefaultSpeed = !hasCustomSpeed;

    const hours = speed > 0 ? qty / speed : 0;
    const yieldPct = Number(spec?.yieldPercent) || 80; // Default BLK yield is 80%
    const rmReq = qty / (yieldPct / 100);

    totalPlannedKg += qty;
    totalRmRequiredKg += rmReq;
    totalHoursNeeded += hours;

    itemDetails.push({
      itemCode: p.itemCode,
      itemName: p.itemName || spec?.itemDesc || spec?.productName || p.itemCode,
      plannedQty: Number(qty.toFixed(2)),
      iCutSpeed: speed,
      isDefaultSpeed,
      hoursNeeded: Number(hours.toFixed(2)),
      rmRequiredKg: Number(rmReq.toFixed(2)),
    });
  }

  // 2. Co-product generated: RM BLB (BL BLOCK) is 20% yield from I-CUT input
  // Since RM BLK is 80% yield and RM BLB is 20% yield:
  // BL BLOCK = totalRmRequiredKg * 0.20
  const coProductBlbKg = Number((totalRmRequiredKg * 0.2).toFixed(2));

  // 3. Shift and capacity utilization calculations (2 machines × 2 shifts × 9.25h = 37h/day)
  const shift1Hours = cfg.machinesCount * cfg.hoursPerShift; // 2 * 9.25 = 18.5h
  const maxCapacityHours = cfg.machinesCount * cfg.maxShifts * cfg.hoursPerShift; // 2 * 2 * 9.25 = 37.0h

  let shiftsNeeded = 0;
  if (totalHoursNeeded > 0) {
    shiftsNeeded = totalHoursNeeded <= shift1Hours ? 1 : 2;
  }

  const availableHours = shiftsNeeded <= 1 ? shift1Hours : maxCapacityHours;

  const capacityUtilizationPct = totalHoursNeeded > 0
    ? Number(((totalHoursNeeded / availableHours) * 100).toFixed(1))
    : 0;

  let status: 'idle' | 'normal' | 'high' | 'overload' = 'idle';
  if (totalHoursNeeded > 0) {
    if (totalHoursNeeded > maxCapacityHours) {
      status = 'overload';
    } else if (capacityUtilizationPct >= 90) {
      status = 'high';
    } else {
      status = 'normal';
    }
  }

  // 4. Compute share percentage for each item
  const items: ICutItemDetail[] = itemDetails.map((item) => ({
    ...item,
    sharePercent: totalHoursNeeded > 0 ? Number(((item.hoursNeeded / totalHoursNeeded) * 100).toFixed(1)) : 0,
  }));

  return {
    dateStr,
    machineCode: 'ICUT-01',
    totalPlannedKg: Number(totalPlannedKg.toFixed(2)),
    totalRmRequiredKg: Number(totalRmRequiredKg.toFixed(2)),
    coProductBlbKg,
    totalHoursNeeded: Number(totalHoursNeeded.toFixed(2)),
    effectiveHoursPerShift: cfg.hoursPerShift,
    maxShifts: cfg.maxShifts,
    shiftsNeeded,
    availableHours,
    capacityUtilizationPct,
    status,
    items,
  };
}
