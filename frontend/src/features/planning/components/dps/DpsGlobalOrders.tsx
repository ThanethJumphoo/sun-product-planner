import React from 'react';
import { ShoppingCart } from 'lucide-react';

interface DpsGlobalOrdersProps {
  globalOrders: any[];
  getOrderProducedQty: (soNumber: string, itemCode: string) => number;
  openDemandModal: () => void;
}

export const DpsGlobalOrders: React.FC<DpsGlobalOrdersProps> = ({ globalOrders, getOrderProducedQty, openDemandModal }) => {
  return (
    <div className="p-4 border-b border-slate-200 shrink-0">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-800">Production Demands</h3>
            {globalOrders.length > 0 && (
              <span className="text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">
                {globalOrders.length} items
              </span>
            )}
          </div>
        </div>
        
        {globalOrders.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-32 text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <ShoppingCart className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-sm">No demands assigned for this day.</p>
            <button 
              onClick={openDemandModal}
              className="mt-2 text-sm text-primary font-medium hover:underline"
            >
              Assign Demands
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-4 font-semibold">Type</th>
                  <th className="py-2 px-4 font-semibold">SO Number</th>
                  <th className="py-2 px-4 font-semibold">Item Code</th>
                  <th className="py-2 px-4 font-semibold">Item Name</th>
                  <th className="py-2 px-4 font-semibold text-right">Planned Qty</th>
                  <th className="py-2 px-4 font-semibold text-right">Produced Qty</th>
                  <th className="py-2 px-4 font-semibold text-right">Remaining Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {globalOrders.map((order: any) => {
                  const producedQty = getOrderProducedQty(order.soNumber, order.itemCode);
                  const remainingQty = Math.max(0, Number(order.plannedQty) - producedQty);
                  const isComplete = remainingQty <= 0;
                  
                  return (
                    <tr key={order.id} className={`hover:bg-slate-50 transition-colors ${isComplete ? 'bg-green-50/30' : 'bg-white'}`}>
                      <td className="py-2 px-4 text-slate-500 capitalize">{order.itemCategory || 'Unknown'}</td>
                      <td className="py-2 px-4 font-medium text-slate-900">{order.soNumber}</td>
                      <td className="py-2 px-4 text-slate-600">{order.itemCode}</td>
                      <td className="py-2 px-4 text-slate-600 truncate max-w-xs">{order.itemName}</td>
                      <td className="py-2 px-4 font-medium text-slate-800 text-right">{Number(order.plannedQty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-2 px-4 font-medium text-blue-600 text-right">{producedQty > 0 ? producedQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                      <td className={`py-2 px-4 font-bold text-right ${isComplete ? 'text-green-600' : 'text-amber-600'}`}>
                        {remainingQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
