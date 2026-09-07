import { fType } from "../../../generated/prisma/enums"
import { prisma } from "../../config/prisma"

class UploadRepository {

    async uploadAttachement(attachments: {
        url: string,
        filename: string
        publicId: string,
        mimeType: string,
        fileSize: number,
        fileType: fType,
        uploaderId :string

    }[]) {
        const uploads = await prisma.upload.createManyAndReturn({
            data: attachments,
            select: {
                id: true,
                url: true,
                filename: true,
                mimeType: true,
                fileSize: true,
                fileType: true,
                publicId:true
                
            }

        }
        )
        return uploads
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
        const deletedAttachments = await prisma.upload.deleteMany({
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
