import { seedDatabase } from "../lib/seedDatabase";
import { prisma } from "../lib/db";

seedDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
