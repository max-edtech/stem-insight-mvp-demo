"use client";

import { useMemo, useState } from "react";
import { BarChart3, RefreshCcw, ShieldAlert } from "lucide-react";
import type { FeasibilityInputs } from "@/lib/feasibility";
import { formatAmount } from "@/lib/formatters";
import {
  runMonteCarloRiskSimulation,
  type RiskSimulationResult,
} from "@/lib/risk-analysis";

interface RiskAnalysisPanelProps {
  inputs: FeasibilityInputs;
  targetProfitRatePercent: number;
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function RiskAnalysisPanel({
  inputs,
  targetProfitRatePercent,
}: RiskAnalysisPanelProps) {
  const [result, setResult] = useState<RiskSimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const targetProfitRate = useMemo(
    () => Math.max(0, targetProfitRatePercent / 100),
    [targetProfitRatePercent]
  );

  const riskSimulationJson = useMemo(() => {
    if (!result) return "";
    return JSON.stringify({
      iterations: result.iterations,
      targetProfitRate: result.targetProfitRate,
      probabilityMeetTarget: result.probabilityMeetTarget,
      expectedProfitRate: result.expectedProfitRate,
      expectedProfitAmount: result.expectedProfitAmount,
      p10ProfitRate: result.p10ProfitRate,
      p50ProfitRate: result.p50ProfitRate,
      p90ProfitRate: result.p90ProfitRate,
      p10Profit: result.p10Profit,
      p50Profit: result.p50Profit,
      p90Profit: result.p90Profit,
      assumptions: result.assumptions,
      generatedAt: result.generatedAt,
    });
  }, [result]);

  const runSimulation = async () => {
    setIsRunning(true);
    try {
      // Yield once to keep the button responsive before the local simulation loop.
      await new Promise((resolve) => setTimeout(resolve, 0));
      const next = runMonteCarloRiskSimulation(inputs, {
        iterations: 1000,
        targetProfitRate,
      });
      setResult(next);
    } finally {
      setIsRunning(false);
    }
  };

  const meetsTarget = result ? result.probabilityMeetTarget >= 0.5 : false;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <input type="hidden" name="riskSimulationJson" value={riskSimulationJson} />
      <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
        <BarChart3 className="h-4 w-4 text-amber-300" />
        風險分析（PERT + Monte Carlo）
      </div>

      <p className="mt-2 text-xs leading-5 text-slate-300">
        以 1,000 次模擬推估獲利分布，含利率、工期、售價與建造成本波動。
      </p>

      <button
        type="button"
        onClick={runSimulation}
        disabled={isRunning}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-60"
      >
        <RefreshCcw className={`h-4 w-4 ${isRunning ? "animate-spin" : ""}`} />
        {isRunning ? "分析中..." : "執行風險分析（1,000次）"}
      </button>

      {result ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-black/20 p-3">
            <div className="text-[10px] text-slate-300">達標機率</div>
            <div className={`mt-1 text-base font-black ${meetsTarget ? "text-emerald-300" : "text-amber-300"}`}>
              {formatPercent(result.probabilityMeetTarget)}
            </div>
          </div>
          <div className="rounded-2xl bg-black/20 p-3">
            <div className="text-[10px] text-slate-300">期望利潤率</div>
            <div className="mt-1 text-base font-black text-sky-300">
              {formatPercent(result.expectedProfitRate)}
            </div>
          </div>
          <div className="rounded-2xl bg-black/20 p-3">
            <div className="text-[10px] text-slate-300">P10 / P50 / P90</div>
            <div className="mt-1 text-xs font-semibold text-white">
              {formatPercent(result.p10ProfitRate)} / {formatPercent(result.p50ProfitRate)} /{" "}
              {formatPercent(result.p90ProfitRate)}
            </div>
          </div>
          <div className="rounded-2xl bg-black/20 p-3">
            <div className="text-[10px] text-slate-300">期望利潤額</div>
            <div className="mt-1 text-xs font-semibold text-white">
              {formatAmount(result.expectedProfitAmount)}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-2.5 text-[11px] text-amber-100">
          <ShieldAlert className="h-3.5 w-3.5" />
          尚未執行風險分析，建議先跑一次再建立案件。
        </div>
      )}
    </div>
  );
}

