'use client';

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Download,
  Landmark,
  Layers3,
  Scale,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
  Workflow,
  FileSpreadsheet,
  ClipboardCheck,
} from "lucide-react";
import { formatAmount, formatDate } from "@/lib/formatters";
import type { ProjectSummary, BudgetVsActualRow } from "@/lib/types";
import type { ScheduleMilestone } from "@/lib/queries/schedule";
import type { OperationOverview } from "@/lib/queries/operations";
import { MetricCard } from "./MetricCard";
import { MainCategoryBars } from "./MainCategoryBars";
import { BudgetPieChart } from "./BudgetPieChart";
import { InsightPanel } from "./InsightPanel";
import { ProfitSimulator } from "./ProfitSimulator";
import { CompareCard } from "@/components/compare/CompareCard";
import { MilestoneCard } from "@/components/schedule/MilestoneCard";
import { cn } from "@/lib/utils";

type HubProject = {
  id: string;
  name: string;
  totalBudget: number;
  contractAmount: number;
  targetProfitRate: number;
  totalDays: number | null;
  startDate: string | null;
  endDate: string | null;
};

type HubForecast = {
  currentActual: number;
  progressRate: number;
  predictedTotalCost: number;
  predictedProfit: number;
  predictedProfitRate: number;
  riskAmount: number;
} | null;

type HubMaterial = {
  key: string;
  label: string;
  totalAmount: number;
};

type HubCoverage = {
  budgetCodes: number;
  budgetLines: number;
  actualValuations: number;
  scheduleItems: number;
  cashflowEntries: number;
  costItems: number;
};

type HubOperationsSummary = OperationOverview["summary"];

type HubMarketSignal = {
  seriesKey: string;
  seriesLabel: string;
  period: string;
  value: number;
  momChangePct: number | null;
  yoyChangePct: number | null;
  sourceUrl: string | null;
  fetchedAt: string;
};

type HubMarketImpact = {
  seriesKey: string;
  period: string;
  changePct: number;
  thresholdPct: number;
  projectedProfit: number;
  projectedProfitRate: number;
  totalDelta: number;
  triggeredAt: string;
};

type Snapshot = {
  title: string;
  costShock: number;
  revenueShock: number;
  adjustedCost: number;
  adjustedRevenue: number;
  profit: number;
  profitRate: number;
  cashNeed: number;
  targetGap: number;
  badge: string;
};

function buildSnapshot({
  title,
  costShock,
  revenueShock,
  baseRevenue,
  baseCost,
  baseActual,
  targetProfitRate,
}: {
  title: string;
  costShock: number;
  revenueShock: number;
  baseRevenue: number;
  baseCost: number;
  baseActual: number;
  targetProfitRate: number;
}): Snapshot {
  const adjustedCost = Math.max(0, baseCost * (1 + costShock / 100));
  const adjustedRevenue = Math.max(0, baseRevenue * (1 + revenueShock / 100));
  const profit = adjustedRevenue - adjustedCost;
  const profitRate = adjustedRevenue > 0 ? (profit / adjustedRevenue) * 100 : 0;
  const cashNeed = Math.max(0, adjustedCost - baseActual);
  const targetGap = profitRate - targetProfitRate * 100;

  return {
    title,
    costShock,
    revenueShock,
    adjustedCost,
    adjustedRevenue,
    profit,
    profitRate,
    cashNeed,
    targetGap,
    badge: profitRate >= targetProfitRate * 100 ? "達標" : "偏低",
  };
}

function StatPill({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "emerald" | "amber" | "rose" | "sky";
}) {
  const toneClass = {
    slate: "bg-white/10 text-slate-100 border-white/10",
    emerald: "bg-emerald-500/15 text-emerald-100 border-emerald-400/20",
    amber: "bg-amber-500/15 text-amber-100 border-amber-400/20",
    rose: "bg-rose-500/15 text-rose-100 border-rose-400/20",
    sky: "bg-sky-500/15 text-sky-100 border-sky-400/20",
  }[tone];

  return (
    <div className={cn("rounded-2xl border px-4 py-3 backdrop-blur", toneClass)}>
      <div className="text-[10px] uppercase tracking-[0.18em] opacity-70">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

export function FinanceHubClient({
  project,
  summary,
  materials,
  forecast,
  compareRows,
  schedule,
  coverage,
  operationsSummary,
  marketSignals,
  marketImpacts,
  projectId,
}: {
  project: HubProject;
  summary: ProjectSummary[];
  materials: HubMaterial[];
  forecast: HubForecast;
  compareRows: BudgetVsActualRow[];
  schedule: ScheduleMilestone[];
  coverage: HubCoverage;
  operationsSummary: HubOperationsSummary;
  marketSignals: HubMarketSignal[];
  marketImpacts: HubMarketImpact[];
  projectId: string;
}) {
  const [costShock, setCostShock] = useState(0);
  const [revenueShock, setRevenueShock] = useState(0);
  const [isSyncingMarket, setIsSyncingMarket] = useState(false);

  const baseRevenue = project.contractAmount;
  const baseCost = forecast?.predictedTotalCost ?? project.totalBudget;
  const baseActual = forecast?.currentActual ?? 0;
  const baseProfit = baseRevenue - baseCost;
  const baseProfitRate = baseRevenue > 0 ? (baseProfit / baseRevenue) * 100 : 0;
  const progressRate = forecast?.progressRate ?? 0;
  const riskAmount = forecast?.riskAmount ?? 0;
  const coverageScore = Math.round(
    ([
      coverage.budgetCodes,
      coverage.budgetLines,
      coverage.actualValuations,
      coverage.scheduleItems,
      coverage.cashflowEntries,
    ].filter((count) => count > 0).length / 5) * 100
  );

  const impactBySeries = useMemo(
    () => new Map(marketImpacts.map((item) => [item.seriesKey, item])),
    [marketImpacts]
  );

  const syncMarketNow = async () => {
    setIsSyncingMarket(true);
    try {
      const response = await fetch("/api/market/sync", { method: "POST" });
      if (!response.ok) {
        throw new Error("sync failed");
      }
      window.location.reload();
    } catch {
      window.alert("市場同步失敗，請稍後再試。");
      setIsSyncingMarket(false);
    }
  };

  const snapshots = useMemo(() => {
    return [
      buildSnapshot({
        title: "保守方案",
        costShock: 8,
        revenueShock: -3,
        baseRevenue,
        baseCost,
        baseActual,
        targetProfitRate: project.targetProfitRate,
      }),
      buildSnapshot({
        title: "基準方案",
        costShock: 0,
        revenueShock: 0,
        baseRevenue,
        baseCost,
        baseActual,
        targetProfitRate: project.targetProfitRate,
      }),
      buildSnapshot({
        title: "進取方案",
        costShock: -3,
        revenueShock: 5,
        baseRevenue,
        baseCost,
        baseActual,
        targetProfitRate: project.targetProfitRate,
      }),
      buildSnapshot({
        title: "自訂方案",
        costShock,
        revenueShock,
        baseRevenue,
        baseCost,
        baseActual,
        targetProfitRate: project.targetProfitRate,
      }),
    ];
  }, [baseActual, baseCost, baseRevenue, costShock, revenueShock, project.targetProfitRate]);

  const phaseCards = [
    {
      title: "前期｜殘值法與土地價值",
      icon: Landmark,
      tone: "from-amber-100 to-amber-50 border-amber-200",
      lines: [
        `以總合約額 ${formatAmount(project.contractAmount)} 與基準總預算 ${formatAmount(project.totalBudget)} 建立初始利潤底盤。`,
        `目前推估利潤率 ${baseProfitRate.toFixed(1)}%，目標門檻 ${(
          project.targetProfitRate * 100
        ).toFixed(1)}%。`,
      ],
      action: "開啟殘值試算",
      href: "/new-project",
    },
    {
      title: "中期｜預算、變更、實支",
      icon: Workflow,
      tone: "from-sky-100 to-sky-50 border-sky-200",
      lines: [
        `預算碼 ${coverage.budgetCodes} 筆、預算明細 ${coverage.budgetLines} 筆、實支計價 ${coverage.actualValuations} 筆。`,
        `進度表 ${coverage.scheduleItems} 筆、現金流 ${coverage.cashflowEntries} 筆，資料覆蓋度 ${coverageScore}%。`,
      ],
      action: "查看預算與差異",
      href: `/${projectId}/compare`,
    },
    {
      title: "後期｜EAC、回款與獲利",
      icon: Target,
      tone: "from-emerald-100 to-emerald-50 border-emerald-200",
      lines: [
        `EAC 預測總成本 ${formatAmount(baseCost)}，目前實支 ${formatAmount(baseActual)}。`,
        `預測完工利潤 ${formatAmount(forecast?.predictedProfit ?? baseProfit)}，風險金額 ${formatAmount(riskAmount)}。`,
      ],
      action: "檢視獲利預警",
      href: `/${projectId}/schedule`,
    },
  ] as const;

  return (
    <div className="px-4 py-4 space-y-4">
      <section className="relative overflow-hidden rounded-[32px] bg-slate-950 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.22),_transparent_35%),radial-gradient(circle_at_right,_rgba(14,165,233,0.14),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,0.92),_rgba(15,23,42,0.98))]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="relative z-10 p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-amber-200 uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                開發財務中樞 / Residual → Cost → EAC
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                  {project.name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  讓前期殘值法、施工中成本、後期獲利預測都回到同一個資料底盤，
                  直接把 Excel 底稿變成可以決策的財務中樞。
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  {project.startDate ? formatDate(project.startDate) : "未設定起始日"}
                  {" "}→{" "}
                  {project.endDate ? formatDate(project.endDate) : "未設定完工日"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  工期 {project.totalDays ? `${project.totalDays} 天` : "未設定"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  資料覆蓋 {coverageScore}%
                </span>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:w-[340px]">
              <Link
                href="/new-project"
                className="inline-flex items-center justify-between gap-3 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-bold text-slate-950 transition-transform hover:-translate-y-0.5"
              >
                前期試算
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={`/api/projects/${project.id}/export`}
                className="inline-flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                匯出 Excel
                <Download className="h-4 w-4" />
              </a>
              <Link
                href={`/${projectId}/compare`}
                className="inline-flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                差異分析
                <Scale className="h-4 w-4" />
              </Link>
              <Link
                href={`/${projectId}/budget`}
                className="inline-flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                預算明細
                <FileSpreadsheet className="h-4 w-4" />
              </Link>
              <Link
                href={`/${projectId}/acceptance`}
                className="inline-flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 sm:col-span-2"
              >
                對外驗收中心
                <ClipboardCheck className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <MetricCard label="合約總額" value={formatAmount(project.contractAmount)} sub="收入上限" />
            <MetricCard label="基準總預算" value={formatAmount(project.totalBudget)} sub="Excel 匯入基底" />
            <MetricCard label="預估淨利" value={formatAmount(baseProfit)} accent={baseProfit < 0} sub="合約 - 成本" />
            <MetricCard label="預估淨利率" value={`${baseProfitRate.toFixed(1)}%`} sub="前期投報" />
            <MetricCard label="EAC 預測" value={formatAmount(baseCost)} sub={`進度 ${progressRate.toFixed(1)}%`} />
            <MetricCard label="風險金額" value={formatAmount(riskAmount)} accent={riskAmount > 0} sub="超出基準成本" />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">市場價格與告警衝擊</h3>
            <p className="mt-1 text-xs text-slate-500">
              月增率超過 0.25% 會觸發利潤重算，以下為最新 CCI 訊號與本案衝擊估算。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={syncMarketNow}
              disabled={isSyncingMarket}
              className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {isSyncingMarket ? "同步中..." : "立即同步行情"}
            </button>
            <Link
              href="/api/market/latest"
              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              查看原始訊號 API
            </Link>
          </div>
        </div>

        {marketSignals.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            尚無行情快照資料。可先執行 `npm run market:sync` 或呼叫 `/api/market/sync`。
          </div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {marketSignals.map((signal) => {
              const impact = impactBySeries.get(signal.seriesKey);
              const mom = signal.momChangePct ?? 0;
              const triggered = signal.momChangePct !== null && Math.abs(signal.momChangePct) >= 0.25;
              return (
                <div
                  key={signal.seriesKey}
                  className={cn(
                    "rounded-2xl border p-4",
                    triggered ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"
                  )}
                >
                  <div className="text-xs font-semibold text-slate-800">{signal.seriesLabel}</div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    期間 {signal.period} · 指數 {signal.value.toFixed(2)}
                  </div>
                  <div
                    className={cn(
                      "mt-2 text-sm font-black",
                      mom >= 0 ? "text-rose-600" : "text-emerald-600"
                    )}
                  >
                    MoM {mom >= 0 ? "+" : ""}
                    {mom.toFixed(2)}%
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    YoY{" "}
                    {signal.yoyChangePct === null
                      ? "n/a"
                      : `${signal.yoyChangePct >= 0 ? "+" : ""}${signal.yoyChangePct.toFixed(2)}%`}
                  </div>

                  {impact ? (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-2.5 text-[11px] text-slate-600">
                      <div>
                        利潤衝擊 {impact.totalDelta >= 0 ? "+" : ""}
                        {formatAmount(impact.totalDelta)}
                      </div>
                      <div>
                        重算利潤率 {impact.projectedProfitRate.toFixed(1)}% ·{" "}
                        {formatDate(impact.triggeredAt)}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 text-[11px] text-slate-500">
                      目前未觸發本案衝擊紀錄。
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="已核准變更"
          value={formatAmount(operationsSummary.approvedChangeAmount)}
          sub="直接回寫到預算總額"
          accent={operationsSummary.approvedChangeAmount > 0}
        />
        <MetricCard
          label="請款總額"
          value={formatAmount(operationsSummary.billedAmount)}
          sub="作業中心請款累計"
        />
        <MetricCard
          label="回款總額"
          value={formatAmount(operationsSummary.collectedAmount)}
          sub="已收回現金"
        />
        <MetricCard
          label="稅後獲利"
          value={formatAmount(operationsSummary.latestAfterTaxProfit)}
          sub="最近一次稅務情境"
          accent={operationsSummary.latestAfterTaxProfit < 0}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {phaseCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className={cn(
                "rounded-[28px] border bg-gradient-to-br p-5 shadow-sm",
                card.tone
              )}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/80 p-2 text-slate-900 shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950">{card.title}</h3>
                  <p className="text-xs text-slate-500">串接目前專案資料與分析頁面</p>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                {card.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <Link
                href={card.href}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                {card.action}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-slate-900">
                <Layers3 className="h-5 w-5 text-sky-600" />
                <h3 className="font-bold">方案快照比較</h3>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                用成本與售價兩個最敏感的旋鈕，快速看不同方案的利潤與資金缺口。
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
              自訂方案不寫回資料庫
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="space-y-4 rounded-3xl bg-slate-50 p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">成本敏感度</label>
                  <span className={`text-sm font-bold ${costShock > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {costShock > 0 ? "+" : ""}{costShock}%
                  </span>
                </div>
                <input
                  type="range"
                  min={-10}
                  max={20}
                  step={1}
                  value={costShock}
                  onChange={(event) => setCostShock(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-sky-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">售價敏感度</label>
                  <span className={`text-sm font-bold ${revenueShock > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                    {revenueShock > 0 ? "+" : ""}{revenueShock}%
                  </span>
                </div>
                <input
                  type="range"
                  min={-10}
                  max={20}
                  step={1}
                  value={revenueShock}
                  onChange={(event) => setRevenueShock(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-emerald-600"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <StatPill label="基準成本" value={formatAmount(baseCost)} tone="sky" />
                <StatPill label="基準收入" value={formatAmount(baseRevenue)} tone="amber" />
                <StatPill label="目前實支" value={formatAmount(baseActual)} tone="emerald" />
                <StatPill label="目標門檻" value={`${(project.targetProfitRate * 100).toFixed(1)}%`} tone="slate" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {snapshots.map((snapshot) => {
                const isCustom = snapshot.title === "自訂方案";
                return (
                  <div
                    key={snapshot.title}
                    className={cn(
                      "rounded-3xl border p-4 shadow-sm",
                      snapshot.badge === "達標"
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-rose-200 bg-rose-50",
                      isCustom && "ring-2 ring-sky-300"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-slate-950">{snapshot.title}</h4>
                        <p className="text-[11px] text-slate-500">
                          成本 {snapshot.costShock > 0 ? "+" : ""}{snapshot.costShock}% / 售價 {snapshot.revenueShock > 0 ? "+" : ""}{snapshot.revenueShock}%
                        </p>
                      </div>
                      <span className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-bold",
                        snapshot.badge === "達標"
                          ? "bg-emerald-600 text-white"
                          : "bg-rose-600 text-white"
                      )}>
                        {snapshot.badge}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400">預估利潤</p>
                        <p className={cn("mt-1 text-sm font-black", snapshot.profit >= 0 ? "text-emerald-700" : "text-rose-700")}>
                          {snapshot.profit >= 0 ? "+" : ""}{formatAmount(snapshot.profit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">淨利率</p>
                        <p className="mt-1 text-sm font-black text-slate-900">{snapshot.profitRate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-slate-400">資金缺口</p>
                        <p className="mt-1 text-sm font-black text-slate-900">{formatAmount(snapshot.cashNeed)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">距目標</p>
                        <p className={cn("mt-1 text-sm font-black", snapshot.targetGap >= 0 ? "text-emerald-700" : "text-amber-700")}>
                          {snapshot.targetGap >= 0 ? "+" : ""}{snapshot.targetGap.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                      <span>調整後成本 {formatAmount(snapshot.adjustedCost)}</span>
                      <span>調整後收入 {formatAmount(snapshot.adjustedRevenue)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold">敏感度分析</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            目前先用最有用的材料曝險來看成本變化，後續可再接入正式稅務與變更單模型。
          </p>
          <div className="mt-4">
            <ProfitSimulator
              materials={materials}
              contractAmount={project.contractAmount}
              originalTotalBudget={project.totalBudget}
              targetProfitRate={project.targetProfitRate}
            />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-900">
              <FileSpreadsheet className="h-5 w-5 text-amber-600" />
              <h3 className="font-bold">資料覆蓋與匯入路徑</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              現有 Excel 已拆成主檔、明細、實支、進度、現金流五個來源層，這裡直接顯示覆蓋狀態。
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
            匯入：`scripts/seed.ts`
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard label="預算碼" value={`${coverage.budgetCodes} 筆`} sub="分類主檔" />
          <MetricCard label="預算明細" value={`${coverage.budgetLines} 筆`} sub="基準編列" />
          <MetricCard label="實支計價" value={`${coverage.actualValuations} 筆`} sub="A 案 / 變更" />
          <MetricCard label="進度表" value={`${coverage.scheduleItems} 筆`} sub="里程碑" />
          <MetricCard label="現金流" value={`${coverage.cashflowEntries} 筆`} sub="請款 / 回款" />
          <MetricCard label="覆蓋分數" value={`${coverageScore}%`} sub="已接資料層" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-slate-900">
                <Scale className="h-5 w-5 text-rose-500" />
                <h3 className="font-bold">中期變更與實支</h3>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                這裡直接看各主項分類的預算與實支差異，讓變更單與預算追蹤回到同一張表。
              </p>
            </div>
            <Link
              href={`/${projectId}/compare`}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              展開差異
            </Link>
          </div>

          <div className="mt-4 grid gap-3">
            {compareRows.slice(0, 4).map((row) => (
              <CompareCard key={row.main_category} row={row} />
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-slate-900">
                <CalendarDays className="h-5 w-5 text-sky-600" />
                <h3 className="font-bold">工期與回款節點</h3>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                進度表是後期 EAC 與回款時點的基底，沒有節點就沒有可驗證的預測。
              </p>
            </div>
            <Link
              href={`/${projectId}/schedule`}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              查看工期
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            {schedule.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                尚無進度資料
              </div>
            ) : (
              schedule.slice(0, 5).map((item, index) => (
                <MilestoneCard key={item.id} item={item} isLast={index === Math.min(schedule.length, 5) - 1} />
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <MainCategoryBars data={summary} />
        <BudgetPieChart data={summary} />
      </section>

      <InsightPanel forecast={forecast} targetProfitRate={project.targetProfitRate} />

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-900">
              <TriangleAlert className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold">後續可接的稅務與快照模組</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              目前已經把殘值法、預算、實支、進度、EAC、敏感度接起來；稅務與快照儲存可在下一階段往資料表延伸。
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">稅務模組</span>
            <span className="rounded-full bg-sky-50 px-3 py-1.5 text-sky-700">快照持久化</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">Excel 雙向同步</span>
          </div>
        </div>
      </section>
    </div>
  );
}
