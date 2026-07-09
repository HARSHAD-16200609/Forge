import { fType } from "../../../generated/prisma/enums"
import { prisma } from "../../config/prisma"
import { deleteAttachment } from "./message.controller"

class UploadRepository {

    async uploadAttachement(attachments: {
        messageId: string,
        url: string,
        filename: string
        publicId: string,
        mimeType: string,
        fileSize: number,
        fileType: fType
    }[]) {
        const upload = await prisma.upload.createMany({
            data: attachments
        }
        )
    }
    async deleteAttachments(uploadIds: string[]) {
        await prisma.upload.updateMany({
            where: {
                id: {
                    in: uploadIds
                },
                deletedAt: null
            }, data: {
                deletedAt: new Date()
            }
        })
    }
    async hardDeleteAttachments(uploadIds: string[]) {
       const deletedAttachments =  await prisma.upload.deleteMany({
            where: {
                id: {
                    in: uploadIds
                }
            }
        })
        return deletedAttachments
    }
}


export const uploadRepository = new UploadRepository()
