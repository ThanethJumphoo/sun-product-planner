"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { 
  Plus, 
  Trash2, 
  Save, 
  RotateCcw, 
  Search, 
  Layers, 
  Scissors, 
  X, 
  Check, 
  AlertCircle, 
  HelpCircle,
  LayoutGrid,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  Gauge,
  Sliders,
  Filter,
  CheckCircle2
} from 'lucide-react';

export interface SizingRuleItem {
  priority: number;
  rmSize: string;
  yieldPercent: number;
}

export interface SizingGroup {
  id: string;
  groupName: string;
  minSize?: number | null;
  maxSize?: number | null;
  itemCodes: string[];
  rules: SizingRuleItem[];
}

interface BeltGateSizingMatrixProps {
  partName: string;
}

export const DEFAULT_BELT_GATE_BL_GROUPS: SizingGroup[] = [
  {
    id: 'grp_blk_25_30',
    groupName: 'BLK 25-30, 25-29 G',
    minSize: 25,
    maxSize: 30,
    itemCodes: ['1111172B7', '211117114'],
    rules: [
      { priority: 1, rmSize: '225-243', yieldPercent: 83.40 },
      { priority: 2, rmSize: '360-380', yieldPercent: 80.25 },
      { priority: 3, rmSize: '260-280', yieldPercent: 80.36 },
      { priority: 4, rmSize: '300-320', yieldPercent: 80.19 },
      { priority: 5, rmSize: '340-360', yieldPercent: 79.62 },
      { priority: 6, rmSize: '320-340', yieldPercent: 79.43 },
      { priority: 7, rmSize: '270-280', yieldPercent: 77.39 },
    ],
  },
  {
    id: 'grp_blk_30_40',
    groupName: 'BLK 30-40 G',
    minSize: 30,
    maxSize: 40,
    itemCodes: ['1111172B0', '211117113'],
    rules: [
      { priority: 1, rmSize: '300-320', yieldPercent: 83.40 },
      { priority: 2, rmSize: '260-280', yieldPercent: 82.06 },
      { priority: 3, rmSize: '340-360', yieldPercent: 80.36 },
      { priority: 4, rmSize: '280-300', yieldPercent: 80.19 },
      { priority: 5, rmSize: '320-340', yieldPercent: 79.43 },
      { priority: 6, rmSize: '360-380', yieldPercent: 78.39 },
    ],
  },
  {
    id: 'grp_blk_20_25',
    groupName: 'BLK 20-25 G',
    minSize: 20,
    maxSize: 25,
    itemCodes: ['211117135'],
    rules: [
      { priority: 1, rmSize: '280-300', yieldPercent: 80.81 },
      { priority: 2, rmSize: '260-280', yieldPercent: 79.81 },
    ],
  },
  {
    id: 'grp_blk_35_45',
    groupName: 'BLK 35-45 G',
    minSize: 35,
    maxSize: 45,
    itemCodes: ['211117126'],
    rules: [
      { priority: 1, rmSize: '340-360', yieldPercent: 78.00 },
      { priority: 2, rmSize: '220-240', yieldPercent: 77.00 },
    ],
  },
  {
    id: 'grp_blk_8_12',
    groupName: 'BLK 8-12 G',
    minSize: 8,
    maxSize: 12,
    itemCodes: ['211117130'],
    rules: [
      { priority: 1, rmSize: '260-280', yieldPercent: 78.00 },
      { priority: 2, rmSize: '280-300', yieldPercent: 73.75 },
      { priority: 3, rmSize: '300-325', yieldPercent: 72.37 },
    ],
  },
  {
    id: 'grp_blk_53_58',
    groupName: 'BLK 53-58 G',
    minSize: 53,
    maxSize: 58,
    itemCodes: ['211117111'],
    rules: [
      { priority: 1, rmSize: '260-280', yieldPercent: 77.43 },
      { priority: 2, rmSize: '340-360', yieldPercent: 76.05 },
      { priority: 3, rmSize: '320-340', yieldPercent: 76.02 },
    ],
  },
  {
    id: 'grp_blk_30_35',
    groupName: 'BLK 30-35 G',
    minSize: 30,
    maxSize: 35,
    itemCodes: ['211117132'],
    rules: [
      { priority: 1, rmSize: '300-320', yieldPercent: 80.90 },
      { priority: 2, rmSize: '330-340', yieldPercent: 78.50 },
      { priority: 3, rmSize: '260-280', yieldPercent: 78.00 },
    ],
  },
];

export function BeltGateSizingMatrix({ partName }: BeltGateSizingMatrixProps) {
  const [groups, setGroups] = useState<SizingGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Active tab per card: group.id -> 'rules' | 'items'
  const [activeCardTabs, setActiveCardTabs] = useState<Record<string, 'rules' | 'items'>>({});

  // Part RM sizes for dropdown
  const [availableRmSizes, setAvailableRmSizes] = useState<string[]>([]);
  
  // Part items for assignment
  const [partItems, setPartItems] = useState<any[]>([]);
  const [itemSpecs, setItemSpecs] = useState<Record<string, any>>({});

  // Modal state: Create Group
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newMinSize, setNewMinSize] = useState<string>('');
  const [newMaxSize, setNewMaxSize] = useState<string>('');

  // Modal state: Add Items to Group
  const [targetGroupForItems, setTargetGroupForItems] = useState<SizingGroup | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, [partName]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Sizing Configs from backend
      const configRes = await api.get(`/api/v1/machine-sizing/belt-gate/${encodeURIComponent(partName)}`);
      if (Array.isArray(configRes.data) && configRes.data.length > 0) {
        setGroups(configRes.data);
      } else if (partName.toUpperCase() === 'BL') {
        setGroups(DEFAULT_BELT_GATE_BL_GROUPS);
      } else {
        setGroups([]);
      }

      // 2. Fetch Part RM Sizes
      const wdRes = await api.get('/api/v1/weight-distribution', { params: { partName } });
      const sizeSet = new Set<string>();
      if (Array.isArray(wdRes.data)) {
        wdRes.data.forEach((row: any) => {
          row.rmSizes?.forEach((rmDist: any) => {
            const rm = rmDist.rmSize;
            if (rm) {
              const name = rm.minSize && rm.maxSize 
                ? `${rm.minSize}-${rm.maxSize}` 
                : rm.minSize ? `>${rm.minSize}` 
                : rm.maxSize ? `<${rm.maxSize}` 
                : 'Unsize';
              sizeSet.add(name);
            }
          });
        });
      }
      
      // Fallback standard sizes
      const defaultSizes = ['220-240', '225-243', '260-280', '270-280', '280-300', '300-320', '300-325', '320-340', '330-340', '340-360', '360-380'];
      defaultSizes.forEach(s => sizeSet.add(s));
      setAvailableRmSizes(Array.from(sizeSet));

      // 3. Fetch Items belonging to Part
      const itemsRes = await api.get('/api/v1/product-spec/items', { params: { partName } });
      const itemsList = Array.isArray(itemsRes.data) ? itemsRes.data : [];
      setPartItems(itemsList);

      // 4. Fetch specs for items
      const specsMap: Record<string, any> = {};
      await Promise.all(
        itemsList.slice(0, 50).map(async (itm: any) => {
          try {
            const sRes = await api.get(`/api/v1/product-spec/${itm.erpItemCode}`);
            if (sRes.data) specsMap[itm.erpItemCode] = sRes.data;
          } catch (e) {}
        })
      );
      setItemSpecs(specsMap);

    } catch (e) {
      console.error('Failed to load initial data', e);
      toast.error('ไม่สามารถโหลดข้อมูล Belt Gate Sizing ได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await api.post(`/api/v1/machine-sizing/belt-gate/${encodeURIComponent(partName)}`, {
        groups,
      });
      toast.success('บันทึกข้อมูล Belt Gate Sizing Matrix เรียบร้อยแล้ว');
    } catch (e) {
      console.error('Failed to save sizing configs', e);
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('คุณต้องการรีเซ็ตเป็นค่าเริ่มต้นตามตารางมาตรฐานของระบบหรือไม่?')) {
      setGroups(DEFAULT_BELT_GATE_BL_GROUPS);
      toast.success('รีเซ็ตเป็นค่ามาตรฐานแล้ว (อย่าลืมกดบันทึก)');
    }
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error('กรุณาระบุชื่อหัวข้อกลุ่มไซส์');
      return;
    }

    const newGroup: SizingGroup = {
      id: `grp_${Date.now()}`,
      groupName: newGroupName.trim(),
      minSize: newMinSize ? Number(newMinSize) : null,
      maxSize: newMaxSize ? Number(newMaxSize) : null,
      itemCodes: [],
      rules: [
        { priority: 1, rmSize: availableRmSizes[0] || '260-280', yieldPercent: 80.0 },
      ],
    };

    setGroups([...groups, newGroup]);
    setNewGroupName('');
    setNewMinSize('');
    setNewMaxSize('');
    setIsCreateModalOpen(false);
    toast.success(`สร้างหัวข้อ ${newGroup.groupName} เรียบร้อยแล้ว`);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm('คุณต้องการลบกลุ่มไซส์นี้หรือไม่?')) {
      setGroups(groups.filter(g => g.id !== groupId));
    }
  };

  const handleAddRule = (groupId: string) => {
    setGroups(groups.map(g => {
      if (g.id !== groupId) return g;
      const nextPriority = g.rules.length > 0 ? Math.max(...g.rules.map(r => r.priority)) + 1 : 1;
      return {
        ...g,
        rules: [
          ...g.rules,
          { priority: nextPriority, rmSize: availableRmSizes[0] || '260-280', yieldPercent: 80.0 }
        ]
      };
    }));
  };

  const handleUpdateRule = (groupId: string, ruleIndex: number, field: keyof SizingRuleItem, value: any) => {
    setGroups(groups.map(g => {
      if (g.id !== groupId) return g;
      const newRules = [...g.rules];
      newRules[ruleIndex] = {
        ...newRules[ruleIndex],
        [field]: field === 'priority' || field === 'yieldPercent' ? Number(value) : value,
      };
      return { ...g, rules: newRules };
    }));
  };

  const handleDeleteRule = (groupId: string, ruleIndex: number) => {
    setGroups(groups.map(g => {
      if (g.id !== groupId) return g;
      const newRules = g.rules.filter((_, idx) => idx !== ruleIndex);
      return { ...g, rules: newRules };
    }));
  };

  const handleRemoveItem = (groupId: string, itemCode: string) => {
    setGroups(groups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        itemCodes: g.itemCodes.filter(c => c !== itemCode),
      };
    }));
  };

  const handleToggleItemInTargetGroup = (itemCode: string) => {
    if (!targetGroupForItems) return;
    const exists = targetGroupForItems.itemCodes.includes(itemCode);
    const updatedCodes = exists 
      ? targetGroupForItems.itemCodes.filter(c => c !== itemCode)
      : [...targetGroupForItems.itemCodes, itemCode];

    setTargetGroupForItems({
      ...targetGroupForItems,
      itemCodes: updatedCodes,
    });

    setGroups(groups.map(g => {
      if (g.id !== targetGroupForItems.id) return g;
      return { ...g, itemCodes: updatedCodes };
    }));
  };

  const handleUpdateItemSpeed = async (itemCode: string, speedVal: number) => {
    try {
      await api.put(`/api/v1/product-spec/${itemCode}`, {
        ...itemSpecs[itemCode],
        iCutSpeed: speedVal,
      });
      setItemSpecs(prev => ({
        ...prev,
        [itemCode]: { ...prev[itemCode], iCutSpeed: speedVal }
      }));
      toast.success(`อัปเดต I-Cut Speed ของ ${itemCode} เป็น ${speedVal} kg/h`);
    } catch (e) {
      toast.error('ไม่สามารถอัปเดต Speed ได้');
    }
  };

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase();
    return groups.filter(g => 
      g.groupName.toLowerCase().includes(q) ||
      g.itemCodes.some(c => c.toLowerCase().includes(q))
    );
  }, [groups, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-slate-500">กำลังโหลด Sizing Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        
        {/* Search & Counter */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input 
              type="text"
              placeholder="ค้นหากลุ่มไซส์ หรือ รหัสสินค้า..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 whitespace-nowrap">
            {filteredGroups.length} กลุ่ม
          </span>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-primary font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Card View"
            >
              <LayoutGrid size={13} />
              <span className="hidden sm:inline">การ์ด</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-primary font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <TableIcon size={13} />
              <span className="hidden sm:inline">ตารางรวม</span>
            </button>
          </div>

          {partName.toUpperCase() === 'BL' && (
            <button
              onClick={handleResetDefaults}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <RotateCcw size={13} className="text-slate-500" />
              <span>ค่าเริ่มต้น</span>
            </button>
          )}

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus size={14} />
            <span>สร้างกลุ่มไซส์</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด'}</span>
          </button>
        </div>
      </div>

      {/* View Mode 1: Sizing Groups Cards Grid */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
          {filteredGroups.map((group) => {
            const currentTab = activeCardTabs[group.id] || 'rules';

            return (
              <div 
                key={group.id} 
                className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col transition-all hover:border-primary/40 hover:shadow-xs"
              >
                {/* Header (Clean Slate/Primary Styling) */}
                <div className="border-t-3 border-t-primary bg-slate-50/80 border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {group.groupName}
                    </h3>
                    {(group.minSize || group.maxSize) && (
                      <span className="text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                        {group.minSize && group.maxSize ? `${group.minSize} - ${group.maxSize} g` : `${group.minSize || group.maxSize} g`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      title="ลบกลุ่มนี้"
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Sub-Header Tabs: [ ตาราง RM Rules ] vs [ สินค้าที่ผูก ] */}
                <div className="flex items-center border-b border-slate-100 bg-white px-3 pt-2 gap-2 text-xs">
                  <button
                    onClick={() => setActiveCardTabs({ ...activeCardTabs, [group.id]: 'rules' })}
                    className={`pb-2 px-2 font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                      currentTab === 'rules'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Layers size={13} />
                    <span>ลำดับ RM ({group.rules.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveCardTabs({ ...activeCardTabs, [group.id]: 'items' })}
                    className={`pb-2 px-2 font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                      currentTab === 'items'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Scissors size={13} className="-rotate-45" />
                    <span>สินค้าที่ผูก ({group.itemCodes.length})</span>
                  </button>
                </div>

                {/* TAB 1: Rules Table */}
                {currentTab === 'rules' && (
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="px-3 py-2 w-16 text-center">ลำดับ</th>
                            <th className="px-3 py-2">Size RM</th>
                            <th className="px-3 py-2 text-right w-24">% Yield</th>
                            <th className="px-2 py-2 w-8 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {group.rules.map((rule, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                              {/* ลำดับ (Priority) */}
                              <td className="px-3 py-1.5 text-center">
                                <input 
                                  type="number" 
                                  min="1"
                                  value={rule.priority}
                                  onChange={e => handleUpdateRule(group.id, idx, 'priority', e.target.value)}
                                  className="w-10 text-center font-bold text-slate-800 bg-slate-100 rounded py-0.5 text-xs border border-slate-200 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                                />
                              </td>

                              {/* Size rm */}
                              <td className="px-3 py-1.5">
                                <select
                                  value={rule.rmSize}
                                  onChange={e => handleUpdateRule(group.id, idx, 'rmSize', e.target.value)}
                                  className="w-full font-semibold text-slate-800 bg-white rounded py-1 px-2 text-xs border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                                >
                                  {availableRmSizes.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </td>

                              {/* %Yield */}
                              <td className="px-3 py-1.5 text-right">
                                <div className="relative inline-block w-full">
                                  <input 
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={rule.yieldPercent}
                                    onChange={e => handleUpdateRule(group.id, idx, 'yieldPercent', e.target.value)}
                                    className="w-full text-right font-bold text-emerald-700 bg-slate-50 rounded py-1 pr-5 text-xs border border-slate-200 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                                  />
                                  <span className="absolute right-1.5 top-1 text-[11px] text-slate-400 font-normal">%</span>
                                </div>
                              </td>

                              {/* Delete row */}
                              <td className="px-2 py-1.5 text-center">
                                <button
                                  onClick={() => handleDeleteRule(group.id, idx)}
                                  title="ลบแถว"
                                  className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                                >
                                  <X size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Add RM Rule button */}
                    <div className="p-2 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => handleAddRule(group.id)}
                        className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 py-1 px-2.5 rounded hover:bg-primary/5 transition-colors"
                      >
                        <Plus size={13} />
                        <span>เพิ่ม Size RM</span>
                      </button>

                      <span className="text-[11px] text-slate-500">
                        {group.rules.length} ไซส์ RM
                      </span>
                    </div>
                  </div>
                )}

                {/* TAB 2: Assigned Items */}
                {currentTab === 'items' && (
                  <div className="flex-1 flex flex-col justify-between p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">รายการสินค้าในกลุ่ม ({group.itemCodes.length})</span>
                        <button
                          onClick={() => {
                            setTargetGroupForItems(group);
                            setItemSearchQuery('');
                          }}
                          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                          <Plus size={13} />
                          <span>ผูก Item เพิ่ม</span>
                        </button>
                      </div>

                      {group.itemCodes.length === 0 ? (
                        <div className="text-center py-8 text-xs text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                          ยังไม่มี Item ผูกในกลุ่มไซส์นี้
                          <div className="mt-1">
                            <button
                              onClick={() => {
                                setTargetGroupForItems(group);
                                setItemSearchQuery('');
                              }}
                              className="text-primary font-semibold hover:underline"
                            >
                              + คลิกที่นี่เพื่อเลือก Item
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {group.itemCodes.map(code => {
                            const itm = partItems.find(p => p.erpItemCode === code);
                            const spec = itemSpecs[code];
                            const speed = spec?.iCutSpeed || 0;

                            return (
                              <div 
                                key={code}
                                className="flex items-center justify-between bg-slate-50/70 border border-slate-200 rounded-lg p-2 text-xs hover:bg-slate-50 transition-colors gap-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-slate-900 text-xs truncate">
                                    {code}
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate">
                                    {itm?.erpItemDesc || 'Product'}
                                  </div>
                                </div>

                                {/* I-Cut Speed Editor */}
                                <div className="flex items-center gap-1 shrink-0 bg-white px-2 py-1 rounded border border-slate-200">
                                  <Gauge size={12} className="text-primary" />
                                  <span className="text-[10px] text-slate-500 font-medium">I-Cut:</span>
                                  <input 
                                    type="number"
                                    placeholder="0"
                                    defaultValue={speed}
                                    onBlur={e => handleUpdateItemSpeed(code, Number(e.target.value))}
                                    className="w-14 px-1 text-right text-xs font-bold text-primary focus:outline-none"
                                  />
                                  <span className="text-[10px] text-slate-400">kg/h</span>
                                </div>

                                <button
                                  onClick={() => handleRemoveItem(group.id, code)}
                                  className="text-slate-400 hover:text-rose-600 p-1 shrink-0 transition-colors"
                                  title="นำออกจากกลุ่ม"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>สินค้าใช้ความเร็ว I-Cut จาก Product Spec</span>
                      <button
                        onClick={() => {
                          setTargetGroupForItems(group);
                          setItemSearchQuery('');
                        }}
                        className="text-primary font-semibold hover:underline"
                      >
                        จัดการรายการ
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* View Mode 2: Unified Matrix / Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-52">กลุ่มไซส์ (BLK Group)</th>
                  <th className="py-3 px-3 w-32">ช่วงขนาด (g)</th>
                  <th className="py-3 px-4">ตารางลำดับการใช้ RM & Yield (ลำดับ : ไซส์ : Yield)</th>
                  <th className="py-3 px-4 w-60">สินค้าที่ผูกในกลุ่ม</th>
                  <th className="py-3 px-3 text-center w-20">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredGroups.map(group => (
                  <tr key={group.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{group.groupName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{group.rules.length} ลำดับ RM</div>
                    </td>
                    <td className="py-3 px-3">
                      {(group.minSize || group.maxSize) ? (
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {group.minSize} - {group.maxSize} g
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {group.rules.map((r, i) => (
                          <div 
                            key={i} 
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs"
                          >
                            <span className="w-4 h-4 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center">
                              {r.priority}
                            </span>
                            <span className="font-bold text-slate-800">{r.rmSize}</span>
                            <span className="text-emerald-700 font-semibold">{r.yieldPercent}%</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {group.itemCodes.length === 0 ? (
                        <span className="text-slate-400 italic">ยังไม่มีสินค้า</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {group.itemCodes.map(c => (
                            <span key={c} className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium text-[11px] border border-slate-200">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 transition-colors"
                        title="ลบกลุ่ม"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Size Group */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Plus size={16} className="text-primary" />
                <span>สร้างหัวข้อกลุ่มไซส์ (Add Sizing Group)</span>
              </h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ชื่อหัวข้อกลุ่มไซส์ (Group Name) *</label>
                <input 
                  type="text"
                  placeholder="เช่น BLK 30-40 G หรือ BLK 25-30, 25-29 G"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Min Size (g)</label>
                  <input 
                    type="number"
                    placeholder="เช่น 25"
                    value={newMinSize}
                    onChange={e => setNewMinSize(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Max Size (g)</label>
                  <input 
                    type="number"
                    placeholder="เช่น 30"
                    value={newMaxSize}
                    onChange={e => setNewMaxSize(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800">คำแนะนำ:</div>
                <div>เมื่อสร้างกลุ่มแล้ว จะสามารถกำหนดลำดับ Size RM และ Yield รวมถึงผูกรหัสสินค้าได้ทันที</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-2xs transition-colors"
                >
                  บันทึกกลุ่มไซส์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Items to Group */}
      {targetGroupForItems && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  ผูกสินค้าในกลุ่ม: {targetGroupForItems.groupName}
                </h3>
                <p className="text-xs text-slate-500">เลือกสินค้าใน Part {partName} ที่ผลิตจากกลุ่มขนาดนี้</p>
              </div>
              <button 
                onClick={() => setTargetGroupForItems(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input 
                  type="text"
                  placeholder="ค้นหารหัส หรือ ชื่อสินค้า..."
                  value={itemSearchQuery}
                  onChange={e => setItemSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  autoFocus
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-1.5">
              {partItems
                .filter(itm => 
                  !itemSearchQuery.trim() || 
                  itm.erpItemCode.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
                  itm.erpItemDesc.toLowerCase().includes(itemSearchQuery.toLowerCase())
                )
                .map(itm => {
                  const isChecked = targetGroupForItems.itemCodes.includes(itm.erpItemCode);
                  return (
                    <label 
                      key={itm.erpItemCode}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isChecked 
                          ? 'bg-primary/5 border-primary/40 shadow-2xs' 
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleItemInTargetGroup(itm.erpItemCode)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs">{itm.erpItemCode}</div>
                          <div className="text-[11px] text-slate-500 truncate">{itm.erpItemDesc}</div>
                        </div>
                      </div>

                      {isChecked && (
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                          อยู่ในกลุ่มนี้
                        </span>
                      )}
                    </label>
                  );
                })}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                เลือกแล้ว {targetGroupForItems.itemCodes.length} รายการ
              </span>
              <button
                type="button"
                onClick={() => setTargetGroupForItems(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-2xs transition-colors"
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
