import { subDays, subMinutes } from "date-fns";
import { Status } from "../../generated/prisma/enums";
import { prisma } from "../config/prisma"
import { loggers } from "../utility/logger/serviceLoggers";

export const expireWsInvite = async () => {
    const startedAt = new Date();

    try {
        const invites = await prisma.workspaceInvite.updateMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },status: "PENDING"
            },
            data: {
                status: Status.EXPIRED,
            },
        });

        const finishedAt = new Date();

        loggers.audit.info("CRON_MARKED_PENDING_INVITES_EXPIRED", {
            action: "CRON_INVITE_EXPIRATION",
            status: "SUCCESS",
            affectedRecords: invites.count,
            startedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
        });
    } catch (error) {
        const finishedAt = new Date();

        loggers.audit.error("CRON_MARKED_PENDING_INVITES_EXPIRED", {
            action: "CRON_INVITE_EXPIRATION",
            status: "FAILED",
            startedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
            error: error instanceof Error ? error.message : String(error),
        });
    }
};


export const deleteExpiredWsInvite = async () => {
    const startedAt = new Date();

    try {
        const result = await prisma.workspaceInvite.deleteMany({
            where: {
                status: Status.EXPIRED,
                expiresAt: {
                    lt: subDays(new Date(), 30),
                },
            },
        });

        const finishedAt = new Date();

        loggers.audit.info("CRON_DELETED_EXPIRED_INVITES", {
            action: "CRON_DELETE_EXPIRED_INVITES",
            status: "SUCCESS",
            deletedRecords: result.count,
            startedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
        });
    } catch (error) {
        const finishedAt = new Date();

        loggers.audit.error("CRON_DELETED_EXPIRED_INVITES", {
            action: "CRON_DELETE_EXPIRED_INVITES",
            status: "FAILED",
            startedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
            error: error instanceof Error ? error.message : String(error),
        });
    }
};

export const expireChannelInvite = async () => {
    const startedAt = new Date();

    try {
        const invites = await prisma.channelInvite.updateMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },status: "PENDING"
            },
            data: {
                status: Status.EXPIRED,
            },
        });

        const finishedAt = new Date();

        loggers.audit.info("CRON_MARKED_PENDING_INVITES_EXPIRED", {
            action: "CRON_INVITE_EXPIRATION",
            status: "SUCCESS",
            affectedRecords: invites.count,
            startedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
        });
    } catch (error) {
        const finishedAt = new Date();

        loggers.audit.error("CRON_MARKED_PENDING_INVITES_EXPIRED", {
            action: "CRON_INVITE_EXPIRATION",
            status: "FAILED",
            startedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
            error: error instanceof Error ? error.message : String(error),
        });
    }
};

export const deleteExpiredChannelInvite = async () => {
    const startedAt = new Date();

    try {
        const result = await prisma.channelInvite.deleteMany({
            where: {
                status: Status.EXPIRED,
                expiresAt: {
                    lt: subDays(new Date(), 30),
                },
            },
        });

        const finishedAt = new Date();

        loggers.audit.info("CRON_DELETED_EXPIRED_INVITES", {
            action: "CRON_DELETE_EXPIRED_INVITES",
            status: "SUCCESS",
            deletedRecords: result.count,
            startedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
        });
    } catch (error) {
        const finishedAt = new Date();

        loggers.audit.error("CRON_DELETED_EXPIRED_INVITES", {
            action: "CRON_DELETE_EXPIRED_INVITES",
            status: "FAILED",
            startedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
            error: error instanceof Error ? error.message : String(error),
        });
    }
};