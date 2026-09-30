import { defineConfig } from "prisma/config";
import dotenv from "dotenv";

dotenv.config();

/**
 * Deliberately duplicated from src/config/databaseUrl.ts — keep the two in sync.
 * This file is loaded by the Prisma CLI's own TS loader inside the production
 * `docker compose` command, so it must not depend on a relative import.
 */
function resolveDatabaseUrl(): string {
  const isProduction = process.env.NODE_ENV === "production";
  const prod = process.env.DATABASE_URL_PROD?.trim();
  const fallback = process.env.DATABASE_URL?.trim();

  if (isProduction && prod) return prod;

  if (isProduction && !fallback) {
    throw new Error(
      "Database configuration error: NODE_ENV=production requires DATABASE_URL_PROD to be set."
    );
  }

  if (isProduction) {
    console.warn(
      "[config] DATABASE_URL_PROD is not set; falling back to DATABASE_URL. Set DATABASE_URL_PROD in production to silence this warning."
    );
  }

  if (!fallback) {
    throw new Error(
      "Database configuration error: DATABASE_URL is required when NODE_ENV is not 'production'."
    );
  }

  return fallback;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: resolveDatabaseUrl(),
  },
});
