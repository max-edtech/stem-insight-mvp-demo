export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  Download,
  FilePlus2,
  HandCoins,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/formatters";

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

  const steps: StepItem[] = [
    {
      no: "01",
      title: "建立新案",
      summary: "先把案名、起始日、工期與目標利潤輸入完成。",
      action: "按下「建立專案」",
      href: "/new-project",
      hrefText: "前往前期試算",
      icon: FilePlus2,
    },
    {
      no: "02",
      title: "補作業資料",
      summary: "在作業中心新增變更單、請款、回款與稅務情境。",
      action: "至少填 1 筆變更、1 筆請款、1 筆回款",
      href: `${projectHrefBase}/operations`,
      hrefText: "前往作業中心",
      icon: HandCoins,
    },
    {
      no: "03",
      title: "看差異與進度",
      summary: "打開比較與進度頁，先確認有沒有主項偏離、里程碑是否合理。",
      action: "先看「比較」，再看「進度」",
      href: `${projectHrefBase}/compare`,
      hrefText: "前往比較頁",
      icon: BarChart3,
    },
    {
      no: "04",
      title: "完成驗收與匯出",
      summary: "進入驗收中心，確認系統檢核結果後，直接匯出 Excel。",
      action: "按「匯出驗收 Excel」",
      href: `${projectHrefBase}/acceptance`,
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
              父親操作指南
            </span>
            {latestProject && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                最新專案：{latestProject.name}（{formatDate(latestProject.createdAt)}）
              </span>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            一條連結就能操作：照 1 → 2 → 3 → 4 走完即可
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            傳這頁連結給父親即可。每一步都有按鈕，點進去照頁面指示完成，不需要記公式。
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
              href={`${projectHrefBase}/operations`}
              className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 transition-transform hover:-translate-y-0.5"
            >
              作業中心
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`${projectHrefBase}/acceptance`}
              className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 transition-transform hover:-translate-y-0.5"
            >
              驗收中心
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`${projectHrefBase}/acceptance`}
              className="inline-flex items-center justify-between rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              匯出 Excel
              <Download className="h-4 w-4" />
            </Link>
          </div>
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
            <li>2. 請款缺口是否在可接受範圍。</li>
            <li>3. 已成功下載驗收 Excel。</li>
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              回首頁
            </Link>
            <Link
              href={`${projectHrefBase}/acceptance`}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white"
            >
              直接去驗收
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
