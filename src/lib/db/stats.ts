import "server-only";
import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const [projects, testimonials, submissions, products] = await Promise.all([
    prisma.project.count(),
    prisma.testimonial.count(),
    prisma.contactSubmission.count(),
    prisma.digitalProduct.count(),
  ]);
  return { projects, testimonials, submissions, products };
}
