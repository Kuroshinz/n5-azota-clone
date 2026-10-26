import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);

let prismaInstance: PrismaClient;

if (isDatabaseConfigured) {
  const cachedPrisma = globalForPrisma.prisma;
  // Ensure cached client has latest models (classroom, student)
  prismaInstance = (cachedPrisma && (cachedPrisma as any).classroom)
    ? cachedPrisma
    : new PrismaClient();

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance;
} else {
  // Graceful proxy for local / test environments without DATABASE_URL
  const createDummyModelHandler = (modelName: string): ProxyHandler<any> => ({
    get(_target, method) {
      return async (...args: any[]) => {
        const m = String(method);
        if (m === 'deleteMany' || m === 'updateMany') {
          try {
            if (typeof (globalThis as any).__clearMemoryStores === 'function') {
              (globalThis as any).__clearMemoryStores();
            }
            if (typeof (globalThis as any).__clearExamStores === 'function') {
              (globalThis as any).__clearExamStores();
            }
          } catch {}
          return { count: 0 };
        }
        if (m === 'findUnique' || m === 'findFirst') {
          const id = args[0]?.where?.id;
          if (modelName === 'exam' && id && typeof (globalThis as any).__getExamRecord === 'function') {
            return (globalThis as any).__getExamRecord(id);
          }
          if (modelName === 'submission' && id && typeof (globalThis as any).__getSubmissionRecord === 'function') {
            return (globalThis as any).__getSubmissionRecord(id);
          }
          return null;
        }
        if (m === 'count') {
          if (modelName === 'exam' && typeof (globalThis as any).__getExamCount === 'function') {
            return (globalThis as any).__getExamCount();
          }
          return 0;
        }
        if (m === 'findMany') {
          return [];
        }
        if (m === 'create') {
          return { id: `local-${Date.now()}`, ...(args[0]?.data || {}) };
        }
        if (m === 'upsert') {
          return { id: args[0]?.where?.id || `local-${Date.now()}`, ...(args[0]?.create || args[0]?.update || {}) };
        }
        if (m === 'update') {
          return { id: args[0]?.where?.id, ...(args[0]?.data || {}) };
        }
        if (m === 'delete') {
          return { id: args[0]?.where?.id };
        }
        return null;
      };
    }
  });

  prismaInstance = new Proxy({} as PrismaClient, {
    get(_target, prop) {
      const p = String(prop);
      if (p.startsWith('$') || p.startsWith('_')) {
        if (p === '$transaction') {
          return async (fnOrArray: any) => {
            if (typeof fnOrArray === 'function') return fnOrArray(prismaInstance);
            if (Array.isArray(fnOrArray)) return Promise.all(fnOrArray);
            return [];
          };
        }
        return async () => {};
      }
      return new Proxy({}, createDummyModelHandler(p));
    }
  });
}

export const prisma = prismaInstance;
