import "server-only";
import { prisma } from "@/lib/prisma";

export async function createContactSubmission(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  return prisma.contactSubmission.create({ data });
}

// --- Fungsi admin ---

export async function getSubmissionsPage({
  page,
  perPage,
}: {
  page: number;
  perPage: number;
}) {
  const [rows, total] = await Promise.all([
    prisma.contactSubmission.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.contactSubmission.count(),
  ]);
  return { rows, total };
}

export async function deleteSubmissionById(id: string) {
  return prisma.contactSubmission.delete({ where: { id } });
}
