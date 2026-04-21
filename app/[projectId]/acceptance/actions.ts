"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function parseDate(value: FormDataEntryValue | null) {
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function parseCheckbox(value: FormDataEntryValue | null) {
  return value === "on";
}

function normalizeDecision(value: FormDataEntryValue | null): "go" | "revise" {
  return value === "go" ? "go" : "revise";
}

function cleanText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function saveAcceptanceReviewAction(formData: FormData) {
  const projectId = cleanText(formData.get("projectId"));
  if (!projectId) {
    throw new Error("Missing project id");
  }

  await prisma.acceptanceReview.upsert({
    where: { projectId },
    update: {
      meetingDate: parseDate(formData.get("meetingDate")),
      ownerName: cleanText(formData.get("ownerName")) || null,
      reviewerName: cleanText(formData.get("reviewerName")) || null,
      decision: normalizeDecision(formData.get("decision")),
      feasibilityPass: parseCheckbox(formData.get("feasibilityPass")),
      changePass: parseCheckbox(formData.get("changePass")),
      variancePass: parseCheckbox(formData.get("variancePass")),
      cashflowPass: parseCheckbox(formData.get("cashflowPass")),
      taxPass: parseCheckbox(formData.get("taxPass")),
      exportPass: parseCheckbox(formData.get("exportPass")),
      notes: cleanText(formData.get("notes")) || null,
    },
    create: {
      projectId,
      meetingDate: parseDate(formData.get("meetingDate")),
      ownerName: cleanText(formData.get("ownerName")) || null,
      reviewerName: cleanText(formData.get("reviewerName")) || null,
      decision: normalizeDecision(formData.get("decision")),
      feasibilityPass: parseCheckbox(formData.get("feasibilityPass")),
      changePass: parseCheckbox(formData.get("changePass")),
      variancePass: parseCheckbox(formData.get("variancePass")),
      cashflowPass: parseCheckbox(formData.get("cashflowPass")),
      taxPass: parseCheckbox(formData.get("taxPass")),
      exportPass: parseCheckbox(formData.get("exportPass")),
      notes: cleanText(formData.get("notes")) || null,
    },
  });

  revalidatePath(`/${projectId}`);
  revalidatePath(`/${projectId}/acceptance`);
  redirect(`/${projectId}/acceptance`);
}
