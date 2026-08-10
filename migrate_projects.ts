import { PrismaClient } from "./prisma/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function migrate() {
  console.log("Database URL:", process.env.DATABASE_URL ? "Set" : "Not Set");
  const filePath = path.join(process.cwd(), "src/content/en/projects.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  for (const item of data.items) {
    try {
      await prisma.project.create({
        data: {
          title: item.title,
          slug: item.slug,
          description: item.description,
          imageUrl: item.coverImage,
        },
      });
      console.log(`Migrated: ${item.title}`);
    } catch (e) {
      console.error(`Failed to migrate ${item.title}:`, e);
    }
  }
}

migrate()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
