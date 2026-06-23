import winston from "winston";
import { env } from "../../config/env";

const logger = winston.createLogger({
  level: env.LOG_LEVEL || "info",

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
     winston.format.json()
  ),

  transports: [
    new winston.transports.Console(),

    new winston.transports.File({
      filename: "src/logs/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "src/logs/combined.log",
      level: "info",
    })
  ],
});

export default logger;