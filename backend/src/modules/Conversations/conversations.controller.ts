import { StatusCodes } from "http-status-codes";
import { reqUserSchema } from "../../db/auth-schema";
import { createDMSchema, createGDMSchema, MessageSchema, GDMMembers, renameGroupName, wsConversationIdSchema } from "../../db/conversation.schema";
import { asyncHandler } from "../../utility/errorHandling/asyncHandler";
import { UserInputValidationError } from "../../utility/errorHandling/customErrors";
import { loggers } from "../../utility/logger/serviceLoggers";
import { conversationService } from "./conversations.service";
import { ApiResponse } from "../../utility/ApiResponse/ApiResponse";
import { idSchema } from "../../db/workspace";
import { emojiSchema, getMessagesSchema, messageSchema } from "../../db/message.schema";
import { conversationRepository } from "./conversations.repository";


export const createDM = asyncHandler(async (req, res) => {

    const receiver = createDMSchema.safeParse(req.body)
    const user = reqUserSchema.safeParse(req.user)
    const workspace = idSchema.safeParse(req.params)
    if (!user.success) throw new UserInputValidationError("Invalid Token", user.error.flatten().fieldErrors)
    if (!receiver.success) throw new UserInputValidationError("Invalid Input", receiver.error.flatten().fieldErrors)
    if (!workspace.success) throw new UserInputValidationError("Invalid Input", workspace.error.flatten().fieldErrors)



    const dm = await conversationService.createDM(user.data.userId, receiver.data.receiverId, receiver.data.idempotencyKey, workspace.data.id)
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
    const workspace = idSchema.safeParse(req.params)
    const user = reqUserSchema.safeParse(req.user)
    if (!user.success) throw new UserInputValidationError("Invalid Token", user.error.flatten().fieldErrors)
    if (!workspace.success) throw new UserInputValidationError("Invalid Token", workspace.error.flatten().fieldErrors)

    const conversations = await conversationService.getConversations(user.data.userId, workspace.data.id)

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
    const conversation = wsConversationIdSchema.safeParse(req.params)
    const user = reqUserSchema.safeParse(req.user)
    const messageBody = messageSchema.safeParse(req.body)
    const attachments = (req.files as Express.Multer.File[]) ?? [];

    if (!user.success) throw new UserInputValidationError("Invalid Token", user.error.flatten().fieldErrors)
    if (!conversation.success) throw new UserInputValidationError("Invalid Input", conversation.error.flatten().fieldErrors)
    if (!messageBody.success) throw new UserInputValidationError("Invalid Input", messageBody.error.flatten().fieldErrors)



    const message = await conversationService.postMessage(conversation.data.workspaceId, conversation.data.conversationId, user.data.userId, messageBody.data.content, attachments)
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
    const conversation = wsConversationIdSchema.safeParse(req.params)
    const user = reqUserSchema.safeParse(req.user)

    if (!user.success) throw new UserInputValidationError("Invalid Token", user.error.flatten().fieldErrors)
    if (!conversation.success) throw new UserInputValidationError("Invalid Input", conversation.error.flatten().fieldErrors)


    const convo = await conversationService.getConversation(conversation.data.workspaceId, conversation.data.conversationId, user.data.userId)
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
    const conversation =wsConversationIdSchema.safeParse(req.params)
    const user = reqUserSchema.safeParse(req.user)
    const Pagination = getMessagesSchema.safeParse(req.query)
    if (!user.success) throw new UserInputValidationError("Invalid Input", user.error.flatten().fieldErrors)
    if (!Pagination.success) throw new UserInputValidationError("Invalid Input", Pagination.error.flatten().fieldErrors)
    if (!conversation.success) throw new UserInputValidationError("Invalid Input", conversation.error.flatten().fieldErrors)




    const messages = await conversationService.getMessages(conversation.data.workspaceId, conversation.data.conversationId, user.data.userId, Pagination.data)
    loggers.db.info("Messages Fetched Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        conversationId: conversation.data.conversationId,
        fetchedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, messages, "Messages fetched sucessfully"))
})

export const editMessage = asyncHandler(async (req, res) => {
    const editMessageParams = MessageSchema.safeParse(req.params)
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
    const postReplyParams = MessageSchema.safeParse(req.params)
    const user = reqUserSchema.safeParse(req.user)
    const updatedContent = messageSchema.safeParse(req.body)
    const attachments = (req.files as Express.Multer.File[]) ?? [];
    if (!user.success) throw new UserInputValidationError("Invalid Input", user.error.flatten().fieldErrors)
    if (!postReplyParams.success) throw new UserInputValidationError("Invalid Input", postReplyParams.error.flatten().fieldErrors)
    if (!updatedContent.success) throw new UserInputValidationError("Invalid Input", updatedContent.error.flatten().fieldErrors)



    const reply = await conversationService.postReply(user.data.userId, postReplyParams.data, updatedContent.data.content, attachments)
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
    const postReplyParams = MessageSchema.safeParse(req.params)
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


export const renameGDM = asyncHandler(async (req, res) => {
    const gdm = renameGroupName.safeParse(req.body)
    const user = reqUserSchema.safeParse(req.user)
    const conversation = wsConversationIdSchema.safeParse(req.params)

    if (!gdm.success) throw new UserInputValidationError("Invalid Input", gdm.error.flatten().fieldErrors);
    if (!user.success) throw new UserInputValidationError("Invalid Input", user.error.flatten().fieldErrors);
    if (!conversation.success) throw new UserInputValidationError("Invalid Input", conversation.error.flatten().fieldErrors);

    const newGDM = await conversationService.renameGDM(gdm.data.groupName, user.data.userId, conversation.data.conversationId, conversation.data.workspaceId)

    loggers.db.info("GDM Renamed Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        gdmId: newGDM?.id,
        editedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, newGDM ?? {}, "GDM Renamed sucessfully"))

})

export const addMembers = asyncHandler(async (req, res) => {
    const conversation = wsConversationIdSchema.safeParse(req.params)
    const user = reqUserSchema.safeParse(req.user)
    const members = GDMMembers.safeParse(req.body)

    if (!conversation.success) throw new UserInputValidationError("Invalid Input", conversation.error.flatten().fieldErrors);
    if (!user.success) throw new UserInputValidationError("Invalid Input", user.error.flatten().fieldErrors);
    if (!members.success) throw new UserInputValidationError("Invalid Input", members.error.flatten().fieldErrors);

    const updatedGDM = await conversationService.addMembers(members.data.memberIds, user.data.userId, conversation.data)

    loggers.db.info("GDM member added Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        editedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, updatedGDM ?? {}, "GDM member added sucessfully"))



})

export const removeMembers = asyncHandler(async (req, res) => {
    const conversation = wsConversationIdSchema.safeParse(req.params)
    const members = GDMMembers.safeParse(req.body)
    const user = reqUserSchema.safeParse(req.user)

    if (!conversation.success) throw new UserInputValidationError("Invalid Input", conversation.error.flatten().fieldErrors);
    if (!members.success) throw new UserInputValidationError("Invalid Input", members.error.flatten().fieldErrors);
    if (!user.success) throw new UserInputValidationError("Invalid Input", user.error.flatten().fieldErrors);

    await conversationService.deleteMembers(members.data.memberIds, user.data.userId, conversation.data)
    loggers.db.info("GDM member removed Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        editedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.NO_CONTENT).json(new ApiResponse(StatusCodes.NO_CONTENT, {}, "GDM member removed sucessfully"))


})

export const leaveGroup = asyncHandler(async (req, res) => {
    const conversation = wsConversationIdSchema.safeParse(req.params)
    const user = reqUserSchema.safeParse(req.user)

    if (!conversation.success) throw new UserInputValidationError("Invalid Input", conversation.error.flatten().fieldErrors);
    if (!user.success) throw new UserInputValidationError("Invalid Input", user.error.flatten().fieldErrors);


    await conversationService.leaveGroup(user.data.userId, conversation.data)

    loggers.db.info("Group leaved Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        editedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.NO_CONTENT).json(new ApiResponse(StatusCodes.NO_CONTENT, {}, "Group leaved sucessfully"))


})

export const deleteMessage = asyncHandler(async(req,res)=>{
 const conversation = MessageSchema.safeParse(req.params)
    const user = reqUserSchema.safeParse(req.user)

    if (!conversation.success) throw new UserInputValidationError("Invalid Input", conversation.error.flatten().fieldErrors);
    if (!user.success) throw new UserInputValidationError("Invalid Input", user.error.flatten().fieldErrors);

    const message = await conversationService.deleteMessage(user.data.userId,conversation.data.workspaceId,conversation.data.messageId,conversation.data.conversationId)

 loggers.db.info("Message deleted Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        editedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.NO_CONTENT).json(new ApiResponse(StatusCodes.NO_CONTENT, message ?? {}, "Message Deleted sucessfully"))


})