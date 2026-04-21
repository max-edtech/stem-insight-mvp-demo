"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowRight,
  Banknote,
  BadgeCheck,
  Calculator,
  ChevronRight,
  Landmark,
  ReceiptText,
  TriangleAlert,
  TrendingUp,
} from "lucide-react";
import { formatAmount, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type {
  OperationOverview,
  OperationChangeOrder,
  OperationCashflowEntry,
  OperationTaxScenario,
} from "@/lib/queries/operations";
import {
  createBillingAction,
  createChangeOrderAction,
  createCollectionAction,
  deleteBillingAction,
  deleteChangeOrderAction,
  deleteCollectionAction,
  deleteTaxScenarioAction,
  updateBillingAction,
  updateChangeOrderAction,
  updateCollectionAction,
  updateTaxScenarioAction,
  saveTaxScenarioAction,
} from "@/app/[projectId]/operations/actions";

function PanelTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-slate-900">
          <Icon className="h-5 w-5 text-slate-600" />
          <h3 className="font-bold">{title}</h3>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "emerald" | "amber" | "rose" | "sky" }) {
  const toneClass = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    sky: "bg-sky-100 text-sky-700",
  }[tone];

  return <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", toneClass)}>{children}</span>;
}

function TextField({
  name,
  label,
  defaultValue,
  placeholder,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue?: string | number;
  placeholder?: string;
  type?: "text" | "number" | "date";
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white"
      />
    </label>
  );
}

function TextAreaField({
  name,
  label,
  defaultValue,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white"
      />
    </label>
  );
}

function dateValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function ChangeOrderCard({
  item,
  projectId,
}: {
  item: OperationChangeOrder;
  projectId: string;
}) {
  const approved = item.status === "approved";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{item.orderNo}</div>
          <div className="mt-1 text-sm font-bold text-slate-950">{item.title}</div>
        </div>
        <Badge tone={approved ? "emerald" : item.status === "rejected" ? "rose" : "amber"}>{item.status}</Badge>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">金額變動</div>
          <div className={cn("mt-1 text-lg font-black", item.deltaAmount >= 0 ? "text-emerald-600" : "text-rose-600")}>
            {item.deltaAmount >= 0 ? "+" : ""}
            {formatAmount(item.deltaAmount)}
          </div>
        </div>
        {item.approvedAt && <div className="text-xs text-slate-400">{formatDate(item.approvedAt)}</div>}
      </div>

      {item.note && <p className="mt-3 text-xs leading-5 text-slate-500">{item.note}</p>}

      <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          編修 / 刪除
        </summary>
        <div className="mt-3 space-y-3">
          <form action={updateChangeOrderAction} className="space-y-2">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="id" value={item.id} />
            <TextField name="orderNo" label="編號" defaultValue={item.orderNo} />
            <TextField name="title" label="標題" defaultValue={item.title} />
            <TextField name="deltaAmount" label="金額變動" type="number" defaultValue={item.deltaAmount} />
            <label className="block space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">狀態</span>
              <select
                name="status"
                defaultValue={item.status}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-slate-400"
              >
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
              </select>
            </label>
            <TextAreaField name="note" label="備註" defaultValue={item.note ?? ""} />
            <button type="submit" className="w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">
              更新變更單
            </button>
          </form>
          <form action={deleteChangeOrderAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="id" value={item.id} />
            <button
              type="submit"
              className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700"
            >
              刪除變更單
            </button>
          </form>
        </div>
      </details>
    </div>
  );
}

function CashflowCard({
  item,
  tone,
  projectId,
  kind,
}: {
  item: OperationCashflowEntry;
  tone: "emerald" | "sky";
  projectId: string;
  kind: "billing" | "collection";
}) {
  const updateAction = kind === "billing" ? updateBillingAction : updateCollectionAction;
  const deleteAction = kind === "billing" ? deleteBillingAction : deleteCollectionAction;
  const label = kind === "billing" ? "請款" : "回款";
  const dateName = kind === "billing" ? "dueDate" : "receivedDate";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            {item.itemCode ?? "現金流"}
          </div>
          <div className="mt-1 text-sm font-bold text-slate-950">{item.itemName ?? "未命名"}</div>
        </div>
        <Badge tone={tone}>{item.mainCategory ?? "-"}</Badge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-slate-400">金額</div>
          <div className={cn("mt-1 text-sm font-black", tone === "emerald" ? "text-emerald-600" : "text-sky-600")}>
            {formatAmount(item.amount)}
          </div>
        </div>
        <div>
          <div className="text-slate-400">實收</div>
          <div className="mt-1 text-sm font-black text-slate-900">{formatAmount(item.cashAmount)}</div>
        </div>
      </div>

      {(item.startDate || item.endDate) && (
        <div className="mt-3 text-xs text-slate-400">
          {item.startDate ? formatDate(item.startDate) : "未定"} - {item.endDate ? formatDate(item.endDate) : "未定"}
        </div>
      )}
      {item.note && <p className="mt-2 text-xs leading-5 text-slate-500">{item.note}</p>}

      <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          編修 / 刪除
        </summary>
        <div className="mt-3 space-y-3">
          <form action={updateAction} className="space-y-2">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="id" value={item.id} />
            <TextField name="itemCode" label="編號" defaultValue={item.itemCode ?? ""} />
            <TextField name="itemName" label="名稱" defaultValue={item.itemName ?? ""} />
            <TextField name="amount" label="金額" type="number" defaultValue={item.amount} />
            <TextField name={dateName} label="日期" type="date" defaultValue={dateValue(item.startDate)} />
            <TextAreaField name="note" label="備註" defaultValue={item.note ?? ""} />
            <button type="submit" className="w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">
              更新{label}
            </button>
          </form>
          <form action={deleteAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="id" value={item.id} />
            <button
              type="submit"
              className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700"
            >
              刪除{label}
            </button>
          </form>
        </div>
      </details>
    </div>
  );
}

function TaxScenarioCard({
  item,
  projectId,
}: {
  item: OperationTaxScenario;
  projectId: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">稅務情境</div>
          <div className="mt-1 text-sm font-bold text-slate-950">{item.title}</div>
        </div>
        <Badge tone="amber">{item.status}</Badge>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
        <div>
          <div className="text-slate-400">課稅所得</div>
          <div className="mt-1 text-sm font-black text-slate-900">{formatAmount(item.taxableProfit)}</div>
        </div>
        <div>
          <div className="text-slate-400">稅率</div>
          <div className="mt-1 text-sm font-black text-slate-900">{item.taxRate.toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-slate-400">估算稅額</div>
          <div className="mt-1 text-sm font-black text-rose-600">{formatAmount(item.estimatedTax)}</div>
        </div>
      </div>
      {item.note && <p className="mt-2 text-xs leading-5 text-slate-500">{item.note}</p>}

      <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          編修 / 刪除
        </summary>
        <div className="mt-3 space-y-3">
          <form action={updateTaxScenarioAction} className="space-y-2">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="id" value={item.id} />
            <TextField name="title" label="名稱" defaultValue={item.title} />
            <TextField name="taxableProfit" label="課稅所得" type="number" defaultValue={item.taxableProfit} />
            <TextField name="taxRate" label="稅率" type="number" defaultValue={item.taxRate} />
            <TextAreaField name="note" label="備註" defaultValue={item.note ?? ""} />
            <button type="submit" className="w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">
              更新稅務情境
            </button>
          </form>
          <form action={deleteTaxScenarioAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="id" value={item.id} />
            <button
              type="submit"
              className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700"
            >
              刪除稅務情境
            </button>
          </form>
        </div>
      </details>
    </div>
  );
}

export function OperationsHubClient({
  projectId,
  data,
}: {
  projectId: string;
  data: OperationOverview;
}) {
  const project = data.project;
  const baseProfit = data.summary.currentProfit;
  const afterTaxProfit = data.summary.latestAfterTaxProfit;
  const approvedChange = data.summary.approvedChangeAmount;

  return (
    <div className="px-4 py-4 space-y-4">
      <section className="relative overflow-hidden rounded-[32px] bg-slate-950 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.22),_transparent_35%),radial-gradient(circle_at_right,_rgba(14,165,233,0.14),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,0.92),_rgba(15,23,42,0.98))]" />
        <div className="relative z-10 p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-amber-200 uppercase">
                <BadgeCheck className="h-3.5 w-3.5" />
                作業中心 / Change Order / Billing / Tax
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                  {project?.name ?? "未命名案件"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  變更單會更新預算，請款與回款會進現金流，稅務情境可以先存檔當預估基準。
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:w-[360px]">
              <Link
                href={`/${projectId}`}
                className="inline-flex items-center justify-between gap-3 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-bold text-slate-950 transition-transform hover:-translate-y-0.5"
              >
                回總覽
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/${projectId}/budget`}
                className="inline-flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                看預算
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[26px] border border-white/10 bg-white/5 p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">現行預算</div>
              <div className="mt-1 text-2xl font-black text-white">{project ? formatAmount(project.totalBudget) : "-"}</div>
              <div className="mt-1 text-sm text-slate-300">已核准變更會回寫</div>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-white/5 p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">已核准變更</div>
              <div className="mt-1 text-2xl font-black text-emerald-300">{formatAmount(approvedChange)}</div>
              <div className="mt-1 text-sm text-slate-300">作業中心累計</div>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-white/5 p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">請款缺口</div>
              <div className={cn("mt-1 text-2xl font-black", data.summary.outstandingBilling > 0 ? "text-amber-300" : "text-emerald-300")}>
                {formatAmount(data.summary.outstandingBilling)}
              </div>
              <div className="mt-1 text-sm text-slate-300">請款減回款</div>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-white/5 p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">稅後獲利</div>
              <div className={cn("mt-1 text-2xl font-black", afterTaxProfit >= 0 ? "text-sky-300" : "text-rose-300")}>
                {formatAmount(afterTaxProfit)}
              </div>
              <div className="mt-1 text-sm text-slate-300">最近稅務情境</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">變更總額</div>
          <div className="mt-1 text-2xl font-black text-slate-950">
            {formatAmount(data.summary.approvedChangeAmount + data.summary.pendingChangeAmount)}
          </div>
          <div className="mt-1 text-sm text-slate-500">已核准 + 待核准</div>
        </div>
        <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">請款金額</div>
          <div className="mt-1 text-2xl font-black text-slate-950">{formatAmount(data.summary.billedAmount)}</div>
          <div className="mt-1 text-sm text-slate-500">系統累計</div>
        </div>
        <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">回款金額</div>
          <div className="mt-1 text-2xl font-black text-slate-950">{formatAmount(data.summary.collectedAmount)}</div>
          <div className="mt-1 text-sm text-slate-500">系統累計</div>
        </div>
        <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">目前獲利</div>
          <div className={cn("mt-1 text-2xl font-black", baseProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
            {formatAmount(baseProfit)}
          </div>
          <div className="mt-1 text-sm text-slate-500">契約金額 - 現行預算</div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <PanelTitle
            icon={Landmark}
            title="變更單"
            subtitle="已核准的變更會直接回寫到預算；待核准則只保留在清單。"
          />
          <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_360px]">
            <div className="space-y-3">
              {data.changeOrders.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                  目前沒有變更單
                </div>
              ) : (
                data.changeOrders.map((item) => (
                  <ChangeOrderCard key={item.id} item={item} projectId={projectId} />
                ))
              )}
            </div>

            <form action={createChangeOrderAction} className="rounded-[26px] border border-slate-200 bg-slate-50 p-4 space-y-3">
              <input type="hidden" name="projectId" value={projectId} />
              <TextField name="orderNo" label="變更編號" placeholder="CO-001" />
              <TextField name="title" label="變更標題" placeholder="材料升級" />
              <TextField name="deltaAmount" label="金額變動" type="number" placeholder="2500000" />
              <label className="block space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">狀態</span>
                <select
                  name="status"
                  defaultValue="pending"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-slate-400"
                >
                  <option value="pending">pending</option>
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                </select>
              </label>
              <TextAreaField name="note" label="備註" placeholder="為什麼變更、影響哪些項目" />
              <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">
                儲存變更單
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <PanelTitle
              icon={ReceiptText}
              title="請款 / 回款"
              subtitle="請款先記帳，回款再沖銷。這些會直接進現金流。"
            />
            <div className="mt-4 grid gap-4">
              <form action={createBillingAction} className="rounded-[26px] border border-slate-200 bg-slate-50 p-4 space-y-3">
                <input type="hidden" name="projectId" value={projectId} />
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-bold text-slate-950">新增請款</h4>
                  <Badge tone="sky">billing</Badge>
                </div>
                <TextField name="itemCode" label="請款編號" placeholder="BILL-001" />
                <TextField name="itemName" label="請款項目" placeholder="一期工程請款" />
                <TextField name="amount" label="請款金額" type="number" placeholder="1500000" />
                <TextField name="dueDate" label="請款日期" type="date" />
                <TextAreaField name="note" label="備註" placeholder="請款依據或發票資訊" />
                <button type="submit" className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-sm font-bold text-white">
                  儲存請款
                </button>
              </form>

              <form action={createCollectionAction} className="rounded-[26px] border border-slate-200 bg-slate-50 p-4 space-y-3">
                <input type="hidden" name="projectId" value={projectId} />
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-bold text-slate-950">新增回款</h4>
                  <Badge tone="emerald">collection</Badge>
                </div>
                <TextField name="itemCode" label="回款編號" placeholder="RCV-001" />
                <TextField name="itemName" label="回款項目" placeholder="一期工程回款" />
                <TextField name="amount" label="回款金額" type="number" placeholder="1500000" />
                <TextField name="receivedDate" label="回款日期" type="date" />
                <TextAreaField name="note" label="備註" placeholder="回款來源或對帳資訊" />
                <button type="submit" className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white">
                  儲存回款
                </button>
              </form>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <PanelTitle
              icon={Calculator}
              title="稅務情境"
              subtitle="先存估算基準，後續可比較不同課稅所得與稅率。"
            />
            <form action={saveTaxScenarioAction} className="mt-4 space-y-3 rounded-[26px] border border-slate-200 bg-slate-50 p-4">
              <input type="hidden" name="projectId" value={projectId} />
              <TextField name="title" label="情境名稱" placeholder="基準情境" />
              <TextField name="taxableProfit" label="課稅所得" type="number" defaultValue={Math.max(0, baseProfit)} />
              <TextField name="taxRate" label="稅率" type="number" defaultValue={20} />
              <TextAreaField name="note" label="備註" placeholder="稅務假設或風險說明" />
              <button type="submit" className="w-full rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white">
                儲存稅務情境
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <PanelTitle
            icon={Banknote}
            title="請款清單"
            subtitle="保留所有請款紀錄，方便之後比對回款進度。"
          />
          <div className="mt-4 space-y-3">
            {data.billingEntries.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                目前沒有請款紀錄
              </div>
            ) : (
              data.billingEntries.map((item) => (
                <CashflowCard key={item.id} item={item} tone="sky" projectId={projectId} kind="billing" />
              ))
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <PanelTitle
            icon={TrendingUp}
            title="回款清單"
            subtitle="回款會直接進收入現金流，幫助看見真實收支節奏。"
          />
          <div className="mt-4 space-y-3">
            {data.collectionEntries.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                目前沒有回款紀錄
              </div>
            ) : (
              data.collectionEntries.map((item) => (
                <CashflowCard key={item.id} item={item} tone="emerald" projectId={projectId} kind="collection" />
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <PanelTitle
          icon={TriangleAlert}
          title="最近稅務情境"
          subtitle="保存後會同步加入一筆稅務現金流，方便你看後期獲利與稅負壓力。"
        />
        <div className="mt-4 grid gap-3 xl:grid-cols-3">
          {data.taxScenarios.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400 xl:col-span-3">
              目前沒有稅務情境
            </div>
          ) : (
            data.taxScenarios.slice(0, 3).map((item) => (
              <TaxScenarioCard key={item.id} item={item} projectId={projectId} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
