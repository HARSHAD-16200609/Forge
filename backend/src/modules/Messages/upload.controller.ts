import { StatusCodes } from "http-status-codes";
import { fType } from "../../../generated/prisma/enums";
import { reqUserSchema } from "../../db/auth-schema";
import { ApiResponse } from "../../utility/ApiResponse/ApiResponse";
import { asyncHandler } from "../../utility/errorHandling/asyncHandler";
import { BadRequestError, UnauthorizedAccessError } from "../../utility/errorHandling/customErrors";
import { loggers } from "../../utility/logger/serviceLoggers";
import { uploadService } from "./upload.service";


export const uploadAttachments = asyncHandler(async (req, res) => {
    const user = reqUserSchema.safeParse(req.user)
    if (!user.success) throw new UnauthorizedAccessError("Unauthenticated User , Login First")
    const attachments = (req.files as Express.Multer.File[]) ?? [];;

    if (!attachments || attachments.length === 0) {
        throw new BadRequestError("Please add some Attachments to upload")
    }


    const uploads = await uploadService.uploadAttachments(attachments)

    loggers.audit.info("Files Uploaded Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        uploadedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

     res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED,uploads,"Files Uploaded Sucessfully"))

}
)