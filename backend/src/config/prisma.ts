import fs from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { describeDatabase, resolveDatabaseUrl } from "./databaseUrl";
import { loggers } from "../utility/logger/serviceLoggers";

const { url: connectionString, source, isProduction } = resolveDatabaseUrl();

const DEFAULT_CA_PATH = "/app/certs/global-bundle.pem";

function buildSsl() {
  if (!isProduction) return undefined;

  const caPath = process.env.DB_SSL_CA_PATH?.trim() || DEFAULT_CA_PATH;

  try {
    return { ca: fs.readFileSync(caPath, "utf8"), rejectUnauthorized: true };
  } catch (err) {
    throw new Error(
      `Database SSL configuration error: NODE_ENV=production requires a readable CA bundle at "${caPath}" (override with DB_SSL_CA_PATH). Cause: ${(err as Error).message}`
    );
  }
}

const ssl = buildSsl();

const adapter = new PrismaPg({ connectionString, ssl });

const prisma = new PrismaClient({
  adapter,
  log: [
    {
      level: "query",
      emit: "event",
    },
  ],
});

const { host, database } = describeDatabase(connectionString);
console.log(`[db] ${host}/${database} (via ${source}, ssl: ${ssl ? "on" : "off"})`);

prisma.$on("query", (e) => {
  if (e.duration > 100) {
    loggers.db.warn({
      event: "SLOW_QUERY",
      query: e.query,
      params: e.params,
      durationMs: e.duration,
    });
  }
});

export { prisma };
