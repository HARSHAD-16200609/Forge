import { NextFunction, Request,Response } from "express";
import logger from "../utility/logger/logger";
import { requestContext } from "../utility/logger/requestContext";
import { randomUUID } from "crypto";

export function loggerMiddleware(req : Request,res : Response,next : NextFunction){
    const requestId = (req.headers["x-request-id"] as string) ?? randomUUID();
  const startedAt = process.hrtime.bigint();

     res.setHeader("x-request-id", requestId);

 requestContext.run({ requestId }, () => {
    logger.info("→ request", {
     requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
   
      const level =
        res.statusCode >= 500 ? "error"
        : res.statusCode >= 400 ? "warn"
        : "info";

      logger[level]("← response", {
        
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: parseFloat(durationMs.toFixed(2)),
      });
    });

    next();
  });


}