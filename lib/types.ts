export interface ProjectSummary {
  project_id: string;
  main_category: string;
  total_amount: number;
  budget_pct: number;
  code_count: number;
}

export interface CostAnalysisRow {
  project_id: string;
  main_category: string;
  sub_category: string;
  total_amount: number;
  item_count: number;
}

export interface BudgetVsActualRow {
  project_id: string;
  main_category: string;
  budget_amount: number;
  actual_amount: number;
  variance: number;
  variance_pct: number;
}

export interface BudgetDetailRow {
  id: string;
  budget_code: string;
  item_name: string;
  main_category: string;
  sub_category: string;
  budget_total: number | null;
}

export interface ScheduleRow {
  id: string;
  item_code: string | null;
  milestone_name: string;
  milestone_date: string | null;
  duration_days: number | null;
  start_date: string | null;
  end_date: string | null;
  remark: string | null;
  sort_order: number | null;
}

export const CATEGORY_COLORS: Record<string, string> = {
  結構工程: "#534AB7",
  裝修工程: "#1D9E75",
  基礎工程: "#D85A30",
  門窗工程: "#3266ad",
  間接成本: "#BA7517",
  假設工程: "#D4537E",
  雜項工程: "#639922",
  電氣空調: "#73726c",
  給排水消防: "#E24B4A",
};

export const CATEGORY_ORDER = [
  "結構工程",
  "裝修工程",
  "基礎工程",
  "門窗工程",
  "間接成本",
  "假設工程",
  "雜項工程",
  "電氣空調",
  "給排水消防",
];
