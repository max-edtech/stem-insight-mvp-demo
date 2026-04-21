"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createProjectCase, parseCaseDraft } from "@/lib/case-builder";

export async function createProjectCaseAction(formData: FormData) {
  const draft = parseCaseDraft(formData);
  const result = await createProjectCase(draft);

  revalidatePath("/");
  redirect(`/${result.projectId}`);
}
