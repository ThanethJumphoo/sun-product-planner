"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KNOWN_ICUT_ITEM_CODES = exports.DEFAULT_ICUT_CONFIG = void 0;
exports.isICutItem = isICutItem;
exports.calculateICutCapacity = calculateICutCapacity;
exports.DEFAULT_ICUT_CONFIG = {
    defaultSpeedKgH: 500,
    effectiveHoursPerShift: 8,
    maxShifts: 2,
};
exports.KNOWN_ICUT_ITEM_CODES = new Set([
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
function isICutItem(itemCode, spec, icutItemSet) {
    if (spec && typeof spec.iCutSpeed === 'number' && spec.iCutSpeed > 0) {
        return true;
    }
    if (icutItemSet && icutItemSet.has(itemCode)) {
        return true;
    }
    if (exports.KNOWN_ICUT_ITEM_CODES.has(itemCode)) {
        return true;
    }
    const desc = spec?.itemDesc || spec?.productName || '';
    if (desc.includes('BLK') || desc.includes('I-CUT') || desc.includes('ICUT')) {
        return true;
    }
    return false;
}
function calculateICutCapacity(plans, specsMap = {}, config = {}, dateStr = '', icutItemSet) {
    const cfg = { ...exports.DEFAULT_ICUT_CONFIG, ...config };
    const icutPlans = plans.filter((p) => {
        const qty = Number(p.plannedQty) || 0;
        if (qty <= 0)
            return false;
        const spec = specsMap[p.itemCode];
        return isICutItem(p.itemCode, spec, icutItemSet);
    });
    let totalPlannedKg = 0;
    let totalRmRequiredKg = 0;
    let totalHoursNeeded = 0;
    const itemDetails = [];
    for (const p of icutPlans) {
        const qty = Number(p.plannedQty) || 0;
        const spec = specsMap[p.itemCode];
        const rawSpeed = Number(spec?.iCutSpeed);
        const hasCustomSpeed = !isNaN(rawSpeed) && rawSpeed > 0;
        const speed = hasCustomSpeed ? rawSpeed : cfg.defaultSpeedKgH;
        const isDefaultSpeed = !hasCustomSpeed;
        const hours = speed > 0 ? qty / speed : 0;
        const yieldPct = Number(spec?.yieldPercent) || 80;
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
    const coProductBlbKg = Number((totalRmRequiredKg * 0.2).toFixed(2));
    let shiftsNeeded = 0;
    if (totalHoursNeeded > 0) {
        if (totalHoursNeeded <= cfg.effectiveHoursPerShift) {
            shiftsNeeded = 1;
        }
        else {
            shiftsNeeded = 2;
        }
    }
    const availableHours = shiftsNeeded === 0
        ? cfg.effectiveHoursPerShift
        : shiftsNeeded * cfg.effectiveHoursPerShift;
    const capacityUtilizationPct = totalHoursNeeded > 0
        ? Number(((totalHoursNeeded / availableHours) * 100).toFixed(1))
        : 0;
    let status = 'idle';
    if (totalHoursNeeded > 0) {
        if (totalHoursNeeded > cfg.effectiveHoursPerShift * cfg.maxShifts) {
            status = 'overload';
        }
        else if (capacityUtilizationPct >= 90) {
            status = 'high';
        }
        else {
            status = 'normal';
        }
    }
    const items = itemDetails.map((item) => ({
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
        effectiveHoursPerShift: cfg.effectiveHoursPerShift,
        maxShifts: cfg.maxShifts,
        shiftsNeeded,
        availableHours,
        capacityUtilizationPct,
        status,
        items,
    };
}
//# sourceMappingURL=icutCapacity.js.map