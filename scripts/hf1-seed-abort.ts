/**
 * HF-1 · run seedDatabase() with its failAfter test hook, against the LOCAL
 * dev database only. Used by scripts/hf1-security.js to prove that a reseed
 * that fails partway rolls back to exactly the data that was there before.
 *
 *   npx tsx scripts/hf1-seed-abort.ts <step>   # throw after <step>
 *   npx tsx scripts/hf1-seed-abort.ts --full   # a normal, complete seed
 *
 * Prints one JSON line. Refuses to run unless DATABASE_URL points at
 * localhost, so it can never touch a hosted database.
 */
import { prisma } from "@/lib/db";
import {
  SEED_STEPS,
  SeedAbortedForTest,
  seedDatabase,
  type SeedStep,
} from "@/lib/seedDatabase";

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    /* unparseable · refused below */
  }
  if (host !== "localhost" && host !== "127.0.0.1") {
    console.log(JSON.stringify({ ok: false, error: "refused: DATABASE_URL is not localhost" }));
    process.exitCode = 2;
    return;
  }

  const arg = process.argv[2] ?? "";
  const started = Date.now();
  if (arg === "--full") {
    await seedDatabase();
    console.log(JSON.stringify({ ok: true, full: true, ms: Date.now() - started }));
    return;
  }
  if (!(SEED_STEPS as readonly string[]).includes(arg)) {
    console.log(JSON.stringify({ ok: false, error: `unknown step "${arg}"`, steps: SEED_STEPS }));
    process.exitCode = 2;
    return;
  }
  try {
    await seedDatabase({ failAfter: arg as SeedStep });
    console.log(JSON.stringify({ ok: false, error: "seed did not abort" }));
    process.exitCode = 1;
  } catch (e) {
    const aborted = e instanceof SeedAbortedForTest;
    console.log(
      JSON.stringify({
        ok: aborted,
        aborted,
        step: arg,
        ms: Date.now() - started,
        error: aborted ? undefined : String(e),
      })
    );
    if (!aborted) process.exitCode = 1;
  }
}

main().finally(() => prisma.$disconnect());
