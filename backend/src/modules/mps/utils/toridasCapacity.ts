export interface ToridasConfig {
  speedPerMachineHr?: number;
  machinesPerLine?: number;
  totalLines?: number;
  effectiveHoursPerShift?: number;
  workersPerLine?: number;
  deboningYieldPercent?: number;
  legQuarterRatioPercent?: number;
  byProducts?: ToridasByProduct[];
}

export interface ToridasByProduct {
  name: string;
  itemCode?: string;
  yieldPercent: number;
  weightKg?: number;
}

export interface ToridasDailyResult {
  dateStr: string;
  chickenCount: number;
  avgWeightKg: number;
  pieceWeightKg: number;
  offeredPieces: number;
  acceptedPieces: number;
  overflowPieces: number;
  shiftsNeeded: number;
  linesNeeded: number;
  workersNeeded: number;
  capacityUtilizationPct: number;
  toridasInputKg: number;
  bonelessOutputKg: number;
  overflowBoneInKg: number;
  byProducts: ToridasByProduct[];
}

export const DEFAULT_TORIDAS_CONFIG: Required<Omit<ToridasConfig, 'byProducts'>> & { byProducts?: ToridasByProduct[] } = {
  speedPerMachineHr: 1500,
  machinesPerLine: 4,
  totalLines: 3,
  effectiveHoursPerShift: 9.58,
  workersPerLine: 5,
  deboningYieldPercent: 80,
  legQuarterRatioPercent: 25,
};

export const DEFAULT_TORIDAS_BYPRODUCTS: ToridasByProduct[] = [
  {
    name: 'กระดูกน่องสะโพกติดข้อเต็ม',
    itemCode: '111119187',
    yieldPercent: 20.6,
  },
  {
    name: 'หนังติดมันเกรด A',
    itemCode: '111119118',
    yieldPercent: 2.8,
  },
  {
    name: 'เศษ BL No.2',
    itemCode: '111119140',
    yieldPercent: 0.4,
  },
  {
    name: 'เอ็นข้อไก่ (Knee Tendon)',
    itemCode: '111118201',
    yieldPercent: 0.8,
  },
];

/**
 * Calculates Toridas deboning machine line capacity, manpower, and output.
 */
export function calculateToridasCapacity(
  offeredWeightKg: number,
  avgWeightKg: number,
  config: ToridasConfig = {},
  dateStr: string = ''
): ToridasDailyResult {
  const cfg = { ...DEFAULT_TORIDAS_CONFIG, ...config };

  const capPerLinePerShift = cfg.speedPerMachineHr * cfg.machinesPerLine * cfg.effectiveHoursPerShift; // 57,480 pcs
  const max1ShiftPcs = capPerLinePerShift * cfg.totalLines; // 172,440 pcs
  const max2ShiftPcs = max1ShiftPcs * 2; // 344,880 pcs

  // Weight of one bone-in leg piece:
  // Leg quarter ratio configurable (default ~25% of bird weight / 2 legs = ~12.5% of bird weight)
  const safeAvgWeight = avgWeightKg > 0 ? avgWeightKg : 2.8;
  const legRatio = (cfg.legQuarterRatioPercent || 25) / 100;
  const pieceWeightKg = Math.max(0.1, (safeAvgWeight * legRatio) / 2);

  // Convert offered weight to pieces
  const offeredPieces = Math.round(offeredWeightKg / pieceWeightKg);
  const chickenCount = Math.round(offeredPieces / 2);

  // Determine shifts (1 or 2)
  const shiftsNeeded = offeredPieces > max1ShiftPcs ? 2 : 1;
  const maxPlantCapPieces = shiftsNeeded === 1 ? max1ShiftPcs : max2ShiftPcs;

  // Filter capacity
  const acceptedPieces = Math.min(offeredPieces, maxPlantCapPieces);
  const overflowPieces = Math.max(0, offeredPieces - maxPlantCapPieces);

  // Line & Worker allocation
  const pcsPerShift = Math.ceil(acceptedPieces / shiftsNeeded);
  const linesNeeded = acceptedPieces > 0 ? Math.min(cfg.totalLines, Math.max(1, Math.ceil(pcsPerShift / capPerLinePerShift))) : 0;
  const workersNeeded = linesNeeded * cfg.workersPerLine * shiftsNeeded;

  const totalCapAvailable = linesNeeded * capPerLinePerShift * shiftsNeeded;
  const capacityUtilizationPct = totalCapAvailable > 0
    ? Number(((acceptedPieces / totalCapAvailable) * 100).toFixed(1))
    : 0;

  const toridasInputKg = Number((acceptedPieces * pieceWeightKg).toFixed(2));
  const overflowBoneInKg = Number((overflowPieces * pieceWeightKg).toFixed(2));
  const bonelessOutputKg = Number((toridasInputKg * (cfg.deboningYieldPercent / 100)).toFixed(2));

  // By-products generated from Toridas deboning (configurable or default)
  const templateByProducts = (cfg.byProducts && cfg.byProducts.length > 0) ? cfg.byProducts : DEFAULT_TORIDAS_BYPRODUCTS;
  const byProducts: ToridasByProduct[] = templateByProducts.map(bp => ({
    name: bp.name,
    itemCode: bp.itemCode,
    yieldPercent: bp.yieldPercent,
    weightKg: Number((toridasInputKg * (bp.yieldPercent / 100)).toFixed(2)),
  }));

  return {
    dateStr,
    chickenCount,
    avgWeightKg: Number(safeAvgWeight.toFixed(2)),
    pieceWeightKg: Number(pieceWeightKg.toFixed(3)),
    offeredPieces,
    acceptedPieces,
    overflowPieces,
    shiftsNeeded,
    linesNeeded,
    workersNeeded,
    capacityUtilizationPct,
    toridasInputKg,
    bonelessOutputKg,
    overflowBoneInKg,
    byProducts,
  };
}
