/**
 * Prisma client singleton for Next.js.
 *
 * v17 · In a read-only deployment (a Vercel preview, see lib/readOnly.ts) the
 * client is wrapped in a query extension that refuses every write BEFORE it
 * reaches the database: model writes, $executeRaw / $executeRawUnsafe, and any
 * $queryRaw / $queryRawUnsafe whose SQL is not a plain read. Reads pass
 * through untouched. Operations inside interactive and batch $transaction
 * calls run through the same extension (scripts/preview-safety.js proves it).
 * Production and local dev get the plain client, exactly as before.
 */
import { PrismaClient } from "@prisma/client";
import {
  ReadOnlyDeploymentError,
  isReadOnlyDeployment,
  isReadOnlySql,
} from "./readOnly";

/** Model operations that only read. Anything else is refused (fail closed). */
const READ_MODEL_OPS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);

/** The SQL text of a raw query, whichever way it was called. */
function rawSqlText(args: unknown): string {
  // $queryRawUnsafe(sql, ...values) arrives as [sql, ...values].
  if (Array.isArray(args)) return typeof args[0] === "string" ? args[0] : "";
  if (typeof args === "string") return args;
  if (args && typeof args === "object") {
    // $queryRaw`...` arrives as a Prisma.Sql object.
    const a = args as { sql?: unknown; strings?: unknown };
    if (typeof a.sql === "string") return a.sql;
    if (Array.isArray(a.strings)) return a.strings.join("$?");
  }
  return "";
}

function readOnlyClient(base: PrismaClient): PrismaClient {
  return base.$extends({
    name: "read-only-deployment",
    query: {
      async $allOperations({ model, operation, args, query }) {
        if (model) {
          if (READ_MODEL_OPS.has(operation)) return query(args);
          throw new ReadOnlyDeploymentError(`${model}.${operation}`);
        }
        if (
          (operation === "$queryRaw" || operation === "$queryRawUnsafe") &&
          isReadOnlySql(rawSqlText(args))
        ) {
          return query(args);
        }
        // $executeRaw, $executeRawUnsafe, a raw query that writes, and any
        // operation this list does not know.
        throw new ReadOnlyDeploymentError(operation);
      },
    },
    // The query extension leaves the model API unchanged, so the client keeps
    // the PrismaClient type the rest of the app is written against.
  }) as unknown as PrismaClient;
}

function createClient(): PrismaClient {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  return isReadOnlyDeployment() ? readOnlyClient(base) : base;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
