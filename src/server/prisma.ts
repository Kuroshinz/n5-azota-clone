import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const cachedPrisma = globalForPrisma.prisma;
// Ensure cached client has latest models (classroom, student)
export const prisma = (cachedPrisma && (cachedPrisma as any).classroom)
  ? cachedPrisma
  : new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
