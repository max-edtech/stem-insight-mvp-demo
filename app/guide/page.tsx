export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Calculator,
  ClipboardCheck,
  Clock3,
  Download,
  FilePlus2,
  HandCoins,
  Landmark,
  ListChecks,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/formatters";

type FocusAreaItem = {
  key: string;
  title: string;
  summary: string;
  checks: string[];
  href: string;
  hrefText: string;
  secondaryHref?: string;
  secondaryText?: string;
  icon: React.ComponentType<{ className?: string }>;
};

type StepItem = {
  no: string;
  title: string;
  summary: string;
  action: string;
  href: string;
  hrefText: string;
  icon: React.ComponentType<{ className?: string }>;
};

export default async function GuidePage() {
  const latestProject = await prisma.project.findFirst({
    orderBy: { createdAt: "desc" },
  });

  const projectHrefBase = latestProject ? `/${latestProject.id}` : "/new-project";
  const compareHref = latestProject ? `/${latestProject.id}/compare` : "/new-project";
  const scheduleHref = latestProject ? `/${latestProject.id}/schedule` : "/new-project";
  const costHref = latestProject ? `/${latestProject.id}/cost` : "/new-project";
  const operationsHref = `${projectHrefBase}/operations`;
  const acceptanceHref = `${projectHrefBase}/acceptance`;

  const focusAreas: FocusAreaItem[] = [
    {
      key: "pre-dev-budget",
      title: "前期開發預算",
      summary: "先確認土地條件、開發參數、融資假設是否可成立，再決定是否往下走。",
      checks: ["容積與銷坪係數", "利率與融資年期", "保本售價與目標利潤"],
      href: "/new-project",
      hrefText: "前往前期試算",
      icon: Landmark,
    },
    {
      key: "cashflow",
      title: "金流（含開票、利息）",
      summary: "請款（開票）與回款要對得上，稅務情境與資金缺口要即時可見。",
      checks: ["請款/回款是否都有登錄", "請款缺口是否在可控範圍", "稅後獲利與利息敏感度"],
      href: operationsHref,
      hrefText: "前往作業中心",
      icon: ReceiptText,
    },
    {
      key: "schedule-audit",
      title: "工期＋成本＋現場稽核",
      summary: "用比較頁抓偏差、用進度頁看里程碑、用造價分析看主項異常。",
      checks: ["預算 vs 實支差異", "里程碑日期是否合理", "主項成本是否偏離"],
      href: compareHref,
      hrefText: "前往比較頁",
      secondaryHref: scheduleHref,
      secondaryText: "看工期進度",
      icon: Clock3,
    },
    {
      key: "integration",
      title: "實務整合與對外驗收",
      summary: "把前中後資料串成同一份驗收結論，最後可直接匯出 Excel 交付。",
      checks: ["核心檢核是否全通過", "簽核資訊是否完整", "驗收 Excel 是否成功匯出"],
      href: acceptanceHref,
      hrefText: "前往驗收中心",
      secondaryHref: `${projectHrefBase}/`,
      secondaryText: "回總覽中樞",
      icon: ClipboardCheck,
    },
  ];

  const steps: StepItem[] = [
    {
      no: "01",
      title: "先做前期預算判斷",
      summary: "先輸入土地、建造、融資、銷售參數，確認案子可行性。",
      action: "先看保本售價、目標利潤、ROI/ROE",
      href: "/new-project",
      hrefText: "前往前期試算",
      icon: Calculator,
    },
    {
      no: "02",
      title: "再補金流與開票資料",
      summary: "在作業中心補齊變更單、請款（開票）、回款與稅務情境。",
      action: "至少填 1 筆變更、1 筆請款、1 筆回款、1 筆稅務情境",
      href: operationsHref,
      hrefText: "前往作業中心",
      icon: HandCoins,
    },
    {
      no: "03",
      title: "最後做工期與成本稽核",
      summary: "先看預算差異，再看工期里程碑，必要時回造價分析追主因。",
      action: "比較 → 進度 → 造價分析（循環檢查）",
      href: compareHref,
      hrefText: "前往比較頁",
      icon: BarChart3,
    },
    {
      no: "04",
      title: "整合簽核與輸出",
      summary: "在驗收中心確認結論與備註，完成後直接匯出交付檔。",
      action: "按「匯出驗收 Excel」",
      href: acceptanceHref,
      hrefText: "前往驗收中心",
      icon: ClipboardCheck,
    },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
              <ListChecks className="h-3.5 w-3.5" />
              決策操作指南
            </span>
            {latestProject && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                最新專案：{latestProject.name}（{formatDate(latestProject.createdAt)}）
              </span>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            以實務為主的操作頁：先預算、再金流、接著工期稽核、最後驗收
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            這頁針對四個關鍵重點重新布局：前期開發預算、金流（開票與利息）、工期與成本稽核、實務整合交付。
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/new-project"
              className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 transition-transform hover:-translate-y-0.5"
            >
              建立新案
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={operationsHref}
              className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 transition-transform hover:-translate-y-0.5"
            >
              金流 / 開票
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={compareHref}
              className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 transition-transform hover:-translate-y-0.5"
            >
              工期 / 稽核
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={acceptanceHref}
              className="inline-flex items-center justify-between rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              驗收 / 匯出
              <Download className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {focusAreas.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.key} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black text-slate-950">{item.title}</h2>
                  <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">檢查點</div>
                  <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                    {item.checks.map((point) => (
                      <li key={point}>• {point}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
                  >
                    {item.hrefText}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  {item.secondaryHref && item.secondaryText && (
                    <Link
                      href={item.secondaryHref}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      {item.secondaryText}
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.no} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-white">
                    {item.no}
                  </div>
                  <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <h2 className="mt-4 text-xl font-black text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                  操作重點：{item.action}
                </div>

                <Link
                  href={item.href}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
                >
                  {item.hrefText}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-950">簽核前 30 秒檢查</h3>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>1. 驗收中心是否顯示核心項目「全通過」。</li>
            <li>2. 請款缺口、利息影響與稅後獲利是否一致。</li>
            <li>3. 工期里程碑與成本差異是否完成一次稽核。</li>
            <li>4. 已成功下載驗收 Excel。</li>
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              回首頁
            </Link>
            <Link
              href={acceptanceHref}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white"
            >
              直接去驗收
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={costHref}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              補看造價分析
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
