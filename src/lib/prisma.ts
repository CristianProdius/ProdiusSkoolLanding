// /src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Safely create a single Prisma client instance across hot-reloads
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // log: ["query"], // optional if you want to see queries
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
