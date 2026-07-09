import { subDays } from "date-fns"
import { prisma } from "../config/prisma"
import { deleteFromCloudinary } from "../config/cloudinary"
import { getResourceType } from "../db/message.schema"
import { loggers } from "../utility/logger/serviceLoggers"
import upload from "../middlewares/multer.midleware"
import { messageRepository } from "../modules/Messages/message.repositoty"
import { uploadRepository } from "../modules/Messages/upload.repository"


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
                    message.uploads.map(upload =>
                        deleteFromCloudinary(
                            upload.publicId,
                            getResourceType(upload.mimeType)
                        )
                    )
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
                publicId: true,
                mimeType: true
            }
        })

        const results = await Promise.allSettled(
            deletedUploads.map((upload) => {
                return deleteFromCloudinary(upload.publicId, getResourceType(upload.mimeType))
            })
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