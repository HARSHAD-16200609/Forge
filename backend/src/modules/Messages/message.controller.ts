import { StatusCodes } from "http-status-codes";
import { ChannelParamsSchema, ConversationParamsSchema } from "../../db/channel.schema";
import { delUploadParamsSchema, emojiSchema, getMessagesSchema, messageSchema } from "../../db/message.schema";
import { asyncHandler } from "../../utility/errorHandling/asyncHandler";
import { UserInputValidationError } from "../../utility/errorHandling/customErrors";
import { loggers } from "../../utility/logger/serviceLoggers";
import { messageService } from "./message.service";
import { ApiResponse } from "../../utility/ApiResponse/ApiResponse";
import { reqUserSchema } from "../../db/auth-schema";
import { idSchema } from "../../db/workspace";
import { uploadService } from "./upload.service";
import { id } from "zod/v4/locales";


export const postMessage = asyncHandler(async (req, res) => {
    const Channel = ChannelParamsSchema.safeParse(req.params)
    const Message = messageSchema.safeParse(req.body)
    const User = reqUserSchema.safeParse(req.user)
    const attachments = (req.files as Express.Multer.File[]) ?? [];

    if (!Channel.success) throw new UserInputValidationError("Invalid Input", Channel.error.flatten().fieldErrors)
    if (!Message.success) throw new UserInputValidationError("Invalid Input", Message.error.flatten().fieldErrors)
    if (!User.success) throw new UserInputValidationError("Invalid Input", User.error.flatten().fieldErrors)


    const message = await messageService.postMessage(Channel.data, Message.data.content, User.data, attachments)

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
export const getConvoMessages = asyncHandler(async (req, res) => {
    const Conversation = ConversationParamsSchema.safeParse(req.params)
    const User = reqUserSchema.safeParse(req.user)
    const Pagination = getMessagesSchema.safeParse(req.query)
    if (!Conversation.success) throw new UserInputValidationError("Invalid Input", Conversation.error.flatten().fieldErrors)
    if (!User.success) throw new UserInputValidationError("Invalid Input", User.error.flatten().fieldErrors)
    if (!Pagination.success) throw new UserInputValidationError("Invalid Input", Pagination.error.flatten().fieldErrors)



    const messages = await messageService.getConvoMessages(Conversation.data, User.data, Pagination.data)
    loggers.db.info("Messages Fetched Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        channelId: Conversation.data.conversationId,
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


export const editMessage = asyncHandler(async (req, res) => {
    const MessageId = idSchema.safeParse(req.params)
    const User = reqUserSchema.safeParse(req.user)
    const Message = messageSchema.safeParse(req.body)
    if (!MessageId.success) throw new UserInputValidationError("Invalid Input", MessageId.error.flatten().fieldErrors);
    if (!User.success) throw new UserInputValidationError("Invalid Input", User.error.flatten().fieldErrors)
    if (!Message.success) throw new UserInputValidationError("Invalid Input", Message.error.flatten().fieldErrors)

    const editedMessage = await messageService.editMessage(Message.data.content, User.data.userId, MessageId.data.id)
    loggers.db.info("Message edited Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        messageId: MessageId.data.id,
        editedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, editedMessage, "Message edited sucessfully"))

})


export const deleteMessage = asyncHandler(async (req, res) => {
    const MessageId = idSchema.safeParse(req.params)
    const User = reqUserSchema.safeParse(req.user)
    if (!MessageId.success) throw new UserInputValidationError("Invalid Input", MessageId.error.flatten().fieldErrors);
    if (!User.success) throw new UserInputValidationError("Invalid Input", User.error.flatten().fieldErrors)


    await messageService.deleteMessage(User.data.userId, MessageId.data.id)
    loggers.db.info("Message deleted Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        messageId: MessageId.data.id,
        deletedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.NO_CONTENT).json(new ApiResponse(StatusCodes.NO_CONTENT, {}, "Message deleted sucessfully"))

})

export const postReply = asyncHandler(async (req, res) => {
    const MessageId = idSchema.safeParse(req.params)
    const User = reqUserSchema.safeParse(req.user)
    const Message = messageSchema.safeParse(req.body)
    if (!MessageId.success) throw new UserInputValidationError("Invalid Input", MessageId.error.flatten().fieldErrors);
    if (!User.success) throw new UserInputValidationError("Invalid Input", User.error.flatten().fieldErrors)
    if (!Message.success) throw new UserInputValidationError("Invalid Input", Message.error.flatten().fieldErrors)

    const reply = await messageService.postReply(User.data.userId, MessageId.data.id, Message.data.content)

    loggers.db.info("Replied to the message Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        messageId: MessageId.data.id,
        repliedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, reply, "Replied to the message sucessfully"))


})

export const postReaction = asyncHandler(async (req, res) => {
    const MessageId = idSchema.safeParse(req.params)
    const User = reqUserSchema.safeParse(req.user)
    const emoji = emojiSchema.safeParse(req.body)

    if (!MessageId.success) throw new UserInputValidationError("Invalid Input", MessageId.error.flatten().fieldErrors);
    if (!User.success) throw new UserInputValidationError("Invalid Input", User.error.flatten().fieldErrors)
    if (!emoji.success) throw new UserInputValidationError("Invalid Input", emoji.error.flatten().fieldErrors)


    const reaction = await messageService.postReaction(User.data.userId, MessageId.data.id, emoji.data.reaction)
    loggers.db.info("Reacted to the message Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        messageId: MessageId.data.id,
        reactedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, reaction, "Reacted to the message sucessfully"))
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

    res.status(StatusCodes.NO_CONTENT).json(new ApiResponse(StatusCodes.NO_CONTENT, {}, "Attachments Deleted Sucessfully"))
})