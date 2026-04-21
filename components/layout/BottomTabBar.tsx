"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PieChart,
  ArrowLeftRight,
  List,
  Calendar,
  Workflow,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { icon: LayoutDashboard, label: "總覽", href: "" },
  { icon: PieChart, label: "成本", href: "/cost" },
  { icon: ArrowLeftRight, label: "比較", href: "/compare" },
  { icon: List, label: "預算", href: "/budget" },
  { icon: Workflow, label: "作業", href: "/operations" },
  { icon: Calendar, label: "進度", href: "/schedule" },
  { icon: ClipboardCheck, label: "驗收", href: "/acceptance" },
];

export function BottomTabBar({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/${projectId}`;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch max-w-2xl mx-auto">
        {tabs.map((tab) => {
          const href = `${base}${tab.href}`;
          const isActive =
            tab.href === ""
              ? pathname === base
              : pathname.startsWith(`${base}${tab.href}`);

          return (
            <Link
              key={tab.href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-xs transition-colors",
                isActive ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <tab.icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
              <span className="font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
