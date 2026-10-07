/**
 * v17 · Policy probe for scripts/preview-safety.js. Run through tsx as a LOCAL
 * SCRIPT would run, with whatever env the gate passes (DATABASE_URL, VERCEL,
 * VERCEL_ENV), and reports what lib/readOnly and lib/db decide:
 *
 *   npx tsx scripts/lib/preview-safety-probe.ts
 *
 * Prints one line: PROBE {"readOnly":..,"write":"refused"|"reached-prisma"|..}
 *
 * The write attempt carries an invalid DateTime, so where the guard lets it
 * through, Prisma's own validation stops it ("reached-prisma"): nothing is
 * ever written, and a remote URL (the gate uses a .invalid host) is never
 * contacted because the read-only guard throws first.
 */
import { prisma } from "../../lib/db";
import { READ_ONLY_CODE, isReadOnlyDeployment } from "../../lib/readOnly";

async function main() {
  const readOnly = isReadOnlyDeployment();
  let write = "no-error";
  try {
    await prisma.demoMeta.create({
      data: { id: "qa-preview-safety-probe", lastReset: "not-a-date" as unknown as Date },
    });
  } catch (e) {
    const err = e as { code?: string; name?: string };
    write =
      err?.code === READ_ONLY_CODE
        ? "refused"
        : err?.name === "PrismaClientValidationError"
          ? "reached-prisma"
          : `other:${err?.name ?? "?"}`;
  }
  console.log(`PROBE ${JSON.stringify({ readOnly, write })}`);
}

main()
  .catch((e) => console.log(`PROBE ${JSON.stringify({ crashed: String((e as Error)?.message ?? e).slice(0, 200) })}`))
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
