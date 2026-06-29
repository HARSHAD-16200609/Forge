import { prisma } from "../config/prisma";
import { getCurrentTime, loggers } from "../utility/logger/serviceLoggers";

export const deleteExpiredSession = async () => {
    const startedAt = new Date();

    try {
        const result = await prisma.session.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                }
            },
        });

        const finishedAt = new Date();

        loggers.audit.info("CRON_DELETED_EXPIRED_SESSION", {
            action: "CRON_DELETE_EXPIRED_SESSION",
            status: "SUCCESS",
            affectedRecords: result.count,
            startedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
        });
    } catch (error) {
        const finishedAt = new Date();

        loggers.audit.error("CRON_DELETED_EXPIRED_SESSION", {
            action: "CRON_DELETE_EXPIRED_SESSION",
            status: "FAILED",
            startedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
            error: error instanceof Error ? error.message : String(error),
        });
    }
};