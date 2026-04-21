import { calculateFeasibility, type FeasibilityInputs } from "@/lib/feasibility";

export interface PertRange {
  optimistic: number;
  likely: number;
  pessimistic: number;
}

export interface RiskAssumptions {
  salePriceFactor: PertRange;
  buildCostFactor: PertRange;
  softCostRateDelta: PertRange;
  marketingRateDelta: PertRange;
  adminRateDelta: PertRange;
  interestRateDelta: PertRange;
  durationFactor: PertRange;
}

export interface RiskSimulationOptions {
  iterations?: number;
  assumptions?: Partial<RiskAssumptions>;
  targetProfitRate: number;
}

export interface RiskSimulationResult {
  iterations: number;
  targetProfitRate: number;
  probabilityMeetTarget: number;
  expectedProfitRate: number;
  expectedProfitAmount: number;
  p10ProfitRate: number;
  p50ProfitRate: number;
  p90ProfitRate: number;
  p10Profit: number;
  p50Profit: number;
  p90Profit: number;
  assumptions: RiskAssumptions;
  generatedAt: string;
}

const DEFAULT_ASSUMPTIONS: RiskAssumptions = {
  //  optimistic: market improves, likely: baseline, pessimistic: market worsens
  salePriceFactor: { optimistic: 1.03, likely: 1, pessimistic: 0.96 },
  buildCostFactor: { optimistic: 0.97, likely: 1, pessimistic: 1.08 },
  softCostRateDelta: { optimistic: -1, likely: 0, pessimistic: 2 },
  marketingRateDelta: { optimistic: -0.5, likely: 0, pessimistic: 1 },
  adminRateDelta: { optimistic: -0.3, likely: 0, pessimistic: 0.8 },
  interestRateDelta: { optimistic: -0.25, likely: 0, pessimistic: 0.25 },
  durationFactor: { optimistic: 0.92, likely: 1, pessimistic: 1.12 },
};

function clamp(value: number, min: number, max: number) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function samplePert(range: PertRange) {
  // Triangular sampling is stable and practical for 3-point estimation.
  const min = Math.min(range.optimistic, range.pessimistic);
  const max = Math.max(range.optimistic, range.pessimistic);
  const mode = clamp(range.likely, min, max);

  if (max === min) return min;

  const u = Math.random();
  const c = (mode - min) / (max - min);

  if (u < c) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  }
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

function percentile(values: number[], p: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = clamp(p, 0, 1) * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  if (low === high) return sorted[low];
  const weight = rank - low;
  return sorted[low] * (1 - weight) + sorted[high] * weight;
}

function mergeAssumptions(
  assumptions?: Partial<RiskAssumptions>
): RiskAssumptions {
  return {
    salePriceFactor: { ...DEFAULT_ASSUMPTIONS.salePriceFactor, ...assumptions?.salePriceFactor },
    buildCostFactor: { ...DEFAULT_ASSUMPTIONS.buildCostFactor, ...assumptions?.buildCostFactor },
    softCostRateDelta: { ...DEFAULT_ASSUMPTIONS.softCostRateDelta, ...assumptions?.softCostRateDelta },
    marketingRateDelta: { ...DEFAULT_ASSUMPTIONS.marketingRateDelta, ...assumptions?.marketingRateDelta },
    adminRateDelta: { ...DEFAULT_ASSUMPTIONS.adminRateDelta, ...assumptions?.adminRateDelta },
    interestRateDelta: { ...DEFAULT_ASSUMPTIONS.interestRateDelta, ...assumptions?.interestRateDelta },
    durationFactor: { ...DEFAULT_ASSUMPTIONS.durationFactor, ...assumptions?.durationFactor },
  };
}

export function runMonteCarloRiskSimulation(
  baseInputs: FeasibilityInputs,
  options: RiskSimulationOptions
): RiskSimulationResult {
  const iterations = Math.max(100, Math.round(options.iterations ?? 1000));
  const targetProfitRate = clamp(options.targetProfitRate, 0, 1);
  const assumptions = mergeAssumptions(options.assumptions);

  const profitRates: number[] = [];
  const profits: number[] = [];

  for (let i = 0; i < iterations; i += 1) {
    const sampledInputs: FeasibilityInputs = {
      land: { ...baseInputs.land },
      cost: {
        ...baseInputs.cost,
        unitBuildCost:
          baseInputs.cost.unitBuildCost * samplePert(assumptions.buildCostFactor),
        softCostRate: Math.max(
          0,
          baseInputs.cost.softCostRate + samplePert(assumptions.softCostRateDelta)
        ),
        marketingRate: Math.max(
          0,
          baseInputs.cost.marketingRate + samplePert(assumptions.marketingRateDelta)
        ),
        adminRate: Math.max(
          0,
          baseInputs.cost.adminRate + samplePert(assumptions.adminRateDelta)
        ),
      },
      finance: {
        ...baseInputs.finance,
        interestRate: Math.max(
          0,
          baseInputs.finance.interestRate + samplePert(assumptions.interestRateDelta)
        ),
        duration: Math.max(
          0.5,
          baseInputs.finance.duration * samplePert(assumptions.durationFactor)
        ),
      },
      sales: {
        ...baseInputs.sales,
        expectedPrice:
          baseInputs.sales.expectedPrice * samplePert(assumptions.salePriceFactor),
      },
    };

    const result = calculateFeasibility(sampledInputs);
    profitRates.push(result.profitRate / 100);
    profits.push(result.netProfit);
  }

  const meetTargetCount = profitRates.filter((rate) => rate >= targetProfitRate).length;
  const probabilityMeetTarget = meetTargetCount / iterations;
  const expectedProfitRate =
    profitRates.reduce((sum, value) => sum + value, 0) / iterations;
  const expectedProfitAmount = profits.reduce((sum, value) => sum + value, 0) / iterations;

  return {
    iterations,
    targetProfitRate,
    probabilityMeetTarget,
    expectedProfitRate,
    expectedProfitAmount,
    p10ProfitRate: percentile(profitRates, 0.1),
    p50ProfitRate: percentile(profitRates, 0.5),
    p90ProfitRate: percentile(profitRates, 0.9),
    p10Profit: percentile(profits, 0.1),
    p50Profit: percentile(profits, 0.5),
    p90Profit: percentile(profits, 0.9),
    assumptions,
    generatedAt: new Date().toISOString(),
  };
}
