import { StatusCodes } from "http-status-codes";
import { reqUserSchema } from "../../db/auth-schema";
import { createDMSchema, createGDMSchema, editMessageSchema } from "../../db/conversation.schema";
import { asyncHandler } from "../../utility/errorHandling/asyncHandler";
import { UserInputValidationError } from "../../utility/errorHandling/customErrors";
import { loggers } from "../../utility/logger/serviceLoggers";
import { conversationService } from "./conversations.service";
import { ApiResponse } from "../../utility/ApiResponse/ApiResponse";
import { idSchema } from "../../db/workspace";
import { delUploadParamsSchema, emojiSchema, getMessagesSchema, messageSchema } from "../../db/message.schema";
import { uploadService } from "../Messages/upload.service";

export const createDM = asyncHandler(async (req, res) => {

    const receiver = createDMSchema.safeParse(req.body)
    const user = reqUserSchema.safeParse(req.user)
    if (!user.success) throw new UserInputValidationError("Invalid Token", user.error.flatten().fieldErrors)
    if (!receiver.success) throw new UserInputValidationError("Invalid Input", receiver.error.flatten().fieldErrors)

    const dm = await conversationService.createDM(user.data.userId, receiver.data.receiverId,receiver.data.idempotencyKey)
    loggers.db.info("DM created SucessFully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        converastionId: dm.id,
        createdAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, dm, "DM created Sucessfully"))

})

export const getConversations = asyncHandler(async (req, res) => {
    const user = reqUserSchema.safeParse(req.user)
    if (!user.success) throw new UserInputValidationError("Invalid Token", user.error.flatten().fieldErrors)
    const conversations = await conversationService.getConversations(user.data.userId)

    loggers.db.info("Conversations Fetched SucessFully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        UserId: user.data.userId,
        FetchedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, { conversations }, "Conversations Fetched Sucessfully"))


})

export const postMessage = asyncHandler(async (req, res) => {
    const conversation = idSchema.safeParse(req.params)
    const user = reqUserSchema.safeParse(req.user)
    const messageBody = messageSchema.safeParse(req.body)
    const attachments = (req.files as Express.Multer.File[]) ?? [];

    if (!user.success) throw new UserInputValidationError("Invalid Token", user.error.flatten().fieldErrors)
    if (!conversation.success) throw new UserInputValidationError("Invalid Input", conversation.error.flatten().fieldErrors)
    if (!messageBody.success) throw new UserInputValidationError("Invalid Input", messageBody.error.flatten().fieldErrors)



    const message = await conversationService.postMessage(conversation.data.id, user.data.userId, messageBody.data.content, attachments)
    loggers.db.info("Message sent Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        senderId: user.data.userId,
        sentAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, message, "Message Sent Sucessfully"))

})

export const getConversation = asyncHandler(async (req, res) => {
    const conversation = idSchema.safeParse(req.params)
    const user = reqUserSchema.safeParse(req.user)

    if (!user.success) throw new UserInputValidationError("Invalid Token", user.error.flatten().fieldErrors)
    if (!conversation.success) throw new UserInputValidationError("Invalid Input", conversation.error.flatten().fieldErrors)


    const convo = await conversationService.getConversation(conversation.data.id, user.data.userId)
    loggers.db.info("Conversation Fetched SucessFully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        userId: user.data.userId,
        fetchedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, convo, "Conversation Fetched SucessFully"))

})

export const getMessages = asyncHandler(async (req, res) => {
    const user = reqUserSchema.safeParse(req.user)
    const Pagination = getMessagesSchema.safeParse(req.query)
    const conversation = idSchema.safeParse(req.params)
    if (!user.success) throw new UserInputValidationError("Invalid Input", user.error.flatten().fieldErrors)
    if (!Pagination.success) throw new UserInputValidationError("Invalid Input", Pagination.error.flatten().fieldErrors)
    if (!conversation.success) throw new UserInputValidationError("Invalid Input", conversation.error.flatten().fieldErrors)




    const messages = await conversationService.getMessages(conversation.data.id, user.data.userId, Pagination.data)
    loggers.db.info("Messages Fetched Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        conversationId: conversation.data.id,
        fetchedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, messages, "Messages fetched sucessfully"))
})

export const editMessage = asyncHandler(async (req, res) => {
    const editMessageParams = editMessageSchema.safeParse(req.params)
    const user = reqUserSchema.safeParse(req.user)
    const updatedContent = messageSchema.safeParse(req.body)
    if (!user.success) throw new UserInputValidationError("Invalid Input", user.error.flatten().fieldErrors)
    if (!editMessageParams.success) throw new UserInputValidationError("Invalid Input", editMessageParams.error.flatten().fieldErrors)
    if (!updatedContent.success) throw new UserInputValidationError("Invalid Input", updatedContent.error.flatten().fieldErrors)



    const editedMessage = await conversationService.editMessage(editMessageParams.data, user.data.userId, updatedContent.data.content)
    loggers.db.info("Messages Edited Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        messageId: editMessageParams.data.messageId,
        editedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, editedMessage, "Messages Edited sucessfully"))

})

export const postReply = asyncHandler(async (req, res) => {
    const postReplyParams = editMessageSchema.safeParse(req.params)
    const user = reqUserSchema.safeParse(req.user)
    const updatedContent = messageSchema.safeParse(req.body)
    if (!user.success) throw new UserInputValidationError("Invalid Input", user.error.flatten().fieldErrors)
    if (!postReplyParams.success) throw new UserInputValidationError("Invalid Input", postReplyParams.error.flatten().fieldErrors)
    if (!updatedContent.success) throw new UserInputValidationError("Invalid Input", updatedContent.error.flatten().fieldErrors)



    const reply = await conversationService.postReply(user.data.userId, postReplyParams.data, updatedContent.data.content)
    loggers.db.info("Messages replied Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        messageId: postReplyParams.data.messageId,
        repliedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, reply, "Messages replied sucessfully"))
})

export const postReaction = asyncHandler(async (req, res) => {
    const postReplyParams = editMessageSchema.safeParse(req.params)
    const User = reqUserSchema.safeParse(req.user)
    const emoji = emojiSchema.safeParse(req.body)

    if (!postReplyParams.success) throw new UserInputValidationError("Invalid Input", postReplyParams.error.flatten().fieldErrors);
    if (!User.success) throw new UserInputValidationError("Invalid Input", User.error.flatten().fieldErrors)
    if (!emoji.success) throw new UserInputValidationError("Invalid Input", emoji.error.flatten().fieldErrors)


    const reaction = await conversationService.postReaction(User.data.userId, postReplyParams.data, emoji.data.reaction)
    loggers.db.info("Reacted to the message Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        messageId: postReplyParams.data.messageId,
        reactedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, reaction, "Reacted to the message sucessfully"))
})


export const createGDM = asyncHandler(async (req, res) => {
    const gdm = createGDMSchema.safeParse(req.body)
    const user = reqUserSchema.safeParse(req.user)
    const workspace = idSchema.safeParse(req.params)
    if (!gdm.success) throw new UserInputValidationError("Invalid Input", gdm.error.flatten().fieldErrors);
    if (!user.success) throw new UserInputValidationError("Invalid Input", user.error.flatten().fieldErrors);
    if (!workspace.success) throw new UserInputValidationError("Invalid Input", workspace.error.flatten().fieldErrors);

    const groupDM = await conversationService.createGDM(gdm.data, user.data.userId, workspace.data.id)

    loggers.db.info("GDM created Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        gdmId: groupDM?.id,
        reactedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, groupDM ?? {}, "GDM created sucessfully"))

})