/**
 * Prisma client singleton for Next.js.
 *
 * v17 · In a read-only deployment (a Vercel preview, see lib/readOnly.ts) the
 * client is wrapped in a query extension that refuses every write BEFORE it
 * reaches the database. It is an allowlist: the eight model read operations
 * pass, everything else throws ReadOnlyDeploymentError. That includes ALL raw
 * SQL ($queryRaw, $queryRawUnsafe, $executeRaw, $executeRawUnsafe), reads
 * included, and any top-level operation Prisma may add later. The app reads
 * nothing through raw SQL, and no text classifier can be trusted to tell a
 * read from a write (quoted or commented function names, bare-CR comments and
 * volatile user functions all walked past the one that was here).
 * Operations inside interactive and batch $transaction calls run through the
 * same extension (scripts/preview-safety.js proves it). Production and local
 * dev get the plain client, exactly as before.
 */
import { PrismaClient } from "@prisma/client";
import { ReadOnlyDeploymentError, isReadOnlyDeployment } from "./readOnly";

/** Model operations that only read. Anything else is refused (fail closed). */
const READ_MODEL_OPS: ReadonlySet<string> = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);

/**
 * The read-only decision for one Prisma operation: true only for a model
 * read. `model` is undefined for top-level operations ($queryRaw and the
 * rest), which are always refused. Exported for the gate.
 */
export function readOnlyAllows(
  model: string | undefined,
  operation: string
): boolean {
  return Boolean(model) && READ_MODEL_OPS.has(operation);
}

function readOnlyClient(base: PrismaClient): PrismaClient {
  return base.$extends({
    name: "read-only-deployment",
    query: {
      async $allOperations({ model, operation, args, query }) {
        if (readOnlyAllows(model, operation)) return query(args);
        throw new ReadOnlyDeploymentError(
          model ? `${model}.${operation}` : operation
        );
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
