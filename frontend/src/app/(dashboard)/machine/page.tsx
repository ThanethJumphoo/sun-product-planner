"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { 
  Cog, 
  Scissors, 
  Layers, 
  Sliders, 
  ArrowRightLeft, 
  CheckCircle2, 
  Info, 
  Cpu, 
  Scale, 
  Activity, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { BeltGateSizingMatrix } from './components/BeltGateSizingMatrix';

interface MachineOption {
  id: string;
  name: string;
  code: string;
  type: string;
  description: string;
  icon: React.ElementType;
  badge: string;
}

const MACHINES: MachineOption[] = [
  {
    id: 'belt-gate',
    name: 'Belt Gate',
    code: 'BG-01',
    type: 'RM Sizing Machine',
    description: 'เครื่องจักรจัดไซส์ RM และคัดแยกขนาดน้ำหนักวัตถุดิบ',
    icon: Filter,
    badge: 'RM Sizing'
  },
  {
    id: 'icut',
    name: 'I-Cut',
    code: 'ICUT-01',
    type: 'Intelligent Cutting Machine',
    description: 'เครื่องตัดอัจฉริยะ (Main FG BLK 80% / BL Block 20%)',
    icon: Scissors,
    badge: 'Cap 37h/day'
  },
  {
    id: 'toridas',
    name: 'Toridas',
    code: 'TRD-01',
    type: 'Auto Deboning Line',
    description: 'เครื่องเลาะกระดูกสะโพกไก่อัตโนมัติ (BIL -> BL)',
    icon: Cog,
    badge: 'Auto Deboning'
  }
];

export default function MachinePage() {
  const [machines] = useState<MachineOption[]>(MACHINES);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('belt-gate');
  const [parts, setParts] = useState<string[]>([]);
  const [selectedPart, setSelectedPart] = useState<string>('BL');
  const [isLoadingParts, setIsLoadingParts] = useState(true);

  // Data for selected part (RM sizes / Weight distribution)
  const [rmSizes, setRmSizes] = useState<any[]>([]);
  const [isLoadingRmSizes, setIsLoadingRmSizes] = useState(false);

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    setIsLoadingParts(true);
    try {
      const res = await api.get('/api/v1/simulator/boards/menu');
      const partNames = res.data.map((p: any) => p.name);
      setParts(partNames);
      if (partNames.includes('BL')) {
        setSelectedPart('BL');
      } else if (partNames.length > 0) {
        setSelectedPart(partNames[0]);
      }
    } catch (err) {
      toast.error('Failed to fetch parts list');
    } finally {
      setIsLoadingParts(false);
    }
  };

  useEffect(() => {
    if (!selectedPart) return;
    fetchRmSizes(selectedPart);
  }, [selectedPart]);

  const fetchRmSizes = async (part: string) => {
    setIsLoadingRmSizes(true);
    try {
      const res = await api.get('/api/v1/weight-distribution', { params: { partName: part } });
      if (Array.isArray(res.data) && res.data.length > 0) {
        // Extract unique RM sizes
        const sizesMap = new Map();
        res.data.forEach((row: any) => {
          row.rmSizes?.forEach((rmDist: any) => {
            const rm = rmDist.rmSize;
            if (rm && !sizesMap.has(rm.id)) {
              sizesMap.set(rm.id, {
                id: rm.id,
                minSize: rm.minSize,
                maxSize: rm.maxSize,
                name: rm.minSize && rm.maxSize 
                  ? `${rm.minSize}-${rm.maxSize}g` 
                  : rm.minSize ? `>${rm.minSize}g` 
                  : rm.maxSize ? `<${rm.maxSize}g` 
                  : 'Unsize',
              });
            }
          });
        });
        const list = Array.from(sizesMap.values()).sort((a, b) => (a.minSize || 0) - (b.minSize || 0));
        setRmSizes(list);
      } else {
        setRmSizes([]);
      }
    } catch (e) {
      console.error('Failed to fetch RM sizes', e);
      setRmSizes([]);
    } finally {
      setIsLoadingRmSizes(false);
    }
  };

  const selectedMachine = machines.find(m => m.id === selectedMachineId) || machines[0];

  if (isLoadingParts) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600 animate-pulse">Loading Machine Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-50 overflow-hidden">
      {/* Left Sidebar for Machines & Parts */}
      <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-border flex flex-col shrink-0 md:h-full max-h-[350px] md:max-h-none overflow-y-auto">
        
        {/* Top Section: Machines (กล่องแดงส่วนบน) */}
        <div className="p-4 border-b border-border bg-slate-50/70 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Cpu size={14} className="text-primary" />
              <span>Machines</span>
            </h2>
            <span className="text-[10px] bg-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
              {machines.length}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-2.5">Select machine to configure</p>
          
          <div className="space-y-1.5">
            {machines.map((machine) => {
              const isSelected = selectedMachineId === machine.id;
              const Icon = machine.icon;
              return (
                <button
                  key={machine.id}
                  onClick={() => setSelectedMachineId(machine.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="text-sm font-bold truncate leading-tight">{machine.name}</div>
                      <div className={`text-[10px] truncate ${isSelected ? 'text-primary-foreground/80' : 'text-slate-400'}`}>
                        {machine.code}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={14} className={`shrink-0 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Section: Parts (กรอบสี่เหลี่ยมล่าง) */}
        <div className="p-4 pb-2 border-b border-border bg-slate-50/70 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={14} className="text-primary" />
              <span>Parts</span>
            </h2>
            <span className="text-[10px] bg-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
              {parts.length}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">Select a part to view machine config</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {parts.length === 0 ? (
            <div className="text-sm text-center py-4 text-muted-foreground">No parts found</div>
          ) : (
            parts.map((part) => {
              const isSelected = selectedPart === part;
              return (
                <button
                  key={part}
                  onClick={() => setSelectedPart(part)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{part}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50/50 p-4 sm:p-6 space-y-5">
        
        {/* Top Header Card */}
        <div className="bg-white rounded-xl shadow-2xs border border-border p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <selectedMachine.icon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {selectedMachine.name} Machine
                </h1>
                <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  {selectedMachine.code}
                </span>
                <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  Part: {selectedPart}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedMachine.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
            <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Active in Flow</span>
            </div>
          </div>
        </div>

        {/* Content Details based on Selected Machine */}
        {selectedMachineId === 'belt-gate' && (
          <BeltGateSizingMatrix partName={selectedPart} />
        )}

        {/* Content for I-Cut */}
        {selectedMachineId === 'icut' && (
          <div className="bg-white rounded-xl shadow-xs border border-border p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Scissors size={18} className="text-primary -rotate-45" />
                <h3 className="text-base font-bold text-slate-800">
                  I-Cut Machine (เครื่องตัดอัจฉริยะ) - {selectedPart}
                </h3>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full font-semibold">
                Cap: 37.0 ชม./วัน
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80">
                <div className="text-xs text-slate-500 font-medium uppercase mb-1">ขีดจำกัดเวลา (Max Time)</div>
                <div className="text-lg font-bold text-slate-800">37.0 ชม./วัน</div>
                <div className="text-xs text-slate-500 mt-1">2 เครื่อง × 2 กะ × 9.25 ชม./กะ</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80">
                <div className="text-xs text-slate-500 font-medium uppercase mb-1">สัดส่วนผลผลิต (Yields)</div>
                <div className="text-lg font-bold text-indigo-700">Main 80% / BLB 20%</div>
                <div className="text-xs text-slate-500 mt-1">Main FG BLK (80%) และ BL Block (20%)</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80">
                <div className="text-xs text-slate-500 font-medium uppercase mb-1">ความเร็ว (Speed)</div>
                <div className="text-lg font-bold text-slate-800">1,000 - 1,250 kg/h</div>
                <div className="text-xs text-slate-500 mt-1">ดึงตามรายสินค้าจาก Product Spec</div>
              </div>
            </div>
          </div>
        )}

        {/* Content for Toridas */}
        {selectedMachineId === 'toridas' && (
          <div className="bg-white rounded-xl shadow-xs border border-border p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Cog size={18} className="text-primary animate-spin-slow" />
                <h3 className="text-base font-bold text-slate-800">
                  Toridas Machine (Auto Deboning) - {selectedPart}
                </h3>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
                TRD-01
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-600">
              เครื่องเลาะกระดูกสะโพกไก่อัตโนมัติ (BIL -&gt; BL) ทำงานร่วมกับสายการผลิต 3 สาย (BL, BL-TH, BL-DR)
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
