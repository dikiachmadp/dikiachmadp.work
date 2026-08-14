"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";
import { deleteSubmissionById } from "@/lib/db/contact";
import { pageQuery } from "@/lib/pagination";

export async function deleteSubmissionAction(id: string, formData: FormData) {
  const locale = (formData.get("formLocale") as string) || "en";
  await requireUser(locale);

  await deleteSubmissionById(id);
  // Kembali ke halaman tempat tombolnya ditekan — tanpa ini menghapus satu
  // pesan dari halaman 4 melempar admin ke halaman 1.
  redirect(
    `/${locale}/dashboard/submissions${pageQuery(formData.get("page"))}`,
  );
}
