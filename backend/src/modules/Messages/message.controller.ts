import { StatusCodes } from "http-status-codes";
import { ChannelParamsSchema } from "../../db/channel.schema";
import { delUploadParamsSchema, getMessagesSchema } from "../../db/message.schema";
import { asyncHandler } from "../../utility/errorHandling/asyncHandler";
import { UserInputValidationError } from "../../utility/errorHandling/customErrors";
import { loggers } from "../../utility/logger/serviceLoggers";
import { messageService } from "./message.service";
import { ApiResponse } from "../../utility/ApiResponse/ApiResponse";
import { reqUserSchema } from "../../db/auth-schema";
import { idSchema } from "../../db/workspace";
import { uploadService } from "./upload.service";


export const getMessages = asyncHandler(async (req, res) => {
    const Channel = ChannelParamsSchema.safeParse(req.params)
    const User = reqUserSchema.safeParse(req.user)
    const Pagination = getMessagesSchema.safeParse(req.query)
    if (!Channel.success) throw new UserInputValidationError("Invalid Input", Channel.error.flatten().fieldErrors)
    if (!User.success) throw new UserInputValidationError("Invalid Input", User.error.flatten().fieldErrors)
    if (!Pagination.success) throw new UserInputValidationError("Invalid Input", Pagination.error.flatten().fieldErrors)



    const messages = await messageService.getMessages(Channel.data, User.data, Pagination.data)
    loggers.db.info("Messages Fetched Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        channelId: Channel.data.channelId,
        fetchedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, messages, "Messages fetched sucessfully"))
})


export const getMessage = asyncHandler(async (req, res) => {

    const MessageId = idSchema.safeParse(req.params)
    const User = reqUserSchema.safeParse(req.user)
    if (!MessageId.success) throw new UserInputValidationError("Invalid Input", MessageId.error.flatten().fieldErrors);
    if (!User.success) throw new UserInputValidationError("Invalid Input", User.error.flatten().fieldErrors)

    const message = await messageService.getMessage(MessageId.data.id, User.data.userId)

    loggers.db.info("Message Fetched Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        messageId: MessageId.data.id,
        fetchedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, message, "Message fetched sucessfully"))
})


export const deleteAttachment = asyncHandler(async (req, res) => {
    const Upload = delUploadParamsSchema.safeParse(req.body)
    const Message = idSchema.safeParse(req.params)
    const User = reqUserSchema.safeParse(req.user)

    if (!Upload.success) throw new UserInputValidationError("Invalid Input", Upload.error.flatten().fieldErrors);
    if (!User.success) throw new UserInputValidationError("Invalid Input", User.error.flatten().fieldErrors)
    if (!Message.success) throw new UserInputValidationError("Invalid Input", Message.error.flatten().fieldErrors)


    await uploadService.deleteAttachments(Message.data.id, Upload.data.uploads, User.data.userId)

    loggers.db.info("Attachments Deleted Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        messageId: Message.data.id,
        deletedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.NO_CONTENT).json(new ApiResponse(StatusCodes.NO_CONTENT,{},"Attachments Deleted Sucessfully"))
})