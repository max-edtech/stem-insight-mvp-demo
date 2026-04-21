import { formatAmount } from "@/lib/formatters";
import { BrainCircuit, Lightbulb, Target } from "lucide-react";

interface ForecastData {
  currentActual: number;
  progressRate: number;
  predictedTotalCost: number;
  predictedProfit: number;
  predictedProfitRate: number;
  riskAmount: number;
}

export function InsightPanel({ forecast, targetProfitRate }: { forecast: ForecastData | null, targetProfitRate: number }) {
  if (!forecast) return null;

  const isAtRisk = forecast.predictedProfitRate < targetProfitRate * 100;
  const marginGap = (targetProfitRate * 100) - forecast.predictedProfitRate;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4 text-indigo-600">
          <BrainCircuit size={20} />
          <h3 className="font-bold">預測決策大腦 (AI Forecast)</h3>
        </div>
        
        <div className="space-y-4 relative z-10">
          <div>
            <p className="text-xs text-gray-500 mb-1">完工估計總成本 (EAC)</p>
            <p className="text-2xl font-black text-gray-900">{formatAmount(forecast.predictedTotalCost)}</p>
            <p className="text-[10px] text-gray-400 mt-1">
              依據目前 {forecast.progressRate}% 執行趨勢自動推算
            </p>
          </div>

          <div className={`p-3 rounded-xl ${isAtRisk ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Target size={16} />
              <span className="text-sm font-bold">完工結算利潤預測</span>
            </div>
            <p className="text-xl font-black">{forecast.predictedProfitRate}%</p>
            {isAtRisk && (
              <p className="text-[11px] mt-1 font-medium">
                ⚠️ 警訊：預計將低於目標利潤 {marginGap.toFixed(1)}%
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-indigo-600 rounded-2xl p-5 text-white shadow-lg flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={20} className="text-amber-300" />
          <h3 className="font-bold">系統決策建議 (Command)</h3>
        </div>
        
        <div className="space-y-3">
          {isAtRisk ? (
            <>
              <div className="bg-white/10 rounded-lg p-3 text-sm leading-relaxed border border-white/20">
                目前超支風險約 <span className="text-amber-300 font-bold">{formatAmount(forecast.riskAmount)}</span>。建議優先檢核「裝修工程」標案報價，並啟動材料自購替代方案。
              </div>
              <button className="w-full py-2 bg-amber-400 text-indigo-900 rounded-xl font-bold text-sm hover:bg-amber-300 transition-colors">
                生成成本優化方案報告
              </button>
            </>
          ) : (
            <>
              <div className="bg-white/10 rounded-lg p-3 text-sm leading-relaxed border border-white/20">
                目前執行狀況極佳，成本控制在誤差範圍內。建議可提前啟動下階段「精裝標案」採購，鎖定目前市場低價位。
              </div>
              <button className="w-full py-2 bg-green-400 text-indigo-900 rounded-xl font-bold text-sm hover:bg-green-300 transition-colors">
                查看獲利優化清單
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
