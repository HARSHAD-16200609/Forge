
import { Prisma } from "../../../generated/prisma/client";
import { uploadOnCloudinary } from "../../config/cloudinary";
import { getFileType, getResourceType } from "../../db/message.schema";
import { ConfilctError } from "../../utility/errorHandling/customErrors";
import { uploadRepository } from "./upload.repository";

class UploadService {
    async uploadAttachments(attachments: Express.Multer.File[]) {

        const uploadedAttachments = await Promise.all(
            attachments.map(async (attachment) => {
                return uploadOnCloudinary(attachment.path, getResourceType(attachment.mimetype))
            })
        )


        if (uploadedAttachments.length === 0) throw new Error("Failed to upload attachments")

        const attachmentData = uploadedAttachments.map((upload, index) => {
            const attachment = attachments[index]!;

            return {
                filename: attachment.originalname,
                url: upload.secure_url,
                publicId: upload.public_id,
                mimeType: attachment.mimetype,
                fileSize: attachment.size,
                fileType: getFileType(attachment.mimetype),
            };
        });

        return attachmentData

    }
}

export const uploadService = new UploadService()