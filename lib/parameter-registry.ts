import type { FeasibilityInputs } from "@/lib/feasibility";

export type ParameterConfidence = "high" | "medium" | "low";
export type ParameterSourceType = "manual" | "template" | "official_index" | "market_feed";

export interface ParameterRecord {
  key: string;
  label: string;
  category: "land" | "cost" | "finance" | "sales";
  unit: string;
  value: number;
  sourceType: ParameterSourceType;
  sourceName: string;
  sourceUrl?: string;
  effectiveDate?: string;
  confidence: ParameterConfidence;
}

export interface ParameterSnapshot {
  schemaVersion: string;
  generatedAt: string;
  templateId: string;
  records: ParameterRecord[];
}

const DGBAS_CCI_URL = "https://www.stat.gov.tw/CCI/CCI_Site/index.aspx";

export function buildParameterSnapshot(
  inputs: FeasibilityInputs,
  templateId: string
): ParameterSnapshot {
  const generatedAt = new Date().toISOString();

  const templateSource = {
    sourceType: "template" as const,
    sourceName: "Template baseline",
    confidence: "medium" as const,
  };

  const manualSource = {
    sourceType: "manual" as const,
    sourceName: "User input",
    confidence: "medium" as const,
  };

  const cciSource = {
    sourceType: "official_index" as const,
    sourceName: "DGBAS CCI",
    sourceUrl: DGBAS_CCI_URL,
    effectiveDate: generatedAt.slice(0, 10),
    confidence: "high" as const,
  };

  return {
    schemaVersion: "1.0.0",
    generatedAt,
    templateId,
    records: [
      {
        key: "land.area",
        label: "Land area",
        category: "land",
        unit: "ping",
        value: inputs.land.area,
        ...manualSource,
      },
      {
        key: "land.price",
        label: "Land unit price",
        category: "land",
        unit: "TWD/ping",
        value: inputs.land.price,
        ...manualSource,
      },
      {
        key: "land.far",
        label: "FAR",
        category: "land",
        unit: "%",
        value: inputs.land.far,
        ...manualSource,
      },
      {
        key: "land.bonus",
        label: "Bonus FAR",
        category: "land",
        unit: "%",
        value: inputs.land.bonus,
        ...manualSource,
      },
      {
        key: "land.sellableRatio",
        label: "Sellable ratio",
        category: "land",
        unit: "x",
        value: inputs.land.sellableRatio,
        ...manualSource,
      },
      {
        key: "land.landTaxFeeRate",
        label: "Land tax and fees",
        category: "land",
        unit: "%",
        value: inputs.land.landTaxFeeRate * 100,
        ...manualSource,
      },
      {
        key: "cost.unitBuildCost",
        label: "Unit build cost",
        category: "cost",
        unit: "TWD/ping",
        value: inputs.cost.unitBuildCost,
        ...templateSource,
      },
      {
        key: "cost.softCostRate",
        label: "Soft cost rate",
        category: "cost",
        unit: "%",
        value: inputs.cost.softCostRate,
        ...templateSource,
      },
      {
        key: "cost.marketingRate",
        label: "Marketing rate",
        category: "cost",
        unit: "%",
        value: inputs.cost.marketingRate,
        ...templateSource,
      },
      {
        key: "cost.adminRate",
        label: "Admin rate",
        category: "cost",
        unit: "%",
        value: inputs.cost.adminRate,
        ...templateSource,
      },
      {
        key: "finance.landLoanRate",
        label: "Land loan ratio",
        category: "finance",
        unit: "%",
        value: inputs.finance.landLoanRate,
        ...manualSource,
      },
      {
        key: "finance.constLoanRate",
        label: "Construction loan ratio",
        category: "finance",
        unit: "%",
        value: inputs.finance.constLoanRate,
        ...manualSource,
      },
      {
        key: "finance.interestRate",
        label: "Interest rate",
        category: "finance",
        unit: "%",
        value: inputs.finance.interestRate,
        ...cciSource,
      },
      {
        key: "finance.duration",
        label: "Project duration",
        category: "finance",
        unit: "year",
        value: inputs.finance.duration,
        ...manualSource,
      },
      {
        key: "sales.expectedPrice",
        label: "Expected sale price",
        category: "sales",
        unit: "TWD/ping",
        value: inputs.sales.expectedPrice,
        ...manualSource,
      },
    ],
  };
}

