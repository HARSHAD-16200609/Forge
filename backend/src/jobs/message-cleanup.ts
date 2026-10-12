import { subDays, subHours } from "date-fns"
import { prisma } from "../config/prisma"
import { StorageProvider, UploadStatus } from "../../generated/prisma/enums"
import { loggers } from "../utility/logger/serviceLoggers"
import { messageRepository } from "../modules/Messages/message.repository"
import { uploadRepository } from "../modules/Uploads/upload.repository"
import { storageStrategy } from "../storage"


interface StoredObjectRef {
    id: string
    storageProvider: StorageProvider
    storageKey: string | null
    publicId: string | null
    mimeType: string
}

const deleteStoredObject = async (upload: StoredObjectRef) => {
    const key = upload.storageKey ?? upload.publicId
    if (!key) return { status: "rejected" as const, reason: "no storage key" }
    try {
        await storageStrategy.delete(upload.storageProvider, key, { mimeType: upload.mimeType })
        return { status: "fulfilled" as const, value: true }
    } catch (err) {
        loggers.audit.error("STORAGE_DELETE_FAILED", {
            provider: upload.storageProvider,
            key,
            error: err instanceof Error ? err.message : String(err),
        })
        return { status: "rejected" as const, reason: key }
    }
}


export const cleanupDeletedMessages = async () => {
    const thirtyDaysAgo = subDays(new Date(), 30)

    const startedAt = new Date()
    try {

        let count = 0;
        while (true) {

            const deletedMessages = await messageRepository.getDeletedMessages(100, thirtyDaysAgo)

            if (deletedMessages.length === 0) break

            const successfulMessageIds: string[] = [];

            for (const message of deletedMessages) {
                const results = await Promise.allSettled(
                    message.uploads.map(upload => deleteStoredObject(upload))
                );

                const successfulIds = message.uploads
                    .filter((_, index) => results[index]!.status === "fulfilled")
                    .map(upload => upload.id);

                if (successfulIds.length > 0) {
                    const result = await uploadRepository.hardDeleteAttachments(successfulIds);
                    count += result.count;
                }

            }

        }

        const finishedAt = new Date();
        loggers.audit.info("CRON_DELETE_USER_MESSAGES", {
            action: "CRON_DELETE_MESSAGES",
            status: "SUCESS",
            startedAt,
            messagesDeleted: count,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
        });


    }
    catch (error) {
        const finishedAt = new Date()
        loggers.audit.error("CRON_DELETE_USER_MESSAGES", {
            action: "CRON_DELETE_MESSAGES",
            status: "FAILED",
            startedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
            error: error instanceof Error ? error.message : String(error),

        });
        throw error

    };
}

export const cleanUserDeletedUploads = async () => {
    const thirtyDaysAgo = subDays(new Date(), 30)
    const startedAt = new Date()
    try {
        const deletedUploads = await prisma.upload.findMany({
            where: {
                deletedAt: {
                    lte: thirtyDaysAgo
                }
            }, select: {
                id: true,
                storageProvider: true,
                storageKey: true,
                publicId: true,
                mimeType: true
            }
        })

        const results = await Promise.allSettled(
            deletedUploads.map((upload) => deleteStoredObject(upload))
        )
        const successfulUploadIds = deletedUploads
            .filter((_, index) => results[index]?.status === "fulfilled")
            .map(upload => upload.id);

        const result = await prisma.upload.deleteMany({
            where: {
                id: {
                    in: successfulUploadIds,
                },
            },
        });



        const finishedAt = new Date();
        loggers.audit.info("CRON_DELETE_USER_UPLOADS", {
            action: "CRON_DELETE_UPLOADS",
            status: "SUCESS",
            startedAt,
            deletedUploads: result.count,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
        });

    } catch (error) {
        const finishedAt = new Date()
        loggers.audit.error("CRON_DELETE_USER_UPLOADS", {
            action: "CRON_DELETE_UPLOADS",
            status: "FAILED",
            startedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
            error: error instanceof Error ? error.message : String(error),

        });
        throw error
    }

}


/** Orphan GC: deletes storage objects for upload intents that were issued but
 * never completed (client abandoned the upload / browser died). */
export const cleanupExpiredPendingUploads = async () => {
    const expiredBefore = subHours(new Date(), 1)
    const startedAt = new Date()
    try {
        const expired = await prisma.upload.findMany({
            where: {
                status: UploadStatus.PENDING,
                messageId: null,
                uploadedAt: { lte: expiredBefore },
            },
            select: {
                id: true,
                storageProvider: true,
                storageKey: true,
                publicId: true,
                mimeType: true,
            },
        })

        const results = await Promise.allSettled(
            expired.map((upload) => deleteStoredObject(upload)),
        )
        const deletableIds = expired
            .filter((_, index) => results[index]?.status === "fulfilled")
            .map((upload) => upload.id)

        if (deletableIds.length > 0) {
            await prisma.upload.deleteMany({
                where: { id: { in: deletableIds } },
            })
        }

        const finishedAt = new Date();
        loggers.audit.info("CRON_CLEANUP_EXPIRED_PENDING_UPLOADS", {
            action: "CRON_CLEANUP_EXPIRED_PENDING_UPLOADS",
            status: "SUCESS",
            startedAt,
            expiredUploads: expired.length,
            deletedUploads: deletableIds.length,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
        });
    } catch (error) {
        const finishedAt = new Date()
        loggers.audit.error("CRON_CLEANUP_EXPIRED_PENDING_UPLOADS", {
            action: "CRON_CLEANUP_EXPIRED_PENDING_UPLOADS",
            status: "FAILED",
            startedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
            error: error instanceof Error ? error.message : String(error),
        })
        throw error
    }
}