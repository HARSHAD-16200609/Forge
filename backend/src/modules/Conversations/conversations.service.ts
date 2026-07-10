import { fType } from "../../../generated/prisma/enums"
import { deleteFromCloudinary } from "../../config/cloudinary"
import { getResourceType } from "../../db/message.schema"
import { ConversationMessageDTO, MessageDTO } from "../../types/message"
import { BadGatewayError, BadRequestError, ConfilctError, ForbiddenError, NotFoundError } from "../../utility/errorHandling/customErrors"
import { loggers } from "../../utility/logger/serviceLoggers"
import { authRepository } from "../Auth/auth.repository"
import { messageRepository } from "../Messages/message.repositoty"
import { uploadService } from "../Messages/upload.service"
import { conversationRepository } from "./conversations.repository"

class ConversationService {
    async createDM(senderId: string, receiverId: string) {

        if (senderId === receiverId) throw new BadRequestError("You can't create an Dm with self")
        const receiver = await authRepository.getById(receiverId)
        if (!receiver) throw new NotFoundError("No such User Exist's")
        const existingDM = await conversationRepository.findDMBetweenUsers(senderId, receiverId)

        if (existingDM && existingDM._count.members === 2) return existingDM

        const dm = await conversationRepository.createDM(senderId, receiverId)

        return dm
    }

    async getConversations(userId: string) {

        const conversations = await conversationRepository.getConversations(userId)
        if (conversations.length === 0) throw new NotFoundError("No Conversations Found")
        const conversationList = conversations.map(({ conversation }) => {

            const { members, messages, ...rest } = conversation;
            const receiver = members.filter((member) => member.user.id != userId)[0]?.user
            return {
                lastMessage: {
                    content: messages[0]?.content,
                    sentAt: messages[0]?.sentAt
                },
                ...rest,
                displayName: receiver?.username,
                avatar: receiver?.avatar
            }


        })
        return conversationList
    }

    async postMessage(conversationId: string, userId: string, content: string, attachments: Express.Multer.File[]) {
        const conversation = await conversationRepository.conversationExists(conversationId, userId)
        if (conversation?.userId !== userId) throw new ForbiddenError("You are not allowed to perform this action")
        if (!conversation) throw new NotFoundError("Conversation not Found")

        let attachmentData: {
            filename: string;
            url: string;
            publicId: string;
            mimeType: string;
            fileSize: number;
            fileType: fType;
        }[] = [];
        try {

            if (attachments.length > 0) {
                attachmentData = await uploadService.uploadAttachments(attachments)
            }

            const messageObject: ConversationMessageDTO = {
                conversationId,
                senderId: userId,
                content
            }


            const message = await messageRepository.createMessage(messageObject, attachmentData)

            return message
        } catch (err) {
            if (attachmentData.length > 0) {

                const results = await Promise.allSettled(
                    attachmentData.map((attachment) => {
                        return deleteFromCloudinary(attachment.publicId, getResourceType(attachment.mimeType))
                    })
                )
                const failed = results.filter(
                    (result) => result.status === "rejected"
                );

                if (failed.length > 0) {
                    loggers.audit.error("UPLOAD_ROLLBACK_FAILED", {
                        failedCount: failed.length,
                    });
                }
            }
            throw err

        }
    }
    async getConversation(conversationId: string, userId: string) {
        const conversation = await conversationRepository.conversationExists(conversationId, userId)
        if (conversation?.userId !== userId) throw new ForbiddenError("You are not allowed to perform this action")
        if (!conversation) throw new NotFoundError("Conversation Not Found")

        const convo = await conversationRepository.getConversation(conversationId, userId)


        const { members, messages, ...rest } = convo!.conversation;
        const cursor = messages[messages.length - 1]?.id
        const receiver = members.filter((member) => member.user.id != userId)[0]?.user



        return {
            ...rest,
            displayName: receiver?.username,
            members,
            messages,
            cursor
        }

    }
    async getMessages(conversationId: string, userId: string, pagination: { limit: number, cursor?: string | undefined }) {
        const conversation = await conversationRepository.conversationExists(conversationId, userId)
        if (conversation?.userId !== userId) throw new ForbiddenError("You are not allowed to perform this action")
        if (!conversation) throw new NotFoundError("Conversation Not Found")
        const conversationMessages = await messageRepository.getConversationMessages(conversationId, pagination)
        if (conversationMessages.length === 0) throw new NotFoundError("No Messages Found")
        const hasMore = conversationMessages.length > pagination.limit



        const nextCursor = hasMore ? conversationMessages[conversationMessages.length - 1]?.id : null

        return {
            messages: conversationMessages,
            hasMore,
            nextCursor
        }

    }
    async editMessage(editMessageParams: { conversationId: string, messageId: string }, userId: string, content: string) {
        const conversation = await conversationRepository.conversationExists(editMessageParams.conversationId, userId)
        if (conversation?.userId !== userId) throw new ForbiddenError("You are not allowed to perform this action")
        if (!conversation) throw new NotFoundError("Conversation Not Found")

        const message = await messageRepository.messageExists(editMessageParams.messageId)
        if (!message) throw new NotFoundError("Message Not Found")
            if(message.senderId !== userId) throw new ForbiddenError("You are not allowed to perform this action")

        const editedMessage = await messageRepository.editMessage(content, editMessageParams.messageId)
        return editedMessage
    }
}

export const conversationService = new ConversationService()