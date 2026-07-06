import { fType } from "../../../generated/prisma/enums"
import { prisma } from "../../config/prisma"

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
}


export const uploadRepository = new UploadRepository()
