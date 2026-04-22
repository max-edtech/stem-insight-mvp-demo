export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatAmount, formatDate } from "@/lib/formatters";
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  CalendarDays,
  ChevronRight,
  Coins,
  Layers3,
  Scale,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

export default async function HomePage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });

  const latestProject = projects[0] ?? null;
  const totalBudget = projects.reduce((sum, project) => sum + Number(project.totalBudget || 0), 0);
  const totalProjects = projects.length;
  const totalDays = projects.reduce((sum, project) => sum + Number(project.totalDays || 0), 0);
  const avgBudget = totalProjects > 0 ? totalBudget / totalProjects : 0;

  const pillars = [
    {
      icon: Scale,
      title: "前期｜殘值法",
      text: "從土地條件、容積、獎勵容積與售價假設出發，先把開發可行性算清楚。",
    },
    {
      icon: Coins,
      title: "中期｜成本追蹤",
      text: "把預算、變更、實支、進度與請款放到同一條資料鏈，避免預算和現場脫鉤。",
    },
    {
      icon: Target,
      title: "後期｜獲利預測",
      text: "用 EAC、回款與利息衝擊持續重算完工利潤，提早看到風險與機會。",
    },
  ] as const;

  const highlights = [
    {
      label: "專案數",
      value: `${totalProjects}`,
      sub: latestProject ? latestProject.name : "尚未匯入專案",
    },
    {
      label: "總預算",
      value: formatAmount(totalBudget),
      sub: "目前資料庫中所有專案加總",
    },
    {
      label: "平均預算",
      value: formatAmount(avgBudget),
      sub: "用來看目前資料規模",
    },
    {
      label: "總工期",
      value: `${totalDays > 0 ? totalDays : 0} 天`,
      sub: "資料庫內已匯入工期加總",
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.16),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)]">
      <section className="relative">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.92))]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 text-white/80">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              開發財務中樞 Preview
            </div>
            {latestProject && (
              <Link
                href={`/${latestProject.id}`}
                className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 sm:inline-flex"
              >
                打開最新專案
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="max-w-3xl text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200/90">
                Construction Finance Hub
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                把土地開發、營建成本與獲利預測，串成同一個決策首頁。
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                這個首頁先給你一個可預覽的產品外觀。你可以從這裡直接進到專案中樞、前期試算、
                預算明細、成本差異與工期追蹤，先感受資料如何被串起來。
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={latestProject ? `/${latestProject.id}` : "/new-project"}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 transition-transform hover:-translate-y-0.5"
                >
                  進入財務中樞
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/new-project"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                >
                  看前期試算
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/guide"
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-300/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition-transform hover:-translate-y-0.5"
                >
                  操作指南
                  <BookOpenCheck className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {highlights.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-white shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur"
                >
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                    {item.label}
                  </div>
                  <div className="mt-1 text-2xl font-black text-white">{item.value}</div>
                  <div className="mt-1 text-sm text-slate-300">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-950 p-2.5 text-white shadow-md">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-950">{pillar.title}</h2>
                    <p className="text-xs text-slate-500">預覽版核心流程</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{pillar.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-slate-950">
              <Layers3 className="h-5 w-5 text-sky-600" />
              <h2 className="text-lg font-bold">這個首頁會帶你去哪裡</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                href={latestProject ? `/${latestProject.id}` : "/new-project"}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition-transform hover:-translate-y-0.5"
              >
                <div className="text-sm font-bold text-slate-950">開發財務中樞</div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  把殘值法、預算、實支、EAC、敏感度分析放在一起。
                </p>
              </Link>
              <Link
                href="/new-project"
                className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition-transform hover:-translate-y-0.5"
              >
                <div className="text-sm font-bold text-slate-950">前期殘值試算</div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  用容積、坪效、利息與成本去看案子值不值得做。
                </p>
              </Link>
              <Link
                href={latestProject ? `/${latestProject.id}/compare` : "/"}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition-transform hover:-translate-y-0.5"
              >
                <div className="text-sm font-bold text-slate-950">預算 vs 實支</div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  檢查哪些主項已偏離，先抓最有風險的變更。
                </p>
              </Link>
              <Link
                href={latestProject ? `/${latestProject.id}/schedule` : "/"}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition-transform hover:-translate-y-0.5"
              >
                <div className="text-sm font-bold text-slate-950">工期與回款</div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  把施工節點和資金需求一起看，避免後期現金流吃緊。
                </p>
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-slate-950">
              <Building2 className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-bold">現有專案</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              這裡直接顯示目前資料庫中的專案，讓你從首頁一鍵進入預覽。
            </p>

            <div className="mt-4 space-y-3">
              {projects.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-400">
                  尚未匯入專案資料。可以先執行 seed 或先看前期試算頁。
                </div>
              ) : (
                projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/${project.id}`}
                    className="group flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 transition-transform hover:-translate-y-0.5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-950 text-white">
                          <TrendingUp className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-slate-950">
                            {project.name}
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span>預算 {formatAmount(Number(project.totalBudget || 0))}</span>
                            {project.totalDays && <span>{project.totalDays} 天</span>}
                            {project.startDate && project.endDate && (
                              <span>
                                {formatDate(project.startDate)} - {formatDate(project.endDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1" />
                  </Link>
                ))
              )}
            </div>

            {latestProject && (
              <div className="mt-4 rounded-3xl bg-slate-950 p-4 text-white">
                <div className="flex items-center gap-2 text-amber-200">
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                    Latest Preview
                  </span>
                </div>
                <div className="mt-2 text-sm font-bold">{latestProject.name}</div>
                <div className="mt-1 text-xs text-slate-300">
                  {formatAmount(Number(latestProject.totalBudget || 0))} ·{" "}
                  {latestProject.totalDays ? `${latestProject.totalDays} 天` : "未設定工期"}
                </div>
                <Link
                  href={`/${latestProject.id}`}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 transition-transform hover:-translate-y-0.5"
                >
                  直接打開中樞
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
