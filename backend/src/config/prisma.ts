import "dotenv/config";
import fs from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { loggers } from "../utility/logger/serviceLoggers";

const connectionString = process.env.DATABASE_URL!;

const adapter = new PrismaPg({
  connectionString,
  ssl: {
    ca: fs.readFileSync("/app/certs/global-bundle.pem", "utf8"),
    rejectUnauthorized: true,
  },
});

const prisma = new PrismaClient({
  adapter,
  log: [
    {
      level: "query",
      emit: "event",
    },
  ],
});

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