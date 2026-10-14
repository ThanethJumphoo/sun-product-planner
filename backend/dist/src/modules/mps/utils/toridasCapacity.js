"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TORIDAS_CONFIG = void 0;
exports.calculateToridasCapacity = calculateToridasCapacity;
exports.DEFAULT_TORIDAS_CONFIG = {
    speedPerMachineHr: 1500,
    machinesPerLine: 4,
    totalLines: 3,
    effectiveHoursPerShift: 9.58,
    workersPerLine: 5,
    deboningYieldPercent: 80,
};
function calculateToridasCapacity(offeredWeightKg, avgWeightKg, config = {}, dateStr = '') {
    const cfg = { ...exports.DEFAULT_TORIDAS_CONFIG, ...config };
    const capPerLinePerShift = cfg.speedPerMachineHr * cfg.machinesPerLine * cfg.effectiveHoursPerShift;
    const max1ShiftPcs = capPerLinePerShift * cfg.totalLines;
    const max2ShiftPcs = max1ShiftPcs * 2;
    const safeAvgWeight = avgWeightKg > 0 ? avgWeightKg : 2.8;
    const pieceWeightKg = Math.max(0.1, (safeAvgWeight * 0.25) / 2);
    const offeredPieces = Math.round(offeredWeightKg / pieceWeightKg);
    const chickenCount = Math.round(offeredPieces / 2);
    const shiftsNeeded = offeredPieces > max1ShiftPcs ? 2 : 1;
    const maxPlantCapPieces = shiftsNeeded === 1 ? max1ShiftPcs : max2ShiftPcs;
    const acceptedPieces = Math.min(offeredPieces, maxPlantCapPieces);
    const overflowPieces = Math.max(0, offeredPieces - maxPlantCapPieces);
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
    const byProducts = [
        {
            name: 'กระดูกน่องสะโพกติดข้อเต็ม',
            itemCode: '111119187',
            yieldPercent: 20.6,
            weightKg: Number((toridasInputKg * 0.206).toFixed(2)),
        },
        {
            name: 'หนังติดมันเกรด A',
            itemCode: '111119118',
            yieldPercent: 2.8,
            weightKg: Number((toridasInputKg * 0.028).toFixed(2)),
        },
        {
            name: 'เศษ BL No.2',
            itemCode: '111119140',
            yieldPercent: 0.4,
            weightKg: Number((toridasInputKg * 0.004).toFixed(2)),
        },
        {
            name: 'เอ็นข้อไก่ (Knee Tendon)',
            itemCode: '111118201',
            yieldPercent: 0.8,
            weightKg: Number((toridasInputKg * 0.008).toFixed(2)),
        },
    ];
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
//# sourceMappingURL=toridasCapacity.js.map