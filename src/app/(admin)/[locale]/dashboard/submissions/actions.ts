"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";
import { deleteSubmissionById } from "@/lib/db/contact";

export async function deleteSubmissionAction(id: string, formData: FormData) {
  const locale = (formData.get("formLocale") as string) || "en";
  await requireUser(locale);

  await deleteSubmissionById(id);
  redirect(`/${locale}/dashboard/submissions`);
}
