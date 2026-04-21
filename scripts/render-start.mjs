import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const bundledDbPath = path.join(root, "prisma", "dev.db");
const renderDbPath = "/var/data/dev.db";

function ensureRenderDatabase() {
  if (!fs.existsSync("/var/data")) return;
  if (fs.existsSync(renderDbPath)) return;
  if (!fs.existsSync(bundledDbPath)) return;

  fs.copyFileSync(bundledDbPath, renderDbPath);
  console.log(`[render-start] Seeded SQLite database to ${renderDbPath}`);
}

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (fs.existsSync("/var/data")) return "file:/var/data/dev.db";
  return "file:./prisma/dev.db";
}

function run(command) {
  execSync(command, {
    stdio: "inherit",
    env: process.env,
  });
}

function main() {
  ensureRenderDatabase();
  process.env.DATABASE_URL = resolveDatabaseUrl();

  console.log(`[render-start] DATABASE_URL=${process.env.DATABASE_URL}`);
  run("npx prisma db push");

  const port = process.env.PORT || "10000";
  run(`npx next start -p ${port}`);
}

main();
