"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Package, 
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  partName: string;
  onSuccess: () => void;
}

interface SystemItemMeta {
  itemCode: string;
  itemDesc: string;
  partName: string;
}

interface ParsedOrderItem {
  itemCode: string;
  itemName: string;
  partName: string;
  orderedQuantity: number;
  planQty: number;
}

interface ParsedOrderGroup {
  shipDate: string;
  displayDate: string;
  items: ParsedOrderItem[];
  totalQty: number;
}

interface MissingItemInfo {
  code: string;
  name: string;
  colIdx: number;
}

export function ExcelImportModal({
  isOpen,
  onClose,
  partName,
  onSuccess
}: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // All system items across all parts
  const [systemItemMap, setSystemItemMap] = useState<Map<string, SystemItemMeta>>(new Map());

  // Parse results
  const [parsedOrders, setParsedOrders] = useState<ParsedOrderGroup[]>([]);
  const [unrecognizedItems, setUnrecognizedItems] = useState<MissingItemInfo[]>([]);
  const [validItemCount, setValidItemCount] = useState(0);
  const [detectedPartsList, setDetectedPartsList] = useState<string[]>([]);
  const [totalPlannedKg, setTotalPlannedKg] = useState(0);
  const [showMissingList, setShowMissingList] = useState(true);

  // Form options
  const [customerName, setCustomerName] = useState('Excel Import');
  const [overwriteExisting, setOverwriteExisting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load all system items when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSystemItems();
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setFile(null);
    setParsedOrders([]);
    setUnrecognizedItems([]);
    setValidItemCount(0);
    setDetectedPartsList([]);
    setTotalPlannedKg(0);
    setShowMissingList(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const loadSystemItems = async () => {
    setIsLoadingItems(true);
    try {
      const res = await api.get('/api/v1/demand-planning/system-items');
      const items: SystemItemMeta[] = res.data || [];
      const map = new Map<string, SystemItemMeta>();
      items.forEach((item) => {
        if (item.itemCode) {
          map.set(String(item.itemCode).trim(), item);
        }
      });
      setSystemItemMap(map);
    } catch (err) {
      console.error('Failed to load system items:', err);
      // Fallback to single part if system-items is unreachable
      try {
        const fallbackRes = await api.get('/api/v1/product-spec/items', {
          params: { partName }
        });
        const map = new Map<string, SystemItemMeta>();
        (fallbackRes.data || []).forEach((item: any) => {
          if (item.erpItemCode) {
            map.set(String(item.erpItemCode).trim(), {
              itemCode: item.erpItemCode,
              itemDesc: item.erpItemDesc || '',
              partName: partName || 'Unassigned'
            });
          }
        });
        setSystemItemMap(map);
      } catch (fallbackErr) {
        toast.error('Failed to load system item specs');
      }
    } finally {
      setIsLoadingItems(false);
    }
  };

  /**
   * Parse Thai BE or CE dates into YYYY-MM-DD
   * Supports: '19/10/69' (BE 2569 -> 2026-10-19), '26/10/2569', '2026-10-26', Excel serials, etc.
   */
  const parseCellDate = (val: any): string | null => {
    if (val === null || val === undefined || val === '') return null;

    if (val instanceof Date && !isNaN(val.getTime())) {
      return format(val, 'yyyy-MM-dd');
    }

    if (typeof val === 'number') {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return format(date, 'yyyy-MM-dd');
      }
    }

    const str = String(val).trim();
    const match = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      let year = parseInt(match[3], 10);

      if (year < 100) {
        if (year >= 50) {
          year = 2500 + year - 543;
        } else {
          year = 2000 + year;
        }
      } else if (year >= 2500) {
        year = year - 543;
      }

      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const mStr = String(month).padStart(2, '0');
        const dStr = String(day).padStart(2, '0');
        return `${year}-${mStr}-${dStr}`;
      }
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.slice(0, 10);
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processExcelFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processExcelFile(droppedFile);
    }
  };

  const processExcelFile = (fileToProcess: File) => {
    setFile(fileToProcess);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: false });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: null });

        if (!rows || rows.length < 3) {
          toast.error('ไฟล์ Excel ไม่มีข้อมูลเพียงพอหรือไม่ตรงตามรูปแบบ');
          setIsParsing(false);
          return;
        }

        // 1. Locate Header Rows:
        let codeRowIdx = -1;
        let nameRowIdx = -1;
        let dateRowIdx = -1;

        for (let r = 0; r < Math.min(rows.length, 20); r++) {
          const firstCell = String(rows[r]?.[0] || '').toLowerCase().trim();
          if (firstCell === 'code' || firstCell.includes('รหัส')) {
            codeRowIdx = r;
          } else if (firstCell === 'name' || firstCell.includes('ชื่อ')) {
            nameRowIdx = r;
          } else if (firstCell === 'date' || firstCell.includes('วัน')) {
            dateRowIdx = r;
          }
        }

        // Fallbacks if labels aren't verbatim
        if (codeRowIdx === -1) {
          let maxNumericCols = 0;
          for (let r = 0; r < Math.min(rows.length, 10); r++) {
            const row = rows[r] || [];
            let count = 0;
            for (let c = 1; c < row.length; c++) {
              if (row[c] && /^\d{6,12}$/.test(String(row[c]).trim())) {
                count++;
              }
            }
            if (count > maxNumericCols) {
              maxNumericCols = count;
              codeRowIdx = r;
            }
          }
        }

        if (codeRowIdx === -1) {
          codeRowIdx = 1; // Default to row 2
        }
        if (nameRowIdx === -1 && codeRowIdx + 1 < rows.length) {
          nameRowIdx = codeRowIdx + 1;
        }
        if (dateRowIdx === -1 && nameRowIdx + 1 < rows.length) {
          dateRowIdx = nameRowIdx + 1;
        }

        const codeRow = rows[codeRowIdx] || [];
        const nameRow = nameRowIdx !== -1 ? rows[nameRowIdx] || [] : [];
        const dataStartRow = dateRowIdx !== -1 ? dateRowIdx + 1 : 4;

        // 2. Identify Item Columns across ALL parts in system
        interface ItemColMeta {
          colIdx: number;
          itemCode: string;
          itemName: string;
          partName: string;
          isValid: boolean;
        }

        const itemCols: ItemColMeta[] = [];
        const missingItems: MissingItemInfo[] = [];
        const validItemCodes = new Set<string>();
        const detectedPartsSet = new Set<string>();

        for (let c = 1; c < codeRow.length; c++) {
          const rawCode = codeRow[c];
          if (rawCode === null || rawCode === undefined || String(rawCode).trim() === '') {
            continue;
          }
          const itemCode = String(rawCode).trim();
          const itemName = nameRow[c] ? String(nameRow[c]).trim() : '';

          // Match against the entire system Item Master
          const itemMeta = systemItemMap.get(itemCode);

          if (itemMeta) {
            const resolvedPart = itemMeta.partName || 'Item Unassigned';
            itemCols.push({
              colIdx: c,
              itemCode,
              itemName: itemName || itemMeta.itemDesc || itemCode,
              partName: resolvedPart,
              isValid: true
            });
            validItemCodes.add(itemCode);
            if (resolvedPart !== 'Item Unassigned') {
              detectedPartsSet.add(resolvedPart);
            }
          } else {
            // Truly unrecognized across the whole ERP system
            missingItems.push({
              code: itemCode,
              name: itemName || '-',
              colIdx: c
            });
            itemCols.push({
              colIdx: c,
              itemCode,
              itemName,
              partName: 'Unknown',
              isValid: false
            });
          }
        }

        setUnrecognizedItems(missingItems);
        setValidItemCount(validItemCodes.size);
        setDetectedPartsList(Array.from(detectedPartsSet));

        // 3. Scan Data Rows (Dates in Column A, Quantities in Item Columns)
        const ordersByDate = new Map<string, ParsedOrderItem[]>();
        let totalWeight = 0;

        for (let r = dataStartRow; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length === 0) continue;

          const dateVal = row[0];
          const isoDate = parseCellDate(dateVal);
          if (!isoDate) continue;

          const validItemsForThisDate: ParsedOrderItem[] = [];

          for (const col of itemCols) {
            if (!col.isValid) continue;

            const cellVal = row[col.colIdx];
            if (cellVal === null || cellVal === undefined || cellVal === '') continue;

            const qty = typeof cellVal === 'number' 
              ? cellVal 
              : parseFloat(String(cellVal).replace(/,/g, '').trim());

            if (!isNaN(qty) && qty > 0) {
              validItemsForThisDate.push({
                itemCode: col.itemCode,
                itemName: col.itemName,
                partName: col.partName,
                orderedQuantity: qty,
                planQty: qty
              });
              totalWeight += qty;
            }
          }

          if (validItemsForThisDate.length > 0) {
            if (!ordersByDate.has(isoDate)) {
              ordersByDate.set(isoDate, []);
            }
            ordersByDate.get(isoDate)!.push(...validItemsForThisDate);
          }
        }

        // 4. Format into ParsedOrderGroup array sorted by date
        const grouped: ParsedOrderGroup[] = Array.from(ordersByDate.entries())
          .map(([shipDate, items]) => {
            const sumQty = items.reduce((acc, i) => acc + i.orderedQuantity, 0);
            return {
              shipDate,
              displayDate: format(new Date(shipDate), 'dd/MM/yyyy'),
              items,
              totalQty: sumQty
            };
          })
          .sort((a, b) => a.shipDate.localeCompare(b.shipDate));

        setParsedOrders(grouped);
        setTotalPlannedKg(totalWeight);

        if (grouped.length === 0) {
          toast((t) => (
            <div className="text-xs">
              <strong>ไม่พบรายการสั่งผลิตที่มีปริมาณ &gt; 0</strong>
              <div className="text-slate-500 mt-0.5">
                {missingItems.length > 0 
                  ? `พบ ${missingItems.length} รหัสสินค้าที่ไม่พบในระบบ` 
                  : 'กรุณาตรวจสอบว่ามีค่าตัวเลขยอดผลิตในช่องสินค้า'}
              </div>
            </div>
          ), { icon: 'ℹ️' });
        } else {
          toast.success(`อ่านข้อมูลสำเร็จ: พบ ${grouped.length} วันที่มีแผนผลิต`);
        }
      } catch (err: any) {
        console.error('Error parsing excel:', err);
        toast.error('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + (err.message || 'รูปแบบไฟล์ไม่ถูกต้อง'));
      } finally {
        setIsParsing(false);
      }
    };

    reader.readAsArrayBuffer(fileToProcess);
  };

  const handleConfirmImport = async () => {
    if (parsedOrders.length === 0) {
      toast.error('ไม่มีรายการผลิตที่ถูกต้องสำหรับนำเข้า');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim() || 'Excel Import',
        customerGrade: 'A',
        overwriteExisting,
        orders: parsedOrders.map((order, idx) => {
          const ymd = order.shipDate.replace(/-/g, '').slice(2);
          const seq = String(idx + 1).padStart(2, '0');
          return {
            soNumber: `MO-EXCEL-${ymd}-${seq}`,
            shipDate: order.shipDate,
            items: order.items.map((i, lIdx) => ({
              lineNumber: String(lIdx + 1),
              itemCode: i.itemCode,
              partName: i.partName,
              orderedQuantity: i.orderedQuantity,
              planQty: i.planQty
            }))
          };
        })
      };

      const res = await api.post(
        '/api/v1/demand-planning/manual-orders/batch-import',
        payload
      );

      const partsText = detectedPartsList.length > 0 ? ` (${detectedPartsList.join(', ')})` : '';
      toast.success(
        `นำเข้าสำเร็จ! บันทึกแผนการผลิตแยกตาม Part${partsText} รวม ${totalPlannedKg.toLocaleString()} กก.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to import orders:', err);
      toast.error(err.response?.data?.message || 'การนำเข้าข้อมูลล้มเหลว');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg shadow-2xs">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <span>นำเข้าแผนผลิตด้วย Excel (All Parts Matrix)</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  รองรับทุก Part ในไฟล์เดียว
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ระบบจะแยก Part ให้อัตโนมัติ (เช่น Fillet, BL, BIL) ตามรหัสสินค้าที่มีในระบบ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Upload Dropzone */}
          {!file && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="p-4 bg-white rounded-full shadow-sm text-emerald-600 group-hover:scale-110 transition-transform mb-3">
                <Upload size={32} />
              </div>
              <p className="font-semibold text-slate-800 text-sm">
                คลิกเลือกไฟล์ หรือลากไฟล์ Excel (.xlsx, .xls) รวมทุก Part มาวางที่นี่
              </p>
              <p className="text-xs text-slate-500 mt-1">
                โครงสร้าง: แถว 2 คือรหัสสินค้า, แถว 3 คือชื่อสินค้า, และคอลัมน์ A เป็นวันที่ (เช่น 26/10/69)
              </p>
            </div>
          )}

          {/* Parsing State */}
          {isParsing && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <RefreshCw className="animate-spin text-emerald-600" size={32} />
              <p className="text-sm font-medium text-slate-700">กำลังวิเคราะห์ตารางและตรวจสอบรหัสสินค้ากับระบบทั้งองค์กร...</p>
            </div>
          )}

          {/* File Selected & Parsed Content */}
          {file && !isParsing && (
            <div className="space-y-4">
              
              {/* File Info Bar */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-md">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      ขนาด: {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetState}
                  className="text-xs font-semibold text-slate-600 hover:text-red-600 px-2.5 py-1.5 rounded border border-slate-300 hover:border-red-300 bg-white hover:bg-red-50 transition-colors"
                >
                  เลือกไฟล์ใหม่
                </button>
              </div>

              {/* KPI Summary Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3">
                  <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
                    วันที่พบแผนผลิต
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Calendar size={18} className="text-emerald-600" />
                    <span className="text-xl font-bold text-emerald-950">{parsedOrders.length}</span>
                    <span className="text-xs text-emerald-700">วัน</span>
                  </div>
                </div>

                <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3">
                  <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider block">
                    สินค้าที่ตรงกับระบบ
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Package size={18} className="text-blue-600" />
                    <span className="text-xl font-bold text-blue-950">{validItemCount}</span>
                    <span className="text-xs text-blue-700">รหัส</span>
                  </div>
                  {detectedPartsList.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {detectedPartsList.map(p => (
                        <span key={p} className="text-[9px] bg-blue-100 text-blue-800 px-1 py-0.2 rounded font-semibold">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3">
                  <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
                    สินค้าที่ไม่พบในระบบ
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <AlertTriangle size={18} className="text-amber-600" />
                    <span className="text-xl font-bold text-amber-950">{unrecognizedItems.length}</span>
                    <span className="text-xs text-amber-700">รหัส (ข้าม)</span>
                  </div>
                </div>

                <div className="bg-purple-50/70 border border-purple-200 rounded-lg p-3">
                  <span className="text-[11px] font-semibold text-purple-800 uppercase tracking-wider block">
                    ยอดผลิตรวมทั้งหมด
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xl font-bold text-purple-950">
                      {totalPlannedKg.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </span>
                    <span className="text-xs text-purple-700">กก.</span>
                  </div>
                </div>
              </div>

              {/* WARNING BANNER: Unrecognized Items Notification */}
              {unrecognizedItems.length > 0 && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="text-amber-600 shrink-0" size={19} />
                      <h4 className="font-bold text-amber-900 text-sm">
                        แจ้งเตือน: พบ {unrecognizedItems.length} รหัสสินค้าที่ไม่มีในระบบ ERP
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMissingList(!showMissingList)}
                      className="text-xs text-amber-800 hover:text-amber-950 flex items-center gap-1 font-medium"
                    >
                      <span>{showMissingList ? 'ซ่อนรายการ' : 'ดูรายการที่ไม่พบ'}</span>
                      {showMissingList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                  
                  <p className="text-xs text-amber-800 mt-1 pl-6">
                    ตามข้อกำหนด: ระบบจะ **ข้ามรายการสินค้าเหล่านี้โดยอัตโนมัติ** และจะนำเข้าเฉพาะสินค้าที่มีอยู่ในระบบเท่านั้น
                  </p>

                  {showMissingList && (
                    <div className="mt-3 pl-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto pt-2 border-t border-amber-200">
                      {unrecognizedItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-white/80 border border-amber-200 rounded-md p-2 flex flex-col text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-amber-950">{item.code}</span>
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-medium">
                              ข้าม
                            </span>
                          </div>
                          <span className="text-slate-600 text-[11px] truncate mt-0.5" title={item.name}>
                            {item.name || '(ไม่มีชื่อระบุ)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Import Options */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 max-w-md">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    ชื่อลูกค้า / หมายเหตุเอกสาร (Customer Name / Note)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="เช่น Excel Import, แผนยอดผลิตรวม..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2 md:pt-4">
                  <input
                    type="checkbox"
                    id="overwriteExisting"
                    checked={overwriteExisting}
                    onChange={(e) => setOverwriteExisting(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="overwriteExisting" className="text-xs text-slate-700 cursor-pointer select-none">
                    เขียนทับ Order ที่เคยนำเข้าจาก Excel ในวันเดียวกัน
                  </label>
                </div>
              </div>

              {/* Data Preview Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    <span>ตัวอย่างรายการที่จะถูกนำเข้า ({parsedOrders.length} วัน)</span>
                  </h4>
                  <span className="text-xs text-slate-500">
                    แสดงเฉพาะรายการที่มีตัวเลขยอดผลิต &gt; 0 พร้อมระบุ Part อัตโนมัติ
                  </span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 font-semibold w-28">วันส่งมอบ (Ship Date)</th>
                        <th className="p-2.5 font-semibold">รายการสินค้าที่จะผลิต (Part · Code · Qty)</th>
                        <th className="p-2.5 font-semibold text-right w-28">ยอดรวม (กก.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedOrders.map((order, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-2.5 font-semibold text-slate-800 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-emerald-600" />
                              {order.displayDate}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <div className="flex flex-wrap gap-1.5">
                              {order.items.map((item, itemIdx) => (
                                <span
                                  key={itemIdx}
                                  className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] shadow-2xs"
                                >
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                    {item.partName}
                                  </span>
                                  <span className="font-mono font-medium text-slate-800">{item.itemCode}</span>
                                  <span className="text-slate-400">·</span>
                                  <span className="font-bold text-emerald-700">
                                    {item.orderedQuantity.toLocaleString()} กก.
                                  </span>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-2.5 font-bold text-right text-emerald-700 whitespace-nowrap">
                            {order.totalQty.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {parsedOrders.length > 0 && (
              <span>
                พร้อมนำเข้า <strong>{parsedOrders.length}</strong> วัน 
                (รวม <strong>{totalPlannedKg.toLocaleString()}</strong> กก. {detectedPartsList.length > 0 && `จาก ${detectedPartsList.length} Parts`})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isSubmitting || parsedOrders.length === 0}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>กำลังนำเข้าข้อมูล...</span>
                </>
              ) : (
                <>
                  <Upload size={14} />
                  <span>ยืนยันนำเข้าข้อมูล ({parsedOrders.length} วัน)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
