import { PrismaClient } from "@prisma/client";

// In development, Next.js clears the Node.js cache on hot module reload.
// If we create a new PrismaClient instance on every reload, database connections
// quickly exhaust the connection limit. Using globalThis preserves a single instance.
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
