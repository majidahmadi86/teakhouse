// Development database · real Postgres 17 from the embedded-postgres package
// (no Docker, works on Windows). Never a production database.
//
//   npm --prefix tools/devdb install        once
//   node tools/devdb/dev-db.mjs             starts and keeps running (Ctrl+C stops)
//
// Data lives in tools/devdb/data (gitignored). The URL to use is printed on
// start and is the one in .env / .env.local:
//   postgresql://postgres:localonly@localhost:<port>/postgres
import EmbeddedPostgres from "embedded-postgres";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(path.join(here, "devdb.json"), "utf8"));
const port = Number(process.argv[2] || config.port);
const dataDir = path.join(here, "data");

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "localonly",
  port,
  persistent: true,
  onLog: () => {},
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});

if (!fs.existsSync(path.join(dataDir, "PG_VERSION"))) await pg.initialise();
// A crashed run leaves a stale lock; Postgres refuses to start on it.
const pid = path.join(dataDir, "postmaster.pid");
if (fs.existsSync(pid)) {
  const owner = Number(fs.readFileSync(pid, "utf8").split(/\r?\n/)[0]);
  let alive = false;
  try {
    process.kill(owner, 0);
    alive = true;
  } catch {}
  if (!alive) fs.rmSync(pid);
}
await pg.start();
console.log(`READY ${config.name} dev database on ${port}`);
console.log(`postgresql://postgres:localonly@localhost:${port}/postgres`);
const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
