import { config as loadDotenv } from "dotenv";
import path from "path";
import { spawnSync } from "child_process";
import { Pool } from "pg";

loadDotenv({ path: path.resolve(import.meta.dirname, "../../.env.test") });

const TEST_DB = "Forge_test";

function adminConnectionString(): string {
  const u = new URL(process.env.DATABASE_URL!);
  u.pathname = "/postgres";
  u.search = "";
  return u.toString();
}

export default async function globalSetup() {
  const pool = new Pool({ connectionString: adminConnectionString() });

  const exists = await pool.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [TEST_DB]
  );
  if (exists.rowCount === 0) {
    await pool.query(`CREATE DATABASE "${TEST_DB}"`);
  }
  await pool.end();

  const migrate = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: process.env,
  });
  if (migrate.status !== 0) {
    throw new Error(`prisma migrate deploy failed (status ${migrate.status})`);
  }
}