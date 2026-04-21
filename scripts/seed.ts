/**
 * Excel 資料匯入腳本
 * 執行方式：npx tsx scripts/seed.ts
 *
 * 匯入順序：
 * 1. projects
 * 2. budget_codes
 * 3. cost_items
 * 4. budget_lines
 * 5. actual_valuations
 * 6. schedule_items
 * 7. cashflow_entries
 */

import "dotenv/config";
import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";
import * as path from "path";

const prisma = new PrismaClient();

const EXCEL_FILE = path.resolve(process.argv[2] ?? "營建預算編列工具包.xlsx");

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function toStr(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  return String(v).trim();
}

function toDate(v: unknown): Date | null {
  if (!v) return null;
  let d: Date;
  if (v instanceof Date) {
    d = v;
  } else if (typeof v === "number") {
    d = new Date(Math.round((v - 25569) * 86400 * 1000));
  } else {
    d = new Date(String(v));
  }
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  if (year < 1900 || year > 2100) return null;
  return d;
}

async function main() {
  console.log(`Reading: ${EXCEL_FILE}`);
  const workbook = XLSX.readFile(EXCEL_FILE, { cellDates: false });

  // ── 1. Project ──────────────────────────────────────────────────────────────
  const totalBudget = 276633524;
  const project = await prisma.project.create({
    data: {
      name: "○○新建工程(SRC) - MOU 驚豔版",
      contractAmount: totalBudget * 1.2, // 20% margin
      targetProfitRate: 0.15, // 15% target
      totalBudget: totalBudget,
      totalDays: 655,
      startDate: new Date("2012-05-09"),
      endDate: new Date("2014-02-22"),
    },
  });
  console.log(`  Project id: ${project.id}`);

  // ── 2. Budget Codes ──────────────────────────────────────────────────────────
  const bcSheet = workbook.Sheets["預算碼"];
  if (!bcSheet) throw new Error('Sheet "預算碼" not found');
  const bcRows = XLSX.utils.sheet_to_json<string[]>(bcSheet, { header: 1 }) as string[][];

  console.log(`Importing budget_codes (${bcRows.length - 1} rows)...`);
  const budgetCodeMap: Record<string, string> = {}; // code → id

  for (let i = 1; i < bcRows.length; i++) {
    const row = bcRows[i];
    const code = toStr(row[0]);
    const name = toStr(row[1]);
    const mainCategory = toStr(row[2]);
    const subCategory = toStr(row[3]);
    if (!code || !name || !mainCategory || !subCategory) continue;

    const bc = await prisma.budgetCode.create({
      data: { projectId: project.id, code, name, mainCategory, subCategory },
    });
    budgetCodeMap[code] = bc.id;
  }
  console.log(`  Imported ${Object.keys(budgetCodeMap).length} budget codes`);

  // ── 3. Cost Items ────────────────────────────────────────────────────────────
  const ciSheet = workbook.Sheets["編碼分類資料庫"];
  if (!ciSheet) throw new Error('Sheet "編碼分類資料庫" not found');
  const ciRows = XLSX.utils.sheet_to_json<unknown[]>(ciSheet, { header: 1 }) as unknown[][];

  console.log(`Importing cost_items (${ciRows.length - 1} rows)...`);
  const costItemMap: Record<string, string> = {}; // compositeCode → id

  for (let i = 1; i < ciRows.length; i++) {
    const row = ciRows[i];
    const itemCode = toStr(row[0]);
    const itemName = toStr(row[1]);
    if (!itemCode || !itemName) continue;

    const unit = toStr(row[2]);
    const costType = toStr(row[9]);
    const tradeCode = toStr(row[10]);
    const tradeName = toStr(row[11]);
    const cashPct = toNum(row[13]);
    const notePct = toNum(row[14]);
    const noteDays = toNum(row[15]) ? Math.round(toNum(row[15])!) : null;
    const depositPct = toNum(row[16]);
    const depositNoteMonths = toNum(row[17]) ? Math.round(toNum(row[17])!) : null;
    const retentionPct = toNum(row[18]);
    const retentionRelease = toStr(row[19]);
    const compositeCode = toStr(row[21]);

    try {
      const ci = await prisma.costItem.create({
        data: {
          projectId: project.id,
          itemCode,
          itemName,
          unit,
          costType,
          tradeCode,
          tradeName,
          cashPct: cashPct !== null ? cashPct : undefined,
          notePct: notePct !== null ? notePct : undefined,
          noteDays,
          depositPct: depositPct !== null ? depositPct : undefined,
          depositNoteMonths,
          retentionPct: retentionPct !== null ? retentionPct : undefined,
          retentionRelease,
          compositeCode,
        },
      });
      if (compositeCode) costItemMap[compositeCode] = ci.id;
      costItemMap[itemCode] = ci.id;
    } catch {
      // duplicate, skip
    }
  }
  console.log(`  Imported cost items`);

  // ── 4. Budget Lines ──────────────────────────────────────────────────────────
  const blSheet = workbook.Sheets["預算編列"];
  if (!blSheet) throw new Error('Sheet "預算編列" not found');
  const blRows = XLSX.utils.sheet_to_json<unknown[]>(blSheet, { header: 1 }) as unknown[][];

  console.log(`Importing budget_lines (${blRows.length - 1} rows)...`);
  let blCount = 0;
  for (let i = 1; i < blRows.length; i++) {
    const row = blRows[i];
    const budgetCodeStr = toStr(row[2]);
    const itemName = toStr(row[5]) ?? toStr(row[3]);
    if (!budgetCodeStr || !itemName) continue;

    const budgetCodeId = budgetCodeMap[budgetCodeStr];
    if (!budgetCodeId) continue;

    const itemCode = toStr(row[4]);
    const costItemId = itemCode ? costItemMap[itemCode] : null;
    const unit = toStr(row[7]);
    const unitUsage = toNum(row[6]);
    const quantity = toNum(row[8]);
    const unitPrice = toNum(row[9]);
    const lineTotal = toNum(row[10]);
    const budgetTotal = toNum(row[11]);
    const isSummary = !itemCode && budgetTotal !== null;

    await prisma.budgetLine.create({
      data: {
        projectId: project.id,
        budgetCodeId,
        costItemId: costItemId ?? undefined,
        budgetCode: budgetCodeStr,
        itemCode,
        itemName,
        unit,
        unitUsage: unitUsage !== null ? unitUsage : undefined,
        quantity: quantity !== null ? quantity : undefined,
        unitPrice: unitPrice !== null ? unitPrice : undefined,
        lineTotal: lineTotal !== null ? lineTotal : undefined,
        budgetTotal: budgetTotal !== null ? budgetTotal : undefined,
        isSummary,
        sortOrder: i,
      },
    });
    blCount++;
  }
  console.log(`  Imported ${blCount} budget lines`);

  // ── 5. Actual Valuations ─────────────────────────────────────────────────────
  const avSheet = workbook.Sheets["A案計價"];
  if (avSheet) {
    const avRows = XLSX.utils.sheet_to_json<unknown[]>(avSheet, { header: 1 }) as unknown[][];
    console.log(`Importing actual_valuations (${avRows.length - 1} rows)...`);
    let avCount = 0;
    for (let i = 1; i < avRows.length; i++) {
      const row = avRows[i];
      const budgetCodeStr = toStr(row[2]);
      const itemName = toStr(row[5]) ?? toStr(row[3]);
      if (!budgetCodeStr || !itemName) continue;
      const budgetCodeId = budgetCodeMap[budgetCodeStr];
      if (!budgetCodeId) continue;

      const itemCode = toStr(row[4]);
      const costItemId = itemCode ? costItemMap[itemCode] : null;

      await prisma.actualValuation.create({
        data: {
          projectId: project.id,
          budgetCodeId,
          costItemId: costItemId ?? undefined,
          budgetCode: budgetCodeStr,
          itemCode,
          itemName,
          unit: toStr(row[7]),
          quantity: toNum(row[8]) !== null ? toNum(row[8])! : undefined,
          unitPrice: toNum(row[9]) !== null ? toNum(row[9])! : undefined,
          amount: toNum(row[10]) !== null ? toNum(row[10])! : undefined,
          budgetRatio: toNum(row[11]) !== null ? toNum(row[11])! : undefined,
          sortOrder: i,
        },
      });
      avCount++;
    }
    console.log(`  Imported ${avCount} actual valuations`);
  }

  // ── 6. Schedule Items ────────────────────────────────────────────────────────
  const schSheet = workbook.Sheets["進度表"];
  if (schSheet) {
    const schRows = XLSX.utils.sheet_to_json<unknown[]>(schSheet, { header: 1 }) as unknown[][];
    console.log(`Importing schedule_items (${schRows.length - 1} rows)...`);
    let schCount = 0;
    for (let i = 1; i < schRows.length; i++) {
      const row = schRows[i];
      const milestoneName = toStr(row[1]);
      if (!milestoneName) continue;

      await prisma.scheduleItem.create({
        data: {
          projectId: project.id,
          itemCode: toStr(row[0]),
          milestoneName,
          milestoneDate: toDate(row[2]),
          durationDays: toNum(row[3]) ? Math.round(toNum(row[3])!) : null,
          startDate: toDate(row[4]),
          endDate: toDate(row[5]),
          remark: toStr(row[6]),
          sortOrder: i,
        },
      });
      schCount++;
    }
    console.log(`  Imported ${schCount} schedule items`);
  }

  // ── 7. Cashflow Entries ──────────────────────────────────────────────────────
  const cfSheet = workbook.Sheets["現金流量"];
  if (cfSheet) {
    const cfRows = XLSX.utils.sheet_to_json<unknown[]>(cfSheet, { header: 1 }) as unknown[][];
    console.log(`Importing cashflow_entries (${cfRows.length - 1} rows)...`);
    let cfCount = 0;
    for (let i = 1; i < cfRows.length; i++) {
      const row = cfRows[i];
      if (!toStr(row[2]) && !toStr(row[1])) continue;

      await prisma.cashflowEntry.create({
        data: {
          projectId: project.id,
          itemCode: toStr(row[0]),
          itemName: toStr(row[1]),
          mainCategory: toStr(row[2]),
          subCategory: toStr(row[3]),
          amount: toNum(row[4]) !== null ? toNum(row[4])! : undefined,
          durationDays: toNum(row[5]) ? Math.round(toNum(row[5])!) : null,
          startDate: toDate(row[6]),
          endDate: toDate(row[7]),
          cashAmount: toNum(row[8]) !== null ? toNum(row[8])! : undefined,
          noteStartDate: toDate(row[9]),
          noteEndDate: toDate(row[10]),
          noteAmount: toNum(row[11]) !== null ? toNum(row[11])! : undefined,
          depositDate: toDate(row[12]),
          depositAmount: toNum(row[13]) !== null ? toNum(row[13])! : undefined,
          retentionDate: toDate(row[14]),
          retentionAmount: toNum(row[15]) !== null ? toNum(row[15])! : undefined,
          sortOrder: i,
        },
      });
      cfCount++;
    }
    console.log(`  Imported ${cfCount} cashflow entries`);
  }

  console.log("\nSeed completed successfully!");
  console.log(`Project ID: ${project.id}`);
  console.log(`Use this ID as your projectId in the URL.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
