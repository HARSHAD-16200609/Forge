import { StatusCodes } from "http-status-codes";
import { reqUserSchema } from "../../db/auth-schema";
import { completeUploadSchema, createUploadIntentsSchema, getWorkspaceFilesSchema, uploadIdParamsSchema, workspaceFilesParamsSchema } from "../../db/message.schema";
import { ApiResponse } from "../../utility/ApiResponse/ApiResponse";
import { asyncHandler } from "../../utility/errorHandling/asyncHandler";
import { BadRequestError, UnauthorizedAccessError, UserInputValidationError } from "../../utility/errorHandling/customErrors";
import { loggers } from "../../utility/logger/serviceLoggers";
import { uploadService } from "./upload.service";


export const uploadAttachments = asyncHandler(async (req, res) => {
    const user = reqUserSchema.safeParse(req.user)
    if (!user.success) throw new UnauthorizedAccessError("Unauthenticated User , Login First")
    const attachments = (req.files as Express.Multer.File[]) ?? [];

    if (!attachments || attachments.length === 0) {
        throw new BadRequestError("Please add some Attachments to upload")
    }


    const uploads = await uploadService.uploadAttachments(attachments, user.data.userId)

    loggers.audit.info("Files Uploaded Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        uploadedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, uploads, "Files Uploaded Sucessfully"))

}
)


export const createUploadIntents = asyncHandler(async (req, res) => {
    const user = reqUserSchema.safeParse(req.user)
    if (!user.success) throw new UnauthorizedAccessError("Unauthenticated User , Login First")

    const body = createUploadIntentsSchema.safeParse(req.body)
    if (!body.success) {
        throw new UserInputValidationError("Invalid upload request", body.error.flatten().fieldErrors)
    }

    const intents = await uploadService.createUploadIntents(body.data, user.data.userId)

    loggers.audit.info("Upload Intents Created", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        fileCount: body.data.files.length,
        createdAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, intents, "Upload intents created"))
})


export const completeUpload = asyncHandler(async (req, res) => {
    const user = reqUserSchema.safeParse(req.user)
    if (!user.success) throw new UnauthorizedAccessError("Unauthenticated User , Login First")

    const params = uploadIdParamsSchema.safeParse(req.params)
    if (!params.success) throw new UserInputValidationError("Invalid Upload ID", params.error.flatten().fieldErrors)

    const body = completeUploadSchema.safeParse(req.body)
    if (!body.success) throw new UserInputValidationError("Invalid completion payload", body.error.flatten().fieldErrors)

    const upload = await uploadService.completeUpload(params.data.uploadId, user.data.userId, body.data)

    loggers.audit.info("Upload Confirmed", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        uploadId: params.data.uploadId,
        confirmedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, upload, "Upload confirmed"))
})


export const getWorkspaceFiles = asyncHandler(async (req, res) => {
    const Params = workspaceFilesParamsSchema.safeParse(req.params)
    const User = reqUserSchema.safeParse(req.user)
    const Pagination = getWorkspaceFilesSchema.safeParse(req.query)
    if (!Params.success) throw new UserInputValidationError("Invalid Input", Params.error.flatten().fieldErrors)
    if (!User.success) throw new UserInputValidationError("Invalid Input", User.error.flatten().fieldErrors)
    if (!Pagination.success) throw new UserInputValidationError("Invalid Input", Pagination.error.flatten().fieldErrors)

    const result = await uploadService.getWorkspaceFiles(Params.data.workspaceId, User.data.userId, Pagination.data)

    loggers.db.info("Workspace Files Fetched Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        fetchedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, result, "Workspace files fetched sucessfully"))
})