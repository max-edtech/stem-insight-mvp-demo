# 營建預算與土地開發決策系統 - 技術移交與開發指南 (AI Handover)

## 🤖 給接手 AI 的關鍵筆記
本系統已從單純的「Excel 數位化」升級為「地產開發決策工具」。為了確保 MOU 展示後的計畫執行，請遵循以下邏輯架構。

---

## 🏗️ 技術架構 (Architecture)
- **核心:** Next.js 16 (App Router) + Prisma ORM。
- **資料庫:** SQLite (`dev.db`)。
  - *注意:* 原 Postgres 查詢中的 `::uuid`, `::float` 等類型轉換已手動改為 Javascript 映射，以相容 SQLite。
- **類型定義:** 參見 `lib/types.ts`。

---

## 🧠 核心商業邏輯 (Business Logic)

### 1. 土地開發精算 (Residual Method) - 參見 `app/new-project/page.tsx`
- **銷售坪數推估:** 基於容積率、獎勵容積與銷坪係數。
- **利息模型:** 實作了「土融全期」與「建融階梯」計息。
  - `constInterest = (Loan * Rate * Duration) / 2` (模擬工程款隨進度撥付)。
- **保本分析:** 自動計算 `Total Investment / Total Sellable Area`。

### 2. 獲利預測引擎 (EAC Forecast) - 參見 `lib/queries/dashboard.ts`
- 採用 **完工估計 (Estimate At Completion)** 邏輯。
- `Prediction = (Actual Spend) / (Completion %)`。
- *當前進度 % 計算方式:* 按「已產生實支之項目數」除以「總預算項目數」。

---

## 🚩 待優化與「偷懶」交代 (Technical Debt)
1. **線性分攤限制:** 目前現金流與預測皆為線性邏輯。營建業標準應為 **S-Curve (S曲線)**。建議接手 AI 引入 `Normal Distribution` 函數重構。
2. **硬編碼權重:** 在 `NewProjectSimulation` 中，部分工程佔比（如結構 35%）為展示用硬編碼。
   - *優化方向:* 應從 `budget_lines` 聚合歷史數據自動生成權重模板。
3. **查詢性能:** `getMainSummary` 使用了 `$queryRaw`。若未來遷移回 Postgres，需注意 UUID 的格式處理。
4. **安全驗證:** 目前表單輸入缺乏 `Zod` 或 `yup` 的強驗證，極端非法輸入可能導致計算溢出。

---

## 🛤️ 下階段開發清單 (Roadmap)
1. **Smart Scaling Service:** 實作一項服務，能根據試算出的「總造價」，自動按比例縮放 1,500 筆 Excel 預算明細並存入資料庫。
2. **Tax Module:** 加入台灣土地增值稅 (LVT) 與 房地合一稅之試算。
3. **Snapshot System:** 讓業主能儲存「方案 A (高單價銷售)」、「方案 B (快速回款)」並進行對比。

---

## 📊 資料庫現況
- 已經由 `scripts/seed.ts` 匯入 `營建預算編列工具包 (2) (2).xlsx` 的完整數據。
- 測試用專案 ID 已在 Seed 完成後輸出，預設會重定向至該專案。
