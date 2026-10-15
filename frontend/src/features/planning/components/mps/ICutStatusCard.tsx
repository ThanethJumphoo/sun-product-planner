"use client";

import React, { useState, useMemo } from 'react';
import { Scissors, Gauge, Clock, ChevronDown, ChevronUp, AlertCircle, Info, Layers } from 'lucide-react';

export interface ICutItemDetail {
  itemCode: string;
  itemName: string;
  plannedQty: number;
  iCutSpeed: number;
  isDefaultSpeed: boolean;
  hoursNeeded: number;
  sharePercent: number;
  rmRequiredKg: number;
}

export interface ICutStatusCardProps {
  selectedDate?: Date | null;
  dailyPlans?: any[];
  specs?: Record<string, any>;
  isLoading?: boolean;
}

const KNOWN_ICUT_ITEM_CODES = new Set([
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

const DEFAULT_ICUT_SPEED_KG_H = 500;
const EFFECTIVE_HOURS_PER_SHIFT = 8;
const MAX_SHIFTS = 2;

export function ICutStatusCard({ selectedDate, dailyPlans = [], specs = {}, isLoading = false }: ICutStatusCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const metrics = useMemo(() => {
    if (!dailyPlans || dailyPlans.length === 0) {
      return {
        totalPlannedKg: 0,
        totalRmRequiredKg: 0,
        coProductBlbKg: 0,
        totalHoursNeeded: 0,
        shiftsNeeded: 0,
        availableHours: EFFECTIVE_HOURS_PER_SHIFT,
        capacityUtilizationPct: 0,
        status: 'idle' as const,
        items: [] as ICutItemDetail[],
        hasDefaultSpeedItems: false,
      };
    }

    // Filter plans that belong to I-CUT
    const icutPlans = dailyPlans.filter((p) => {
      const qty = Number(p.plannedQty) || 0;
      if (qty <= 0) return false;
      const spec = specs[p.itemCode];
      if (spec && typeof spec.iCutSpeed === 'number' && spec.iCutSpeed > 0) return true;
      if (KNOWN_ICUT_ITEM_CODES.has(p.itemCode)) return true;
      const desc = spec?.productName || spec?.itemDesc || p.itemDesc || '';
      return desc.includes('BLK') || desc.includes('I-CUT') || desc.includes('ICUT');
    });

    let totalPlannedKg = 0;
    let totalRmRequiredKg = 0;
    let totalHoursNeeded = 0;
    let hasDefaultSpeedItems = false;

    const rawItems: Array<{
      itemCode: string;
      itemName: string;
      plannedQty: number;
      iCutSpeed: number;
      isDefaultSpeed: boolean;
      hoursNeeded: number;
      rmRequiredKg: number;
    }> = [];

    for (const plan of icutPlans) {
      const qty = Number(plan.plannedQty) || 0;
      const spec = specs[plan.itemCode];
      const rawSpeed = Number(spec?.iCutSpeed);
      const hasCustomSpeed = !isNaN(rawSpeed) && rawSpeed > 0;
      const speed = hasCustomSpeed ? rawSpeed : DEFAULT_ICUT_SPEED_KG_H;
      const isDefaultSpeed = !hasCustomSpeed;
      if (isDefaultSpeed) hasDefaultSpeedItems = true;

      const hours = speed > 0 ? qty / speed : 0;
      const yieldPct = Number(spec?.yieldPercent) || 80;
      const rmReq = qty / (yieldPct / 100);

      totalPlannedKg += qty;
      totalRmRequiredKg += rmReq;
      totalHoursNeeded += hours;

      rawItems.push({
        itemCode: plan.itemCode,
        itemName: spec?.itemDesc || spec?.productName || plan.itemDesc || plan.itemCode,
        plannedQty: Number(qty.toFixed(2)),
        iCutSpeed: speed,
        isDefaultSpeed,
        hoursNeeded: Number(hours.toFixed(2)),
        rmRequiredKg: Number(rmReq.toFixed(2)),
      });
    }

    // 20% Co-product RM BLB (BL BLOCK)
    const coProductBlbKg = Number((totalRmRequiredKg * 0.2).toFixed(2));

    let shiftsNeeded = 0;
    if (totalHoursNeeded > 0) {
      shiftsNeeded = totalHoursNeeded <= EFFECTIVE_HOURS_PER_SHIFT ? 1 : 2;
    }

    const availableHours = shiftsNeeded === 0
      ? EFFECTIVE_HOURS_PER_SHIFT
      : shiftsNeeded * EFFECTIVE_HOURS_PER_SHIFT;

    const capacityUtilizationPct = totalHoursNeeded > 0
      ? Number(((totalHoursNeeded / availableHours) * 100).toFixed(1))
      : 0;

    let status: 'idle' | 'normal' | 'high' | 'overload' = 'idle';
    if (totalHoursNeeded > 0) {
      if (totalHoursNeeded > EFFECTIVE_HOURS_PER_SHIFT * MAX_SHIFTS) {
        status = 'overload';
      } else if (capacityUtilizationPct >= 90) {
        status = 'high';
      } else {
        status = 'normal';
      }
    }

    const items: ICutItemDetail[] = rawItems.map((item) => ({
      ...item,
      sharePercent: totalHoursNeeded > 0 ? Number(((item.hoursNeeded / totalHoursNeeded) * 100).toFixed(1)) : 0,
    }));

    return {
      totalPlannedKg: Number(totalPlannedKg.toFixed(2)),
      totalRmRequiredKg: Number(totalRmRequiredKg.toFixed(2)),
      coProductBlbKg,
      totalHoursNeeded: Number(totalHoursNeeded.toFixed(2)),
      shiftsNeeded,
      availableHours,
      capacityUtilizationPct,
      status,
      items,
      hasDefaultSpeedItems,
    };
  }, [dailyPlans, specs]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 shrink-0 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>
        <div className="h-10 bg-slate-100 rounded mb-2"></div>
      </div>
    );
  }

  const getProgressColor = () => {
    switch (metrics.status) {
      case 'overload':
        return 'bg-red-500';
      case 'high':
        return 'bg-amber-500';
      case 'normal':
        return 'bg-indigo-600';
      default:
        return 'bg-slate-300';
    }
  };

  const getBadgeStyle = () => {
    switch (metrics.status) {
      case 'overload':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'normal':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden shrink-0">
      {/* Header */}
      <div className="bg-slate-100/70 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Scissors size={14} className="-rotate-45" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-800 leading-tight">I-CUT Machine Status</h3>
            <p className="text-[10px] text-slate-500">Asset ICUT-01 (BL Dicing & Portioning Line)</p>
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1 ${getBadgeStyle()}`}>
          <Gauge size={12} />
          <span>
            {metrics.status === 'idle' ? 'Idle (0% Cap)' : `${metrics.capacityUtilizationPct}% Cap`}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500 font-medium">Capacity Utilization</span>
            <span className="font-bold text-slate-700">
              {metrics.status === 'idle' ? '0%' : `${metrics.capacityUtilizationPct}%`}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${getProgressColor()}`}
              style={{ width: `${Math.min(100, metrics.capacityUtilizationPct)}%` }}
            />
          </div>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2">
            <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
              <Clock size={12} />
              <span className="text-[10px] font-medium uppercase">Hours</span>
            </div>
            <p className="text-sm font-bold text-slate-800">
              {metrics.totalHoursNeeded.toFixed(1)}{' '}
              <span className="text-[10px] text-slate-500 font-normal">/ {metrics.availableHours}h</span>
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2">
            <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
              <Gauge size={12} />
              <span className="text-[10px] font-medium uppercase">Shifts</span>
            </div>
            <p className="text-sm font-bold text-slate-800">
              {metrics.shiftsNeeded === 0 ? 'Idle' : `${metrics.shiftsNeeded} shift${metrics.shiftsNeeded > 1 ? 's' : ''}`}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2">
            <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
              <Layers size={12} />
              <span className="text-[10px] font-medium uppercase">Cut BLK</span>
            </div>
            <p className="text-sm font-bold text-indigo-700">
              {metrics.totalPlannedKg > 0 ? metrics.totalPlannedKg.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}{' '}
              <span className="text-[10px] text-slate-500 font-normal">kg</span>
            </p>
          </div>
        </div>

        {/* Throughput Data */}
        <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5">
          <div className="flex justify-between text-slate-600">
            <span>RM BL Input Required (80% Yield):</span>
            <span className="font-semibold text-slate-800">
              {metrics.totalRmRequiredKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg
            </span>
          </div>
          <div className="flex justify-between text-indigo-700 font-medium">
            <span>BLK Finished Products Output:</span>
            <span className="font-bold text-indigo-700">
              {metrics.totalPlannedKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg
            </span>
          </div>
          <div className="flex justify-between text-amber-700 font-medium">
            <span>Co-Product Generated (BL BLOCK - 20%):</span>
            <span className="font-bold text-amber-700">
              {metrics.coProductBlbKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg
            </span>
          </div>
        </div>

        {/* Item Details Accordion */}
        {metrics.items.length > 0 ? (
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 py-1 font-medium transition-colors"
            >
              <span>Planned I-CUT Items ({metrics.items.length})</span>
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isExpanded && (
              <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {metrics.items.map((item) => (
                  <div
                    key={item.itemCode}
                    className="p-2 bg-slate-50 border border-slate-200/70 rounded-md text-xs space-y-1"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <div className="font-medium text-slate-800 truncate" title={item.itemName}>
                        {item.itemName}
                      </div>
                      <span className="text-[11px] font-bold text-indigo-700 shrink-0">
                        {item.plannedQty.toLocaleString()} kg
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>
                        Speed: {item.iCutSpeed} kg/h
                        {item.isDefaultSpeed && (
                          <span className="text-[10px] text-amber-600 ml-1">(default)</span>
                        )}
                      </span>
                      <span className="font-medium text-slate-600">
                        {item.hoursNeeded}h ({item.sharePercent}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="pt-2 border-t border-slate-100 text-center py-2 text-xs text-slate-400">
            No BLK items planned on this date. Machine is idle.
          </div>
        )}

        {/* Notice for Default Speeds */}
        {metrics.hasDefaultSpeedItems && (
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg p-2 text-[11px] text-amber-700 flex items-start gap-1.5">
            <Info size={13} className="shrink-0 mt-0.5 text-amber-600" />
            <span>
              Some items use default speed ({DEFAULT_ICUT_SPEED_KG_H} kg/h). Configure item speed in Product Spec for exact capacity.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ICutStatusCard;
