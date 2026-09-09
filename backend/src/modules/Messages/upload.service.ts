
import { fType, Prisma } from "../../../generated/prisma/client";
import { deleteFromCloudinary, uploadOnCloudinary } from "../../config/cloudinary";
import { getFileType, getResourceType } from "../../db/message.schema";
import { ConfilctError, ForbiddenError, NotFoundError } from "../../utility/errorHandling/customErrors";
import { loggers } from "../../utility/logger/serviceLoggers";
import { messageRepository } from "./message.repository";
import { messageService } from "./message.service";
import { uploadRepository } from "./upload.repository";

class UploadService {
    async uploadAttachments(attachments: Express.Multer.File[], userId: string) {
        let attachmentData: {
            filename: string;
            url: string;
            publicId: string;
            mimeType: string;
            fileSize: number;
            fileType: fType;
            uploaderId: string;
        }[] = [];
        try {
            const uploadedAttachments = await Promise.all(
                attachments.map(async (attachment) => {
                    return uploadOnCloudinary(attachment.path, getResourceType(attachment.mimetype))
                })
            )


            if (uploadedAttachments.length === 0) throw new Error("Failed to upload attachments")

            attachmentData = uploadedAttachments.map((upload, index) => {
                const attachment = attachments[index]!;

                return {
                    filename: attachment.originalname,
                    url: upload.secure_url,
                    publicId: upload.public_id,
                    mimeType: attachment.mimetype,
                    fileSize: attachment.size,
                    fileType: getFileType(attachment.mimetype),
                    uploaderId: userId

                };
            });
            const uploads = uploadRepository.uploadAttachement(attachmentData)

            return uploads
        } catch (error) {
            if (attachmentData.length > 0) {

                const results = await Promise.allSettled(
                    attachmentData.map((attachment) => {
                        return deleteFromCloudinary(attachment.publicId, getResourceType(attachment.mimeType))
                    })
                )
                const failed = results.filter(
                    (result) => result.status === "rejected"
                );

                if (failed.length > 0) {
                    loggers.audit.error("UPLOAD_ROLLBACK_FAILED", {
                        failedCount: failed.length,
                    });
                }
            }
            throw error
        }

    }
    async deleteAttachments(messageId: string, uploads: string[], userId: string) {
        const uploadsToBEDeleted = await messageRepository.getMessageUploads(messageId, uploads)
        if (!uploadsToBEDeleted) throw new NotFoundError("No Uploads Found")
        if (uploadsToBEDeleted.senderId !== userId) throw new ForbiddenError("You are not allowed to perform this action")

        try {
            await uploadRepository.deleteAttachments(uploadsToBEDeleted.uploads.flatMap((upload) => upload.id))
        }
        catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
                throw new ConfilctError("Resource Already Deleted")
            }
            throw err
        }

        return




    }
}



export const uploadService = new UploadService()