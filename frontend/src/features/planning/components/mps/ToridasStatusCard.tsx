"use client";

import React from 'react';
import { Cog, Users, Layers, Gauge, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface ToridasByProduct {
  name: string;
  itemCode?: string;
  yieldPercent: number;
  weightKg: number;
}

export interface ToridasMetrics {
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
  byProducts?: ToridasByProduct[];
}

interface ToridasStatusCardProps {
  metrics: ToridasMetrics | null | undefined;
  isLoading?: boolean;
}

export function ToridasStatusCard({ metrics, isLoading }: ToridasStatusCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 shrink-0 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>
        <div className="h-10 bg-slate-100 rounded mb-2"></div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const isFullCapacity = metrics.capacityUtilizationPct >= 100;
  const isHighCapacity = metrics.capacityUtilizationPct >= 90;
  const hasOverflow = metrics.overflowPieces > 0;

  const getProgressColor = () => {
    if (isFullCapacity) return 'bg-red-500';
    if (isHighCapacity) return 'bg-amber-500';
    return 'bg-blue-600';
  };

  const getBadgeColor = () => {
    if (isFullCapacity) return 'bg-red-50 text-red-700 border-red-200';
    if (isHighCapacity) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden shrink-0">
      {/* Header */}
      <div className="bg-slate-100/70 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Cog size={14} className="animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-800 leading-tight">Toridas Machine Status</h3>
            <p className="text-[10px] text-slate-500">Asset TRD-01 (Auto Deboning Line)</p>
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1 ${getBadgeColor()}`}>
          <Gauge size={12} />
          <span>{metrics.capacityUtilizationPct}% Cap</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500 font-medium">Capacity Utilization</span>
            <span className="font-bold text-slate-700">{metrics.capacityUtilizationPct}%</span>
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
              <Layers size={12} />
              <span className="text-[10px] font-medium uppercase">Lines</span>
            </div>
            <p className="text-sm font-bold text-slate-800">{metrics.linesNeeded} <span className="text-[10px] text-slate-500 font-normal">/ 3</span></p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2">
            <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
              <Gauge size={12} />
              <span className="text-[10px] font-medium uppercase">Shifts</span>
            </div>
            <p className="text-sm font-bold text-slate-800">{metrics.shiftsNeeded} <span className="text-[10px] text-slate-500 font-normal">shifts</span></p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2">
            <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
              <Users size={12} />
              <span className="text-[10px] font-medium uppercase">Workers</span>
            </div>
            <p className="text-sm font-bold text-slate-800">{metrics.workersNeeded} <span className="text-[10px] text-slate-500 font-normal">prs</span></p>
          </div>
        </div>

        {/* Throughput Data */}
        <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5">
          <div className="flex justify-between text-slate-600">
            <span>Throughput Pieces:</span>
            <span className="font-semibold text-slate-800">{metrics.acceptedPieces.toLocaleString()} pcs</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Bone-in Input:</span>
            <span className="font-semibold text-slate-800">{metrics.toridasInputKg.toLocaleString()} kg</span>
          </div>
          <div className="flex justify-between text-primary font-medium">
            <span>Boneless Meat Out (BL):</span>
            <span className="font-bold text-primary">{metrics.bonelessOutputKg.toLocaleString()} kg</span>
          </div>
        </div>

        {/* By-Products / Co-Products Generated */}
        {metrics.byProducts && metrics.byProducts.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5 flex items-center justify-between">
              <span>Co-Products & By-Products</span>
              <span className="text-slate-500 font-normal">Yield: 24.6%</span>
            </p>
            <div className="space-y-1 text-xs">
              {metrics.byProducts.map((bp) => (
                <div key={bp.name} className="flex justify-between items-center text-slate-600 bg-slate-50/70 px-2 py-1 rounded border border-slate-100">
                  <span className="truncate pr-2 font-medium">{bp.name} <span className="text-slate-400 font-normal">({bp.yieldPercent}%)</span></span>
                  <span className="font-semibold text-slate-700 shrink-0">{bp.weightKg.toLocaleString()} kg</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overflow Alert Banner if needed */}
        {hasOverflow ? (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] flex items-start gap-1.5">
            <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Cap Exceeded: Diverted to Bone-in</p>
              <p className="text-[10px] text-amber-700">
                {metrics.overflowPieces.toLocaleString()} pcs ({metrics.overflowBoneInKg.toLocaleString()} kg) diverted to BIL Bone-in FG
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50/60 px-2 py-1 rounded border border-emerald-100">
            <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
            <span>100% Absorbed within machine capacity</span>
          </div>
        )}
      </div>
    </div>
  );
}
