import "server-only";
import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const [projects, testimonials, submissions] = await Promise.all([
    prisma.project.count(),
    prisma.testimonial.count(),
    prisma.contactSubmission.count(),
  ]);
  return { projects, testimonials, submissions };
}
