import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to database...");
  const result = await prisma.$queryRaw`SELECT 1 as connected`;
  console.log("Database connectivity check (SELECT 1):", result);

  const count = await prisma.participant.count();
  console.log(`Participants count: ${count}`);
}

main()
  .catch((err) => {
    console.error("Database check failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
