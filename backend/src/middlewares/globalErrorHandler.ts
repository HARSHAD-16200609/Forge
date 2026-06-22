import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utility/errorHandling/ApiError";
import logger from "../utility/logger/logger";
import { Prisma } from "../../generated/prisma/client";
import { loggers } from "../utility/logger/serviceLoggers";
import { UserInputValidationError } from "../utility/errorHandling/customErrors";


const PRISMA_ERROR_MAP: Record<string, { status: number; message: string }> = {
  P2002: { status: 409, message: "Resource already exists" },
  P2003: { status: 400, message: "Invalid reference" },
  P2025: { status: 404, message: "Record not found" },
};




export function globalErrorMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
  if (
    err instanceof Prisma.PrismaClientKnownRequestError
  ) {
    loggers.db.error("Database-Error", {
      event: "PRISMA_ERROR",
      code: err.code,
      message: err.message,
      path: req.originalUrl,
      method: req.method,
    })
    const mapped = PRISMA_ERROR_MAP[err.code];
    if (mapped) {
      res.status(mapped.status).json({ message: mapped.message });
      return;
    }
  }
  if (err instanceof UserInputValidationError) {
    logger.warn("Handled error", {
      statusCode: err.statusCode,
      message: err.message,
      url: req.originalUrl,
    });
    return res.status(err.statusCode).json({
      status: err.statusCode,
      message: err.message,
      invalidationReason: err.invalidationReason

    })
  }

  if (err instanceof ApiError) {

    logger.warn("Handled error", {
      statusCode: err.statusCode,
      message: err.message,
      url: req.originalUrl,
    });
    return res.status(err.statusCode).json({
      status: err.statusCode,
      message: err.message,
      ...(process.env.NODE_ENV === "development" && {
        stack: err.stack,

      })

    })
  }
  else {
    logger.error("Unhandled error", {
      error: err,
      url: req.originalUrl,
      method: req.method,
      stack: err.stack,
    });
    return res.status(500).json({
      status: 500,
      message: "INTERNAL_SERVER_ERROR"
    })
  }
}