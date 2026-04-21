"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  if (value === null) return fallback;
  const parsed = Number(String(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseDate(value: FormDataEntryValue | null) {
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function normalizeCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

function refreshProject(projectId: string) {
  revalidatePath("/");
  revalidatePath(`/${projectId}`);
  revalidatePath(`/${projectId}/budget`);
  revalidatePath(`/${projectId}/compare`);
  revalidatePath(`/${projectId}/schedule`);
  revalidatePath(`/${projectId}/operations`);
}

function changeOrderCode(id: string) {
  return `CO-${normalizeCode(id).slice(0, 10)}`;
}

async function ensureChangeOrderBudget(
  tx: Prisma.TransactionClient,
  projectId: string,
  orderId: string,
  orderNo: string,
  title: string,
  deltaAmount: number
) {
  const code = changeOrderCode(orderId);
  const budgetCode = await tx.budgetCode.findUnique({
    where: { projectId_code: { projectId, code } },
  });

  if (budgetCode) {
    await tx.budgetCode.update({
      where: { id: budgetCode.id },
      data: {
        name: `變更單 ${orderNo}`,
        mainCategory: "變更",
        subCategory: "已核准",
      },
    });

    await tx.costItem.updateMany({
      where: { projectId, itemCode: code, compositeCode: code },
      data: {
        itemName: title,
        tradeName: "變更單",
      },
    });

    await tx.budgetLine.updateMany({
      where: { projectId, budgetCodeId: budgetCode.id },
      data: {
        itemName: title,
        unitPrice: deltaAmount,
        lineTotal: deltaAmount,
        budgetTotal: deltaAmount,
      },
    });

    return;
  }

  const createdBudgetCode = await tx.budgetCode.create({
    data: {
      projectId,
      code,
      name: `變更單 ${orderNo}`,
      mainCategory: "變更",
      subCategory: "已核准",
    },
  });

  const costItem = await tx.costItem.create({
    data: {
      projectId,
      itemCode: code,
      itemName: title,
      unit: "式",
      costType: "變更",
      tradeCode: code,
      tradeName: "變更單",
      compositeCode: code,
    },
  });

  await tx.budgetLine.createMany({
    data: [
      {
        projectId,
        budgetCodeId: createdBudgetCode.id,
        costItemId: costItem.id,
        budgetCode: code,
        itemCode: code,
        itemName: `變更單 ${orderNo}`,
        unit: "式",
        quantity: 1,
        unitPrice: deltaAmount,
        lineTotal: deltaAmount,
        budgetTotal: deltaAmount,
        isSummary: true,
      },
      {
        projectId,
        budgetCodeId: createdBudgetCode.id,
        costItemId: costItem.id,
        budgetCode: code,
        itemCode: `${code}-D`,
        itemName: title,
        unit: "式",
        quantity: 1,
        unitPrice: deltaAmount,
        lineTotal: deltaAmount,
        budgetTotal: deltaAmount,
        isSummary: false,
      },
    ],
  });
}

async function removeChangeOrderBudget(tx: Prisma.TransactionClient, projectId: string, orderId: string) {
  const code = changeOrderCode(orderId);
  const budgetCode = await tx.budgetCode.findUnique({
    where: { projectId_code: { projectId, code } },
  });

  if (!budgetCode) return;

  await tx.budgetLine.deleteMany({ where: { projectId, budgetCodeId: budgetCode.id } });
  await tx.costItem.deleteMany({ where: { projectId, itemCode: code, compositeCode: code } });
  await tx.budgetCode.delete({ where: { id: budgetCode.id } });
}

async function removeCashflowEntry(tx: Prisma.TransactionClient, id: string, projectId: string) {
  await tx.cashflowEntry.deleteMany({ where: { id, projectId } });
}

function redirectBack(projectId: string) {
  refreshProject(projectId);
  redirect(`/${projectId}/operations`);
}

export async function createChangeOrderAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const orderNo = String(formData.get("orderNo") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const status = String(formData.get("status") ?? "pending");
  const deltaAmount = parseNumber(formData.get("deltaAmount"));

  if (!projectId || !orderNo || !title || !Number.isFinite(deltaAmount)) {
    throw new Error("Missing change order fields");
  }

  await prisma.$transaction(async (tx) => {
    const changeOrder = await tx.changeOrder.create({
      data: {
        projectId,
        orderNo,
        title,
        deltaAmount,
        status,
        approvedAt: status === "approved" ? new Date() : null,
        note: note || null,
      },
    });

    if (status === "approved") {
      await ensureChangeOrderBudget(tx, projectId, changeOrder.id, orderNo, title, deltaAmount);
      await tx.project.update({
        where: { id: projectId },
        data: {
          totalBudget: {
            increment: deltaAmount,
          },
        },
      });
    }
  });

  redirectBack(projectId);
}

export async function updateChangeOrderAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const id = String(formData.get("id") ?? "");
  const orderNo = String(formData.get("orderNo") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const status = String(formData.get("status") ?? "pending");
  const deltaAmount = parseNumber(formData.get("deltaAmount"));

  if (!projectId || !id || !orderNo || !title || !Number.isFinite(deltaAmount)) {
    throw new Error("Missing change order fields");
  }

  await prisma.$transaction(async (tx) => {
    const previous = await tx.changeOrder.findUnique({ where: { id } });
    if (!previous || previous.projectId !== projectId) {
      throw new Error("Change order not found");
    }

    const wasApproved = previous.status === "approved";
    const isApproved = status === "approved";

    if (wasApproved && isApproved) {
      const diff = deltaAmount - Number(previous.deltaAmount || 0);
      if (diff !== 0) {
        await tx.project.update({
          where: { id: projectId },
          data: { totalBudget: { increment: diff } },
        });
      }
      await ensureChangeOrderBudget(tx, projectId, id, orderNo, title, deltaAmount);
    } else if (wasApproved && !isApproved) {
      await tx.project.update({
        where: { id: projectId },
        data: { totalBudget: { decrement: Number(previous.deltaAmount || 0) } },
      });
      await removeChangeOrderBudget(tx, projectId, id);
    } else if (!wasApproved && isApproved) {
      await tx.project.update({
        where: { id: projectId },
        data: { totalBudget: { increment: deltaAmount } },
      });
      await ensureChangeOrderBudget(tx, projectId, id, orderNo, title, deltaAmount);
    }

    await tx.changeOrder.update({
      where: { id },
      data: {
        orderNo,
        title,
        deltaAmount,
        status,
        approvedAt: isApproved ? previous.approvedAt ?? new Date() : null,
        note: note || null,
      },
    });
  });

  redirectBack(projectId);
}

export async function deleteChangeOrderAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const id = String(formData.get("id") ?? "");

  if (!projectId || !id) {
    throw new Error("Missing change order id");
  }

  await prisma.$transaction(async (tx) => {
    const previous = await tx.changeOrder.findUnique({ where: { id } });
    if (!previous || previous.projectId !== projectId) {
      throw new Error("Change order not found");
    }

    if (previous.status === "approved") {
      await tx.project.update({
        where: { id: projectId },
        data: { totalBudget: { decrement: Number(previous.deltaAmount || 0) } },
      });
    }

    await removeChangeOrderBudget(tx, projectId, id);
    await tx.changeOrder.delete({ where: { id } });
  });

  redirectBack(projectId);
}

async function updateCashflowEntry(
  formData: FormData,
  defaults: {
    mainCategory: string;
    subCategory: string;
    cashAmountMode: "zero" | "mirror" | "custom";
  }
) {
  const projectId = String(formData.get("projectId") ?? "");
  const id = String(formData.get("id") ?? "");
  const itemCode = String(formData.get("itemCode") ?? "").trim();
  const itemName = String(formData.get("itemName") ?? "").trim();
  const amount = parseNumber(formData.get("amount"));
  const date = parseDate(formData.get("date") ?? formData.get("dueDate") ?? formData.get("receivedDate"));
  const note = String(formData.get("note") ?? "").trim();

  if (!projectId || !id || !itemName || !Number.isFinite(amount)) {
    throw new Error("Missing cashflow fields");
  }

  const cashAmount =
    defaults.cashAmountMode === "zero" ? 0 : defaults.cashAmountMode === "mirror" ? amount : parseNumber(formData.get("cashAmount"), 0);

  await prisma.cashflowEntry.update({
    where: { id },
    data: {
      itemCode: itemCode || null,
      itemName,
      mainCategory: defaults.mainCategory,
      subCategory: defaults.subCategory,
      amount,
      cashAmount,
      startDate: date,
      endDate: date,
      note: note || null,
    },
  });

  redirectBack(projectId);
}

async function deleteCashflowEntryAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!projectId || !id) throw new Error("Missing cashflow entry id");

  await prisma.$transaction(async (tx) => {
    await removeCashflowEntry(tx, id, projectId);
  });

  redirectBack(projectId);
}

export async function createBillingAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const itemCode = String(formData.get("itemCode") ?? "").trim();
  const itemName = String(formData.get("itemName") ?? "").trim();
  const amount = parseNumber(formData.get("amount"));
  const dueDate = parseDate(formData.get("dueDate"));
  const note = String(formData.get("note") ?? "").trim();

  if (!projectId || !itemName || !Number.isFinite(amount)) {
    throw new Error("Missing billing fields");
  }

  await prisma.cashflowEntry.create({
    data: {
      projectId,
      itemCode: itemCode || null,
      itemName,
      mainCategory: "請款",
      subCategory: "開立請款",
      amount,
      cashAmount: 0,
      startDate: dueDate,
      endDate: dueDate,
      note: note || null,
    },
  });

  redirectBack(projectId);
}

export async function updateBillingAction(formData: FormData) {
  await updateCashflowEntry(formData, {
    mainCategory: "請款",
    subCategory: "開立請款",
    cashAmountMode: "zero",
  });
}

export async function deleteBillingAction(formData: FormData) {
  await deleteCashflowEntryAction(formData);
}

export async function createCollectionAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const itemCode = String(formData.get("itemCode") ?? "").trim();
  const itemName = String(formData.get("itemName") ?? "").trim();
  const amount = parseNumber(formData.get("amount"));
  const receivedDate = parseDate(formData.get("receivedDate"));
  const note = String(formData.get("note") ?? "").trim();

  if (!projectId || !itemName || !Number.isFinite(amount)) {
    throw new Error("Missing collection fields");
  }

  await prisma.cashflowEntry.create({
    data: {
      projectId,
      itemCode: itemCode || null,
      itemName,
      mainCategory: "回款",
      subCategory: "實際回收",
      amount,
      cashAmount: amount,
      startDate: receivedDate,
      endDate: receivedDate,
      note: note || null,
    },
  });

  redirectBack(projectId);
}

export async function updateCollectionAction(formData: FormData) {
  await updateCashflowEntry(formData, {
    mainCategory: "回款",
    subCategory: "實際回收",
    cashAmountMode: "mirror",
  });
}

export async function deleteCollectionAction(formData: FormData) {
  await deleteCashflowEntryAction(formData);
}

export async function saveTaxScenarioAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const taxableProfit = parseNumber(formData.get("taxableProfit"));
  const taxRate = parseNumber(formData.get("taxRate"));
  const note = String(formData.get("note") ?? "").trim();

  if (!projectId || !title || !Number.isFinite(taxableProfit) || !Number.isFinite(taxRate)) {
    throw new Error("Missing tax fields");
  }

  const estimatedTax = Math.max(0, taxableProfit * (taxRate / 100));

  await prisma.$transaction(async (tx) => {
    const scenario = await tx.taxScenario.create({
      data: {
        projectId,
        title,
        taxableProfit,
        taxRate,
        estimatedTax,
        status: "saved",
        note: note || null,
      },
    });

    await tx.cashflowEntry.create({
      data: {
        projectId,
        itemCode: `TAX-${scenario.id.slice(0, 12)}`,
        itemName: `稅務預估 - ${title}`,
        mainCategory: "稅務",
        subCategory: "預估",
        amount: estimatedTax,
        cashAmount: estimatedTax,
        note: note || null,
      },
    });
  });

  redirectBack(projectId);
}

export async function updateTaxScenarioAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const taxableProfit = parseNumber(formData.get("taxableProfit"));
  const taxRate = parseNumber(formData.get("taxRate"));
  const note = String(formData.get("note") ?? "").trim();

  if (!projectId || !id || !title || !Number.isFinite(taxableProfit) || !Number.isFinite(taxRate)) {
    throw new Error("Missing tax fields");
  }

  const estimatedTax = Math.max(0, taxableProfit * (taxRate / 100));

  await prisma.$transaction(async (tx) => {
    const existing = await tx.taxScenario.findUnique({ where: { id } });
    if (!existing || existing.projectId !== projectId) {
      throw new Error("Tax scenario not found");
    }

    await tx.taxScenario.update({
      where: { id },
      data: {
        title,
        taxableProfit,
        taxRate,
        estimatedTax,
        note: note || null,
      },
    });

    await tx.cashflowEntry.updateMany({
      where: { projectId, itemCode: `TAX-${id.slice(0, 12)}` },
      data: {
        itemName: `稅務預估 - ${title}`,
        amount: estimatedTax,
        cashAmount: estimatedTax,
        note: note || null,
      },
    });
  });

  redirectBack(projectId);
}

export async function deleteTaxScenarioAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const id = String(formData.get("id") ?? "");

  if (!projectId || !id) {
    throw new Error("Missing tax scenario id");
  }

  await prisma.$transaction(async (tx) => {
    const scenario = await tx.taxScenario.findUnique({ where: { id } });
    if (!scenario || scenario.projectId !== projectId) {
      throw new Error("Tax scenario not found");
    }

    await tx.taxScenario.delete({ where: { id } });
    await tx.cashflowEntry.deleteMany({
      where: { projectId, itemCode: `TAX-${id.slice(0, 12)}` },
    });
  });

  redirectBack(projectId);
}
