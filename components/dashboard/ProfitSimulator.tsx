'use client';

import { useState } from 'react';
import { formatAmount } from '@/lib/formatters';
import { SlidersHorizontal, TrendingUp, AlertTriangle } from 'lucide-react';

interface Material {
  key: string;
  label: string;
  totalAmount: number;
}

interface SimulatorProps {
  materials: Material[];
  contractAmount: number;
  originalTotalBudget: number;
  targetProfitRate: number;
}

export function ProfitSimulator({ 
  materials, 
  contractAmount, 
  originalTotalBudget,
  targetProfitRate 
}: SimulatorProps) {
  const [adjustments, setAdjustments] = useState<Record<string, number>>(
    materials.reduce((acc, m) => ({ ...acc, [m.key]: 0 }), {})
  );

  const calculateNewTotalBudget = () => {
    let extraCost = 0;
    materials.forEach(m => {
      extraCost += m.totalAmount * (adjustments[m.key] / 100);
    });
    return originalTotalBudget + extraCost;
  };

  const newTotalBudget = calculateNewTotalBudget();
  const newProfit = contractAmount - newTotalBudget;
  const newProfitRate = (newProfit / contractAmount) * 100;
  const profitImpact = newProfit - (contractAmount - originalTotalBudget);

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
      <div className="bg-indigo-50 px-5 py-4 border-b border-indigo-100 flex items-center gap-2 text-indigo-900">
        <SlidersHorizontal size={18} className="text-indigo-600" />
        <h3 className="font-bold">利潤變數模擬器 (MOU 決策用)</h3>
      </div>
      
      <div className="p-5 space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {materials.map(m => (
            <div key={m.key} className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-sm font-medium text-gray-700">{m.label} 價格變動</label>
                <span className={`text-sm font-bold ${adjustments[m.key] > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {adjustments[m.key] > 0 ? '+' : ''}{adjustments[m.key]}%
                </span>
              </div>
              <input 
                type="range" 
                min="-20" 
                max="50" 
                step="5"
                value={adjustments[m.key]}
                onChange={(e) => setAdjustments({...adjustments, [m.key]: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <p className="text-[10px] text-gray-500 italic">基礎預算佔比: {((m.totalAmount / originalTotalBudget) * 100).toFixed(1)}%</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-1">模擬後利潤變化</p>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-black ${profitImpact < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {profitImpact > 0 ? '+' : ''}{formatAmount(profitImpact)}
              </span>
              {profitImpact < 0 ? <AlertTriangle size={16} className="text-red-500" /> : <TrendingUp size={16} className="text-green-500" />}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">調整後預計淨利率</p>
            <p className={`text-xl font-black ${newProfitRate >= targetProfitRate * 100 ? 'text-indigo-900' : 'text-amber-600'}`}>
              {newProfitRate.toFixed(1)}%
            </p>
          </div>
        </div>
        
        <p className="text-[11px] text-gray-400 text-center">
          * 此模擬器根據工具包單價分析邏輯自動換算，不影響實際資料庫儲存數值
        </p>
      </div>
    </div>
  );
}
