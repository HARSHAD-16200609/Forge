import { StatusCodes } from "http-status-codes";
import { ChannelParamsSchema } from "../../db/channel.schema";
import { getMessagesSchema, messageSchema } from "../../db/message.schema";
import { asyncHandler } from "../../utility/errorHandling/asyncHandler";
import { UserInputValidationError } from "../../utility/errorHandling/customErrors";
import { loggers } from "../../utility/logger/serviceLoggers";
import { messageService } from "./message.service";
import { ApiResponse } from "../../utility/ApiResponse/ApiResponse";
import { reqUserSchema } from "../../db/auth-schema";

export const postMessage = asyncHandler(async (req, res) => {
    const Channel = ChannelParamsSchema.safeParse(req.params)
    const Message = messageSchema.safeParse(req.body)
    const User = reqUserSchema.safeParse(req.user)

    if (!Channel.success) throw new UserInputValidationError("Invalid Input", Channel.error.flatten().fieldErrors)
    if (!Message.success) throw new UserInputValidationError("Invalid Input", Message.error.flatten().fieldErrors)
    if (!User.success) throw new UserInputValidationError("Invalid Input", User.error.flatten().fieldErrors)


    const message = await messageService.postMessage(Channel.data, Message.data.message.content, User.data)

    loggers.db.info("Message Posted Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        channelId: Channel.data.channelId,
        postedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, message, "Message posted sucessfully"))
})

export const getMessages = asyncHandler(async (req, res) => {
    const Channel = ChannelParamsSchema.safeParse(req.params)
    const User = reqUserSchema.safeParse(req.user)
    const Pagination = getMessagesSchema.safeParse(req.query)
    if (!Channel.success) throw new UserInputValidationError("Invalid Input", Channel.error.flatten().fieldErrors)
    if (!User.success) throw new UserInputValidationError("Invalid Input", User.error.flatten().fieldErrors)
    if (!Pagination.success) throw new UserInputValidationError("Invalid Input", Pagination.error.flatten().fieldErrors)



    const messages = await messageService.getMessages(Channel.data, User.data,Pagination.data)
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






