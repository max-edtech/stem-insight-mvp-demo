import Link from "next/link";
import { CheckCircle2, ClipboardCheck, Download, FileWarning, ShieldCheck } from "lucide-react";
import { formatAmount, formatDate } from "@/lib/formatters";
import type { AcceptanceReadiness } from "@/lib/queries/acceptance";
import { cn } from "@/lib/utils";
import { saveAcceptanceReviewAction } from "@/app/[projectId]/acceptance/actions";

function dateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function CheckRow({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">
      <span>{label}</span>
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
      />
    </label>
  );
}

export function AcceptanceHubClient({
  projectId,
  readiness,
}: {
  projectId: string;
  readiness: AcceptanceReadiness;
}) {
  const passRatio = `${readiness.passCount}/${readiness.totalChecks}`;
  const autoGo = readiness.autoDecision === "go";
  const review = readiness.review;

  const reviewDefaults = {
    feasibilityPass: review?.feasibilityPass ?? readiness.checks.find((item) => item.key === "feasibility")?.passed ?? false,
    changePass: review?.changePass ?? readiness.checks.find((item) => item.key === "change")?.passed ?? false,
    variancePass: review?.variancePass ?? readiness.checks.find((item) => item.key === "variance")?.passed ?? false,
    cashflowPass: review?.cashflowPass ?? readiness.checks.find((item) => item.key === "cashflow")?.passed ?? false,
    taxPass: review?.taxPass ?? readiness.checks.find((item) => item.key === "tax")?.passed ?? false,
    exportPass: review?.exportPass ?? readiness.checks.find((item) => item.key === "export")?.passed ?? false,
  };

  return (
    <div className="space-y-4 px-4 py-4">
      <section className="relative overflow-hidden rounded-[32px] bg-slate-950 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.22),_transparent_35%),radial-gradient(circle_at_right,_rgba(14,165,233,0.14),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,0.92),_rgba(15,23,42,0.98))]" />
        <div className="relative z-10 p-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
            <ClipboardCheck className="h-3.5 w-3.5" />
            PoC 驗收中心
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
            <div className="space-y-3">
              <h2 className="text-3xl font-black tracking-tight">{readiness.project.name}</h2>
              <p className="text-sm leading-6 text-slate-300">
                這裡把「展示」轉成「可簽核驗收」：系統先自動判定，再由雙方確認 Go / Revise。
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  自動判定：{autoGo ? "Go" : "Revise"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  通過數：{passRatio}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  核心項目：{readiness.requiredAllPassed ? "全通過" : "未全通過"}
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <Link
                href={`/api/projects/${projectId}/export`}
                className="inline-flex items-center justify-between rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-bold text-slate-950 transition-transform hover:-translate-y-0.5"
              >
                匯出驗收 Excel
                <Download className="h-4 w-4" />
              </Link>
              <Link
                href={`/${projectId}/operations`}
                className="inline-flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                去補作業資料
                <FileWarning className="h-4 w-4" />
              </Link>
              <Link
                href={`/${projectId}`}
                className="inline-flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                回財務中樞
                <ShieldCheck className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-bold text-slate-900">系統自動驗收矩陣</h3>
        <p className="mt-1 text-xs text-slate-500">至少 5/6 通過且核心項目（變更、請回款、稅務）全通過，建議判定 Go。</p>

        <div className="mt-4 grid gap-3">
          {readiness.checks.map((item) => (
            <div
              key={item.key}
              className={cn(
                "rounded-2xl border p-4",
                item.passed ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-bold text-slate-900">{item.title}</div>
                <div className="flex items-center gap-2">
                  {item.required && <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Core</span>}
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-bold",
                      item.passed ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
                    )}
                  >
                    {item.passed ? "Pass" : "Fail"}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs leading-5 text-slate-600">{item.detail}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">簽核前重點數字</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-[11px] text-slate-500">合約總額</div>
              <div className="mt-1 text-lg font-black text-slate-900">{formatAmount(readiness.project.contractAmount)}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-[11px] text-slate-500">基準總預算</div>
              <div className="mt-1 text-lg font-black text-slate-900">{formatAmount(readiness.project.totalBudget)}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-[11px] text-slate-500">主項合計差異</div>
              <div className="mt-1 text-lg font-black text-slate-900">{formatAmount(readiness.metrics.totalVariance)}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-[11px] text-slate-500">請款缺口</div>
              <div className="mt-1 text-lg font-black text-slate-900">{formatAmount(readiness.metrics.outstandingBilling)}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-[11px] text-slate-500">非 0 實支筆數</div>
              <div className="mt-1 text-lg font-black text-slate-900">{readiness.metrics.nonZeroActualCount}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-[11px] text-slate-500">稅務情境筆數</div>
              <div className="mt-1 text-lg font-black text-slate-900">{readiness.metrics.taxScenarioCount}</div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            {readiness.metrics.nonZeroActualCount >= 10
              ? "EAC 管理等級：已達基本門檻（>= 10 筆非 0 實支）。"
              : "EAC 管理等級：建議補齊至少 10 筆非 0 實支，避免預測只停留示範層。"}
          </div>
        </div>

        <form action={saveAcceptanceReviewAction} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <input type="hidden" name="projectId" value={projectId} />
          <h3 className="text-base font-bold text-slate-900">人工簽核（對外驗收版）</h3>

          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">驗收日期</span>
            <input
              name="meetingDate"
              type="date"
              defaultValue={dateInputValue(review?.meetingDate ?? null)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-slate-400 focus:bg-white"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">甲方（業主/父親）</span>
            <input
              name="ownerName"
              defaultValue={review?.ownerName ?? ""}
              placeholder="例如：林先生"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-slate-400 focus:bg-white"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">乙方（系統負責人）</span>
            <input
              name="reviewerName"
              defaultValue={review?.reviewerName ?? ""}
              placeholder="例如：你的姓名"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-slate-400 focus:bg-white"
            />
          </label>

          <div className="space-y-2">
            <CheckRow label="前期試算通過" name="feasibilityPass" defaultChecked={reviewDefaults.feasibilityPass} />
            <CheckRow label="變更回寫通過" name="changePass" defaultChecked={reviewDefaults.changePass} />
            <CheckRow label="差異分析通過" name="variancePass" defaultChecked={reviewDefaults.variancePass} />
            <CheckRow label="請款/回款通過" name="cashflowPass" defaultChecked={reviewDefaults.cashflowPass} />
            <CheckRow label="稅後獲利通過" name="taxPass" defaultChecked={reviewDefaults.taxPass} />
            <CheckRow label="報表輸出通過" name="exportPass" defaultChecked={reviewDefaults.exportPass} />
          </div>

          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">簽核結論</span>
            <select
              name="decision"
              defaultValue={review?.decision ?? readiness.autoDecision}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-slate-400 focus:bg-white"
            >
              <option value="go">Go（可對外驗收）</option>
              <option value="revise">Revise（需補件）</option>
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">備註</span>
            <textarea
              name="notes"
              defaultValue={review?.notes ?? ""}
              rows={4}
              placeholder="例如：需在下次驗收前補 10 筆非 0 實支。"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-slate-400 focus:bg-white"
            />
          </label>

          <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">
            <CheckCircle2 className="h-4 w-4" />
            儲存驗收簽核
          </button>

          {review && (
            <div className="text-xs text-slate-500">
              最近更新：{formatDate(review.updatedAt)}
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
