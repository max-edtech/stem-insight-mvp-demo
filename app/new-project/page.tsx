"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Calculator,
  Clock3,
  Coins,
  Landmark,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatAmount } from "@/lib/formatters";
import {
  CASE_TEMPLATES,
  calculateFeasibility,
  getTemplate,
  type FeasibilityInputs,
} from "@/lib/feasibility";
import { cn } from "@/lib/utils";
import { buildParameterSnapshot } from "@/lib/parameter-registry";
import { RiskAnalysisPanel } from "@/components/feasibility/RiskAnalysisPanel";
import { createProjectCaseAction } from "./actions";

function cloneInputs(inputs: FeasibilityInputs): FeasibilityInputs {
  return {
    land: { ...inputs.land },
    cost: { ...inputs.cost },
    finance: { ...inputs.finance },
    sales: { ...inputs.sales },
  };
}

function FieldCard({
  name,
  label,
  value,
  onChange,
  hint,
  step = "1",
  min,
}: {
  name: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  step?: string;
  min?: number;
}) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-end justify-between gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          {label}
        </span>
        <span className="text-xs font-semibold text-slate-400">{hint}</span>
      </div>
      <input
        name={name}
        type="number"
        step={step}
        min={min}
        value={Number.isFinite(value) ? value : ""}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-bold text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white"
      />
    </label>
  );
}

function TextField({
  name,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date";
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-bold text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white"
      />
    </label>
  );
}

function ResultTile({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[24px] border p-4 shadow-sm",
        accent ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"
      )}
    >
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className={cn("mt-1 text-2xl font-black", accent ? "text-emerald-700" : "text-slate-950")}>
        {value}
      </div>
      <div className="mt-1 text-sm text-slate-500">{sub}</div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {title}
      </div>
      <div className="mt-1 text-2xl font-black text-slate-950">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{note}</div>
    </div>
  );
}

export default function NewProjectPage() {
  const [templateId, setTemplateId] = useState(CASE_TEMPLATES[0].id);
  const [inputs, setInputs] = useState<FeasibilityInputs>(() => cloneInputs(CASE_TEMPLATES[0].inputs));
  const [projectName, setProjectName] = useState(CASE_TEMPLATES[0].name);
  const [startDate, setStartDate] = useState("");
  const [totalDays, setTotalDays] = useState(Math.round(CASE_TEMPLATES[0].inputs.finance.duration * 365));
  const [targetProfitRate, setTargetProfitRate] = useState(15);

  const selectedTemplate = getTemplate(templateId);
  const result = useMemo(() => calculateFeasibility(inputs), [inputs]);
  const parameterSnapshotJson = useMemo(
    () => JSON.stringify(buildParameterSnapshot(inputs, templateId)),
    [inputs, templateId]
  );

  const loadTemplate = (nextTemplateId: string) => {
    const template = getTemplate(nextTemplateId);
    setTemplateId(template.id);
    setInputs(cloneInputs(template.inputs));
    setProjectName(template.name);
    setTotalDays(Math.round(template.inputs.finance.duration * 365));
    setTargetProfitRate(15);
    setStartDate("");
  };

  const resetCurrent = () => loadTemplate(templateId);

  const completeness = [
    inputs.land.area,
    inputs.land.price,
    inputs.land.far,
    inputs.land.bonus,
    inputs.land.sellableRatio,
    inputs.cost.unitBuildCost,
    inputs.cost.softCostRate,
    inputs.cost.marketingRate,
    inputs.cost.adminRate,
    inputs.finance.landLoanRate,
    inputs.finance.constLoanRate,
    inputs.finance.interestRate,
    inputs.finance.duration,
    inputs.sales.expectedPrice,
  ].filter((value) => Number.isFinite(value) && value > 0).length;

  const completenessRate = Math.round((completeness / 14) * 100);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] pb-20">
      <PageHeader
        title="案件建立與試算"
        subtitle="先用同一套公式跑，再把結果存成正式案件。"
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[34px] bg-slate-950 p-6 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.24),_transparent_35%),radial-gradient(circle_at_right,_rgba(59,130,246,0.16),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(15,23,42,0.99))]" />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-amber-200 uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                Formula Core / Multi-case ready
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                先試算，再建立案件
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                這裡不只是 Excel 的搬運工。你可以直接選模板、調參數、看前期殘值法與後期獲利，
                然後把同一套公式存成正式案件，後續再補變更單、請款、回款與稅務資料。
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 transition-transform hover:-translate-y-0.5"
                >
                  回首頁
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={resetCurrent}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                >
                  <RotateCcw className="h-4 w-4" />
                  重置模板
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  完整度
                </div>
                <div className="mt-1 text-3xl font-black text-white">{completenessRate}%</div>
                <div className="mt-1 text-sm text-slate-300">目前已填入的關鍵欄位</div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  選擇模板
                </div>
                <div className="mt-1 text-2xl font-black text-white">{selectedTemplate.name}</div>
                <div className="mt-1 text-sm text-slate-300">{selectedTemplate.badge}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          {CASE_TEMPLATES.map((template) => {
            const active = template.id === templateId;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => loadTemplate(template.id)}
                className={cn(
                  "rounded-[28px] border p-5 text-left shadow-sm transition-transform hover:-translate-y-0.5",
                  active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className={cn("text-[10px] font-black uppercase tracking-[0.18em]", active ? "text-amber-300" : "text-slate-400")}>
                      {template.badge}
                    </div>
                    <h2 className="mt-1 text-lg font-bold">{template.name}</h2>
                  </div>
                  {active && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                </div>
                <p className={cn("mt-3 text-sm leading-6", active ? "text-slate-300" : "text-slate-500")}>
                  {template.description}
                </p>
              </button>
            );
          })}
        </section>

        <form action={createProjectCaseAction} className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-slate-950">
                <Landmark className="h-5 w-5 text-slate-600" />
                <h3 className="font-bold">案件基本資料</h3>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <TextField
                  name="projectName"
                  label="案件名稱"
                  value={projectName}
                  onChange={setProjectName}
                  placeholder="例如：台北住宅案"
                />
                <TextField
                  name="startDate"
                  label="預計開工日"
                  value={startDate}
                  onChange={setStartDate}
                  type="date"
                />
                <FieldCard
                  name="totalDays"
                  label="總工期(日)"
                  value={totalDays}
                  onChange={setTotalDays}
                  hint="天"
                  min={1}
                />
                <FieldCard
                  name="targetProfitRate"
                  label="目標獲利率"
                  value={targetProfitRate}
                  onChange={setTargetProfitRate}
                  hint="%"
                  min={0}
                  step="0.1"
                />
                <input type="hidden" name="templateId" value={templateId} />
                <input type="hidden" name="parameterSnapshotJson" value={parameterSnapshotJson} />
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-slate-950">
                <Coins className="h-5 w-5 text-slate-600" />
                <h3 className="font-bold">前期土地假設</h3>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <FieldCard
                  name="landArea"
                  label="土地面積"
                  value={inputs.land.area}
                  onChange={(value) => setInputs((prev) => ({ ...prev, land: { ...prev.land, area: value } }))}
                  hint="坪"
                  min={0}
                />
                <FieldCard
                  name="landPrice"
                  label="土地單價"
                  value={inputs.land.price}
                  onChange={(value) => setInputs((prev) => ({ ...prev, land: { ...prev.land, price: value } }))}
                  hint="元"
                  min={0}
                />
                <FieldCard
                  name="landFar"
                  label="容積率"
                  value={inputs.land.far}
                  onChange={(value) => setInputs((prev) => ({ ...prev, land: { ...prev.land, far: value } }))}
                  hint="%"
                  min={0}
                />
                <FieldCard
                  name="landBonus"
                  label="獎勵容積"
                  value={inputs.land.bonus}
                  onChange={(value) => setInputs((prev) => ({ ...prev, land: { ...prev.land, bonus: value } }))}
                  hint="%"
                  min={0}
                />
                <FieldCard
                  name="sellableRatio"
                  label="銷坪係數"
                  value={inputs.land.sellableRatio}
                  onChange={(value) => setInputs((prev) => ({ ...prev, land: { ...prev.land, sellableRatio: value } }))}
                  hint="倍"
                  step="0.01"
                  min={0}
                />
                <FieldCard
                  name="landTaxFeeRate"
                  label="稅費比率"
                  value={inputs.land.landTaxFeeRate * 100}
                  onChange={(value) =>
                    setInputs((prev) => ({
                      ...prev,
                      land: { ...prev.land, landTaxFeeRate: value / 100 },
                    }))
                  }
                  hint="%"
                  step="0.01"
                  min={0}
                />
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-slate-950">
                <Calculator className="h-5 w-5 text-slate-600" />
                <h3 className="font-bold">成本與融資假設</h3>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <FieldCard
                  name="unitBuildCost"
                  label="營造單價"
                  value={inputs.cost.unitBuildCost}
                  onChange={(value) => setInputs((prev) => ({ ...prev, cost: { ...prev.cost, unitBuildCost: value } }))}
                  hint="元/坪"
                  min={0}
                />
                <FieldCard
                  name="softCostRate"
                  label="軟成本率"
                  value={inputs.cost.softCostRate}
                  onChange={(value) => setInputs((prev) => ({ ...prev, cost: { ...prev.cost, softCostRate: value } }))}
                  hint="%"
                  min={0}
                />
                <FieldCard
                  name="marketingRate"
                  label="銷售費率"
                  value={inputs.cost.marketingRate}
                  onChange={(value) => setInputs((prev) => ({ ...prev, cost: { ...prev.cost, marketingRate: value } }))}
                  hint="%"
                  min={0}
                />
                <FieldCard
                  name="adminRate"
                  label="管理費率"
                  value={inputs.cost.adminRate}
                  onChange={(value) => setInputs((prev) => ({ ...prev, cost: { ...prev.cost, adminRate: value } }))}
                  hint="%"
                  min={0}
                />
                <FieldCard
                  name="landLoanRate"
                  label="土融成數"
                  value={inputs.finance.landLoanRate}
                  onChange={(value) => setInputs((prev) => ({ ...prev, finance: { ...prev.finance, landLoanRate: value } }))}
                  hint="%"
                  min={0}
                />
                <FieldCard
                  name="constLoanRate"
                  label="建融成數"
                  value={inputs.finance.constLoanRate}
                  onChange={(value) => setInputs((prev) => ({ ...prev, finance: { ...prev.finance, constLoanRate: value } }))}
                  hint="%"
                  min={0}
                />
                <FieldCard
                  name="interestRate"
                  label="利率"
                  value={inputs.finance.interestRate}
                  onChange={(value) => setInputs((prev) => ({ ...prev, finance: { ...prev.finance, interestRate: value } }))}
                  hint="%"
                  step="0.1"
                  min={0}
                />
                <FieldCard
                  name="financeDuration"
                  label="融資期間"
                  value={inputs.finance.duration}
                  onChange={(value) => setInputs((prev) => ({ ...prev, finance: { ...prev.finance, duration: value } }))}
                  hint="年"
                  step="0.1"
                  min={0}
                />
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-slate-950">
                <Target className="h-5 w-5 text-slate-600" />
                <h3 className="font-bold">後期銷售假設</h3>
              </div>
              <div className="mt-5 max-w-md">
                <FieldCard
                  name="expectedPrice"
                  label="預估售價"
                  value={inputs.sales.expectedPrice}
                  onChange={(value) => setInputs((prev) => ({ ...prev, sales: { ...prev.sales, expectedPrice: value } }))}
                  hint="元/坪"
                  min={0}
                />
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl">
              <div className="flex items-center gap-2 text-amber-200">
                <TrendingUp className="h-5 w-5" />
                <h3 className="font-bold">即時計算結果</h3>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-3xl bg-white/5 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">可售總樓地板面積</div>
                  <div className="mt-1 text-3xl font-black text-white">{result.totalFloorArea.toFixed(2)}</div>
                  <div className="mt-1 text-sm text-slate-300">坪</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/5 p-3">
                    <div className="text-[10px] text-slate-400">損益兩平售價</div>
                    <div className="mt-1 text-lg font-black text-amber-300">{formatAmount(result.breakEvenPrice)}</div>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-3">
                    <div className="text-[10px] text-slate-400">獲利率</div>
                    <div className={cn("mt-1 text-lg font-black", result.profitRate >= 0 ? "text-emerald-300" : "text-rose-300")}>
                      {result.profitRate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-3">
                    <div className="text-[10px] text-slate-400">ROE</div>
                    <div className={cn("mt-1 text-lg font-black", result.roe >= 0 ? "text-sky-300" : "text-rose-300")}>
                      {result.roe.toFixed(1)}%
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-3">
                    <div className="text-[10px] text-slate-400">淨利</div>
                    <div className={cn("mt-1 text-lg font-black", result.netProfit >= 0 ? "text-emerald-300" : "text-rose-300")}>
                      {formatAmount(result.netProfit)}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
                    <Clock3 className="h-4 w-4 text-amber-300" />
                    建立後會自動生成
                  </div>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
                    <li>1. 6 個預算碼與成本明細</li>
                    <li>2. 4 個里程碑與基礎現金流</li>
                    <li>3. 可直接進入專案總覽、比較與作業頁</li>
                  </ul>
                </div>

                <RiskAnalysisPanel
                  inputs={inputs}
                  targetProfitRatePercent={targetProfitRate}
                />
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-bold text-slate-950 transition-transform hover:-translate-y-0.5"
                >
                  建立案件並開啟
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-slate-950">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold">可重複套用的公式內核</h3>
              </div>
              <div className="mt-4 space-y-3">
                <SummaryCard
                  title="前期"
                  value={formatAmount(result.totalLandCost)}
                  note="土地取得、稅費與融資假設"
                />
                <SummaryCard
                  title="中期"
                  value={formatAmount(result.totalBuildCost + result.totalSoftCost)}
                  note="工程、軟成本與進度節奏"
                />
                <SummaryCard
                  title="後期"
                  value={formatAmount(result.totalSales - result.totalInvestment)}
                  note="獲利、回款與風險差距"
                />
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
