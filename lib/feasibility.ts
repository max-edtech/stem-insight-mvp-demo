export interface LandInputs {
  area: number;
  price: number;
  far: number;
  bonus: number;
  sellableRatio: number;
  landTaxFeeRate: number;
}

export interface CostInputs {
  unitBuildCost: number;
  softCostRate: number;
  marketingRate: number;
  adminRate: number;
}

export interface FinanceInputs {
  landLoanRate: number;
  constLoanRate: number;
  interestRate: number;
  duration: number;
}

export interface SalesInputs {
  expectedPrice: number;
}

export interface FeasibilityInputs {
  land: LandInputs;
  cost: CostInputs;
  finance: FinanceInputs;
  sales: SalesInputs;
}

export interface FeasibilityResult {
  totalFloorArea: number;
  landPurchaseCost: number;
  landTaxAndFee: number;
  totalLandCost: number;
  totalBuildCost: number;
  totalSoftCost: number;
  landLoanAmount: number;
  landInterest: number;
  constLoanAmount: number;
  constInterest: number;
  totalInterest: number;
  totalSales: number;
  marketingFee: number;
  adminFee: number;
  totalInvestment: number;
  netProfit: number;
  profitRate: number;
  breakEvenPrice: number;
  equityNeeded: number;
  roe: number;
  profitPerPing: number;
}

export interface CaseTemplate {
  id: string;
  name: string;
  description: string;
  badge: string;
  inputs: FeasibilityInputs;
}

export function calculateFeasibility(inputs: FeasibilityInputs): FeasibilityResult {
  const totalFloorArea =
    inputs.land.area *
    (inputs.land.far / 100) *
    (1 + inputs.land.bonus / 100) *
    inputs.land.sellableRatio;

  const landPurchaseCost = inputs.land.area * inputs.land.price;
  const landTaxAndFee = landPurchaseCost * inputs.land.landTaxFeeRate;
  const totalLandCost = landPurchaseCost + landTaxAndFee;

  const totalBuildCost = totalFloorArea * inputs.cost.unitBuildCost;
  const totalSoftCost = totalBuildCost * (inputs.cost.softCostRate / 100);

  const landLoanAmount = totalLandCost * (inputs.finance.landLoanRate / 100);
  const landInterest =
    landLoanAmount * (inputs.finance.interestRate / 100) * inputs.finance.duration;

  const constLoanAmount = totalBuildCost * (inputs.finance.constLoanRate / 100);
  const constInterest =
    constLoanAmount *
    (inputs.finance.interestRate / 100) *
    (inputs.finance.duration / 2);

  const totalInterest = landInterest + constInterest;

  const totalSales = totalFloorArea * inputs.sales.expectedPrice;
  const marketingFee = totalSales * (inputs.cost.marketingRate / 100);
  const adminFee = (totalLandCost + totalBuildCost) * (inputs.cost.adminRate / 100);

  const totalInvestment =
    totalLandCost + totalBuildCost + totalSoftCost + totalInterest + marketingFee + adminFee;
  const netProfit = totalSales - totalInvestment;
  const profitRate = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
  const breakEvenPrice = totalFloorArea > 0 ? totalInvestment / totalFloorArea : 0;
  const equityNeeded = totalInvestment - landLoanAmount - constLoanAmount;
  const roe = equityNeeded > 0 ? (netProfit / equityNeeded) * 100 : 0;
  const profitPerPing = totalFloorArea > 0 ? netProfit / totalFloorArea : 0;

  return {
    totalFloorArea,
    landPurchaseCost,
    landTaxAndFee,
    totalLandCost,
    totalBuildCost,
    totalSoftCost,
    landLoanAmount,
    landInterest,
    constLoanAmount,
    constInterest,
    totalInterest,
    totalSales,
    marketingFee,
    adminFee,
    totalInvestment,
    netProfit,
    profitRate,
    breakEvenPrice,
    equityNeeded,
    roe,
    profitPerPing,
  };
}

export const CASE_TEMPLATES: CaseTemplate[] = [
  {
    id: "residential-standard",
    name: "標準住宅案",
    description: "適合一般住宅新建案，容積與銷坪係數都以保守中位值設計。",
    badge: "常用",
    inputs: {
      land: {
        area: 500,
        price: 1500000,
        far: 300,
        bonus: 20,
        sellableRatio: 1.8,
        landTaxFeeRate: 0.04,
      },
      cost: {
        unitBuildCost: 200000,
        softCostRate: 10,
        marketingRate: 5,
        adminRate: 4,
      },
      finance: {
        landLoanRate: 50,
        constLoanRate: 60,
        interestRate: 3.2,
        duration: 3,
      },
      sales: {
        expectedPrice: 750000,
      },
    },
  },
  {
    id: "urban-mixed-use",
    name: "都會複合案",
    description: "適合商住混合或地段較好的案件，售價與開發成本都相對拉高。",
    badge: "進階",
    inputs: {
      land: {
        area: 320,
        price: 2200000,
        far: 420,
        bonus: 15,
        sellableRatio: 1.65,
        landTaxFeeRate: 0.04,
      },
      cost: {
        unitBuildCost: 235000,
        softCostRate: 12,
        marketingRate: 6,
        adminRate: 4.5,
      },
      finance: {
        landLoanRate: 55,
        constLoanRate: 60,
        interestRate: 3.5,
        duration: 3.2,
      },
      sales: {
        expectedPrice: 860000,
      },
    },
  },
  {
    id: "conservative-office",
    name: "保守商辦案",
    description: "適合辦公或保守型案件，控制容積、售價與利息衝擊。",
    badge: "風險低",
    inputs: {
      land: {
        area: 800,
        price: 1000000,
        far: 250,
        bonus: 10,
        sellableRatio: 1.5,
        landTaxFeeRate: 0.04,
      },
      cost: {
        unitBuildCost: 180000,
        softCostRate: 11,
        marketingRate: 4,
        adminRate: 4,
      },
      finance: {
        landLoanRate: 45,
        constLoanRate: 55,
        interestRate: 3.0,
        duration: 2.8,
      },
      sales: {
        expectedPrice: 680000,
      },
    },
  },
];

export function getTemplate(id: string): CaseTemplate {
  return CASE_TEMPLATES.find((template) => template.id === id) ?? CASE_TEMPLATES[0];
}
