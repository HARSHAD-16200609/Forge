import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { loggers } from "../utility/logger/serviceLoggers";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter , log: [
    {
      level: "query",
      emit: "event",
    },] });

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