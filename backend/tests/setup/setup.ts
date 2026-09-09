import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(import.meta.dirname, "../../.env.test") });

const isTestDb = process.env.DATABASE_URL?.split("/").pop()?.startsWith("Forge_test");

if (process.env.NODE_ENV !== "test" || !isTestDb) {
  throw new Error(
    "Test environment misconfigured: expected NODE_ENV=test and a DATABASE_URL pointing at the Forge_test database. Refusing to run tests against dev data."
  );
}