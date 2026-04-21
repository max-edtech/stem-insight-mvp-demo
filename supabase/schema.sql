-- ============================================================
-- 營建預算管理系統 — Supabase PostgreSQL DDL
-- 在 Supabase SQL Editor 中執行此腳本
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  total_budget  NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_days    INT,
  start_date    DATE,
  end_date      DATE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budget_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code          TEXT NOT NULL,
  name          TEXT NOT NULL,
  main_category TEXT NOT NULL,
  sub_category  TEXT NOT NULL,
  UNIQUE(project_id, code)
);
CREATE INDEX IF NOT EXISTS idx_budget_codes_project ON budget_codes(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_codes_main ON budget_codes(main_category);

CREATE TABLE IF NOT EXISTS cost_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_code             TEXT NOT NULL,
  item_name             TEXT NOT NULL,
  unit                  TEXT,
  cost_type             CHAR(1),
  trade_code            TEXT,
  trade_name            TEXT,
  cash_pct              NUMERIC(5,2) DEFAULT 0,
  note_pct              NUMERIC(5,2) DEFAULT 0,
  note_days             INT DEFAULT 0,
  deposit_pct           NUMERIC(5,2) DEFAULT 0,
  deposit_note_months   INT DEFAULT 0,
  retention_pct         NUMERIC(5,2) DEFAULT 0,
  retention_release     TEXT,
  composite_code        TEXT,
  UNIQUE(project_id, item_code, composite_code)
);
CREATE INDEX IF NOT EXISTS idx_cost_items_project ON cost_items(project_id);
CREATE INDEX IF NOT EXISTS idx_cost_items_code ON cost_items(item_code);
CREATE INDEX IF NOT EXISTS idx_cost_items_cost_type ON cost_items(cost_type);

CREATE TABLE IF NOT EXISTS budget_lines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  budget_code_id  UUID NOT NULL REFERENCES budget_codes(id),
  cost_item_id    UUID REFERENCES cost_items(id),
  budget_code     TEXT NOT NULL,
  item_code       TEXT,
  item_name       TEXT NOT NULL,
  unit            TEXT,
  unit_usage      NUMERIC(12,4),
  quantity        NUMERIC(12,4),
  unit_price      NUMERIC(15,2),
  line_total      NUMERIC(15,2),
  budget_total    NUMERIC(15,2),
  remark          TEXT,
  is_summary      BOOLEAN DEFAULT FALSE,
  sort_order      INT
);
CREATE INDEX IF NOT EXISTS idx_budget_lines_project ON budget_lines(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_budget_code ON budget_lines(budget_code_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_cost_item ON budget_lines(cost_item_id);

CREATE TABLE IF NOT EXISTS actual_valuations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  budget_code_id  UUID NOT NULL REFERENCES budget_codes(id),
  cost_item_id    UUID REFERENCES cost_items(id),
  budget_code     TEXT NOT NULL,
  item_code       TEXT,
  item_name       TEXT NOT NULL,
  unit            TEXT,
  quantity        NUMERIC(12,4),
  unit_price      NUMERIC(15,2),
  amount          NUMERIC(15,2),
  budget_ratio    NUMERIC(8,4),
  remark          TEXT,
  sort_order      INT
);
CREATE INDEX IF NOT EXISTS idx_actual_project ON actual_valuations(project_id);
CREATE INDEX IF NOT EXISTS idx_actual_budget_code ON actual_valuations(budget_code_id);

CREATE TABLE IF NOT EXISTS schedule_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_code       TEXT,
  milestone_name  TEXT NOT NULL,
  milestone_date  DATE,
  duration_days   INT,
  start_date      DATE,
  end_date        DATE,
  remark          TEXT,
  sort_order      INT
);
CREATE INDEX IF NOT EXISTS idx_schedule_project ON schedule_items(project_id);

CREATE TABLE IF NOT EXISTS cashflow_entries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  schedule_item_id  UUID REFERENCES schedule_items(id),
  item_code         TEXT,
  item_name         TEXT,
  main_category     TEXT,
  sub_category      TEXT,
  amount            NUMERIC(15,2),
  duration_days     INT,
  start_date        DATE,
  end_date          DATE,
  cash_amount       NUMERIC(15,2),
  note_start_date   DATE,
  note_end_date     DATE,
  note_amount       NUMERIC(15,2),
  deposit_date      DATE,
  deposit_amount    NUMERIC(15,2),
  retention_date    DATE,
  retention_amount  NUMERIC(15,2),
  sort_order        INT
);
CREATE INDEX IF NOT EXISTS idx_cashflow_project ON cashflow_entries(project_id);

-- ============================================================
-- Views
-- ============================================================

CREATE OR REPLACE VIEW v_cost_analysis AS
SELECT
  bl.project_id,
  bc.main_category,
  bc.sub_category,
  SUM(bl.budget_total) AS total_amount,
  COUNT(DISTINCT bl.budget_code) AS item_count
FROM budget_lines bl
JOIN budget_codes bc ON bl.budget_code_id = bc.id
WHERE bl.is_summary = TRUE
GROUP BY bl.project_id, bc.main_category, bc.sub_category
ORDER BY total_amount DESC;

CREATE OR REPLACE VIEW v_budget_vs_actual AS
SELECT
  p.id AS project_id,
  bc.main_category,
  COALESCE(budget.total, 0) AS budget_amount,
  COALESCE(actual.total, 0) AS actual_amount,
  COALESCE(actual.total, 0) - COALESCE(budget.total, 0) AS variance,
  CASE WHEN COALESCE(budget.total, 0) > 0
    THEN ROUND(COALESCE(actual.total, 0) / budget.total * 100, 2)
    ELSE 0
  END AS variance_pct
FROM projects p
CROSS JOIN (SELECT DISTINCT main_category FROM budget_codes) bc
LEFT JOIN (
  SELECT bl.project_id, bcd.main_category, SUM(bl.budget_total) AS total
  FROM budget_lines bl
  JOIN budget_codes bcd ON bl.budget_code_id = bcd.id
  WHERE bl.is_summary = TRUE
  GROUP BY bl.project_id, bcd.main_category
) budget ON budget.project_id = p.id AND budget.main_category = bc.main_category
LEFT JOIN (
  SELECT av.project_id, bcd.main_category, SUM(av.amount) AS total
  FROM actual_valuations av
  JOIN budget_codes bcd ON av.budget_code_id = bcd.id
  GROUP BY av.project_id, bcd.main_category
) actual ON actual.project_id = p.id AND actual.main_category = bc.main_category;

CREATE OR REPLACE VIEW v_main_summary AS
SELECT
  bl.project_id,
  bc.main_category,
  SUM(bl.budget_total) AS total_amount,
  ROUND(SUM(bl.budget_total) / NULLIF(p.total_budget, 0) * 100, 2) AS budget_pct,
  COUNT(DISTINCT bl.budget_code) AS code_count
FROM budget_lines bl
JOIN budget_codes bc ON bl.budget_code_id = bc.id
JOIN projects p ON bl.project_id = p.id
WHERE bl.is_summary = TRUE
GROUP BY bl.project_id, bc.main_category, p.total_budget
ORDER BY total_amount DESC;

-- ============================================================
-- Data Quality Checks (run after seed)
-- ============================================================

-- SELECT 'budget_lines 孤立記錄' AS check_name, COUNT(*) AS count
-- FROM budget_lines bl
-- LEFT JOIN budget_codes bc ON bl.budget_code_id = bc.id
-- WHERE bc.id IS NULL;

-- SELECT
--   SUM(budget_total) AS calculated_total,
--   (SELECT total_budget FROM projects LIMIT 1) AS expected_total
-- FROM budget_lines WHERE is_summary = TRUE;
