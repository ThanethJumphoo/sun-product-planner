"use client";

import React, { useState, useEffect } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Plus, Trash2, Save } from 'lucide-react';

interface TransferRecord {
  id: string;
  type: 'IN' | 'OUT';
  rmSize: string;
  qty: number;
  sourceDest: string;
}

export default function SublotRmTransfer({
  sublot,
  allSublots,
  rmSizes = ['<40g', '40-45g', '45-50g', '50-55g', '55-60g', '60-65g', '65-70g', '>70g'],
  transfers = [],
  allTransfers = {},
  onChange,
  onSave,
  isSaving
}: {
  sublot: string;
  allSublots: string[];
  rmSizes?: string[];
  transfers?: TransferRecord[];
  allTransfers?: Record<string, TransferRecord[]>;
  onChange?: (transfers: TransferRecord[]) => void;
  onSave?: () => void;
  isSaving?: boolean;
}) {
  const currentIndex = allSublots.indexOf(sublot);
  const isFirstSublot = currentIndex === 0;
  const isLastSublot = currentIndex === allSublots.length - 1;

  // Default sources and destinations based on rules
  const defaultIncomingSource = isFirstSublot ? 'Previous Day' : `Sublot ${allSublots[currentIndex - 1]}`;
  const defaultOutgoingDest = isLastSublot ? 'Next Day' : (allSublots[currentIndex + 1] ? `Sublot ${allSublots[currentIndex + 1]}` : 'Next Day');

  // Add new incoming RM
  const addIncoming = () => {
    onChange?.([...transfers, {
      id: Math.random().toString(),
      type: 'IN',
      rmSize: rmSizes[0],
      qty: 0,
      sourceDest: defaultIncomingSource
    }]);
  };

  // Add new outgoing RM
  const addOutgoing = () => {
    onChange?.([...transfers, {
      id: Math.random().toString(),
      type: 'OUT',
      rmSize: rmSizes[0],
      qty: 0,
      sourceDest: defaultOutgoingDest
    }]);
  };

  const removeTransfer = (id: string) => {
    onChange?.(transfers.filter(t => t.id !== id));
  };

  const updateTransfer = (id: string, field: keyof TransferRecord, value: any) => {
    onChange?.(transfers.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  // For Sublots > 1, compute incoming transfers from previous sublots
  const computedIncomingTransfers: TransferRecord[] = [];
  if (!isFirstSublot) {
    Object.entries(allTransfers).forEach(([sourceSublot, sourceTransfers]) => {
      sourceTransfers.forEach(t => {
        if (t.type === 'OUT' && t.sourceDest === `Sublot ${sublot}`) {
          computedIncomingTransfers.push({
            id: `auto-${t.id}`,
            type: 'IN',
            rmSize: t.rmSize,
            qty: t.qty,
            sourceDest: `Sublot ${sourceSublot}`,
            isAuto: true
          } as any);
        }
      });
    });
  }

  // Incoming includes manual transfers (for Sublot 1) + computed automatic transfers
  const incomingTransfers = [
    ...transfers.filter(t => t.type === 'IN'),
    ...computedIncomingTransfers
  ];
  const outgoingTransfers = transfers.filter(t => t.type === 'OUT');

  // Filter available destinations for Outgoing
  const availableDestinations = isLastSublot 
    ? ['Next Day'] 
    : ['Next Day', ...allSublots.filter(s => s !== sublot).map(s => `Sublot ${s}`)];

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-6">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-800">RM Transfer (Sublot {sublot})</h3>
          <p className="text-xs text-slate-500 mt-1">Manage incoming and outgoing raw materials for this sublot</p>
        </div>
        <button 
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Save size={14} />
          {isSaving ? 'Saving...' : 'Save Transfers'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        
        {/* INCOMING SECTION */}
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-emerald-700 flex items-center gap-2">
              <div className="p-1 bg-emerald-100 rounded">
                <ArrowDownToLine size={14} />
              </div>
              RM Received (Incoming)
            </h4>
            {isFirstSublot && (
              <button 
                onClick={addIncoming}
                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                title="Add Incoming RM"
              >
                <Plus size={16} />
              </button>
            )}
          </div>

          {incomingTransfers.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p className="text-sm text-slate-400 font-medium">No incoming RM</p>
            </div>
          ) : (
            <div className="space-y-2">
              {incomingTransfers.map(t => (
                <div key={t.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <div className="flex-1">
                    <select 
                      value={t.rmSize}
                      onChange={(e) => updateTransfer(t.id, 'rmSize', e.target.value)}
                      className="w-full text-sm border-slate-200 rounded p-1.5 bg-white disabled:bg-slate-50 disabled:text-slate-500"
                      disabled={(t as any).isAuto}
                    >
                      {rmSizes.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="w-24">
                    <input 
                      type="number"
                      value={t.qty}
                      onChange={(e) => updateTransfer(t.id, 'qty', Number(e.target.value))}
                      className="w-full text-sm border-slate-200 rounded p-1.5 text-right font-medium text-emerald-700 bg-white disabled:bg-slate-50"
                      placeholder="Qty (kg)"
                      disabled={(t as any).isAuto}
                    />
                  </div>
                  <div className="w-32">
                    <input 
                      type="text"
                      disabled
                      value={t.sourceDest}
                      className="w-full text-sm border-slate-200 rounded p-1.5 bg-slate-100 text-slate-500 cursor-not-allowed"
                      title={isFirstSublot ? "First sublot always receives from YESTERDAY" : "Receives from PREVIOUS sublot"}
                    />
                  </div>
                  {!(t as any).isAuto && (
                    <button 
                      onClick={() => removeTransfer(t.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* OUTGOING SECTION */}
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-blue-700 flex items-center gap-2">
              <div className="p-1 bg-blue-100 rounded">
                <ArrowUpFromLine size={14} />
              </div>
              RM Transferred (Outgoing)
            </h4>
            <button 
              onClick={addOutgoing}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Add Outgoing RM"
            >
              <Plus size={16} />
            </button>
          </div>

          {outgoingTransfers.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p className="text-sm text-slate-400 font-medium">No outgoing RM</p>
            </div>
          ) : (
            <div className="space-y-2">
              {outgoingTransfers.map(t => (
                <div key={t.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <div className="flex-1">
                    <select 
                      value={t.rmSize}
                      onChange={(e) => updateTransfer(t.id, 'rmSize', e.target.value)}
                      className="w-full text-sm border-slate-200 rounded p-1.5 bg-white"
                    >
                      {rmSizes.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="w-24">
                    <input 
                      type="number"
                      value={t.qty}
                      onChange={(e) => updateTransfer(t.id, 'qty', Number(e.target.value))}
                      className="w-full text-sm border-slate-200 rounded p-1.5 text-right font-medium text-blue-700 bg-white"
                      placeholder="Qty (kg)"
                    />
                  </div>
                  <div className="w-32">
                    {isLastSublot ? (
                      <input 
                        type="text"
                        disabled
                        value={t.sourceDest}
                        className="w-full text-sm border-slate-200 rounded p-1.5 bg-slate-100 text-slate-500 cursor-not-allowed"
                        title="Last sublot always transfers to TOMORROW"
                      />
                    ) : (
                      <select 
                        value={t.sourceDest}
                        onChange={(e) => updateTransfer(t.id, 'sourceDest', e.target.value)}
                        className="w-full text-sm border-slate-200 rounded p-1.5 bg-white text-slate-700"
                      >
                        {availableDestinations.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    )}
                  </div>
                  <button 
                    onClick={() => removeTransfer(t.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
