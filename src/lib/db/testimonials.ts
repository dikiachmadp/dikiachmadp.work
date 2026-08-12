import "server-only";
import { prisma } from "@/lib/prisma";
import type { Locale, TestimonialItem } from "@/types/content";

export async function getTestimonials(
  locale: Locale,
): Promise<TestimonialItem[]> {
  const rows = await prisma.testimonial.findMany({
    where: { locale },
    orderBy: { order: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    clientName: row.name,
    role: row.role,
    content: row.content,
    // Komponen main mengharapkan string, bukan optional — "" berarti "tidak ada".
    avatarUrl: row.avatarUrl ?? "",
    projectRef: row.projectRef ?? "",
  }));
}

// --- Fungsi admin ---

export type TestimonialInput = {
  locale: "en" | "id";
  name: string;
  role: string;
  content: string;
  avatarUrl?: string;
  projectRef?: string;
  order: number;
};

function toData(input: TestimonialInput) {
  return {
    locale: input.locale,
    name: input.name,
    role: input.role,
    content: input.content,
    avatarUrl: input.avatarUrl ?? null,
    projectRef: input.projectRef ?? null,
    order: input.order,
  };
}

export async function getTestimonialsPage({
  page,
  perPage,
}: {
  page: number;
  perPage: number;
}) {
  const [rows, total] = await Promise.all([
    prisma.testimonial.findMany({
      orderBy: [{ locale: "asc" }, { order: "asc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.testimonial.count(),
  ]);
  return { rows, total };
}

export async function getTestimonialById(id: string) {
  return prisma.testimonial.findUnique({ where: { id } });
}

export async function createTestimonial(input: TestimonialInput) {
  return prisma.testimonial.create({ data: toData(input) });
}

export async function updateTestimonial(id: string, input: TestimonialInput) {
  return prisma.testimonial.update({ where: { id }, data: toData(input) });
}

export async function deleteTestimonialById(id: string) {
  return prisma.testimonial.delete({ where: { id } });
}
