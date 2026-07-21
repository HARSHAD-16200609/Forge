import { Prisma } from "../../../generated/prisma/client"
import { ConvoType, fType } from "../../../generated/prisma/enums"
import { deleteFromCloudinary } from "../../config/cloudinary"
import { getResourceType } from "../../db/message.schema"
import { ConversationMessageDTO, MessageDTO } from "../../types/message"
import { BadGatewayError, BadRequestError, ConfilctError, ForbiddenError, NotFoundError } from "../../utility/errorHandling/customErrors"
import { loggers } from "../../utility/logger/serviceLoggers"
import { authRepository } from "../Auth/auth.repository"
import { messageRepository } from "../Messages/message.repositoty"
import { uploadService } from "../Messages/upload.service"
import { workspaceRepository } from "../Workspace/workspace.repository"
import { conversationRepository } from "./conversations.repository"

class ConversationService {
    async createDM(senderId: string, receiverId: string, idempotencyKey: string, workspaceId: string) {
        const workspaceMember = await workspaceRepository.memberExists(senderId, workspaceId)
        const receiverWsMember = await workspaceRepository.memberExists(receiverId, workspaceId)

        if (!receiverWsMember) throw new ForbiddenError("Can't create Dm with user form another workspace")

        if (!workspaceMember) throw new ForbiddenError("You are not an member of this Workspace")
        if (senderId === receiverId) throw new BadRequestError("You can't create an Dm with self")
        const receiver = await authRepository.getById(receiverId)
        if (!receiver) throw new NotFoundError("No such User Exist's")
        const existingDM = await conversationRepository.findDMBetweenUsers(senderId, receiverId)

        if (existingDM && existingDM._count.members === 2) return existingDM

        const dm = await conversationRepository.createDM(senderId, receiverId, idempotencyKey, workspaceId)

        return dm
    }

    async getConversations(userId: string, workspaceId: string) {
        const workspaceMember = await workspaceRepository.memberExists(userId, workspaceId)

        if (!workspaceMember) throw new ForbiddenError("You are not an member of this Workspace")
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

    async postMessage(workspaceId: string, conversationId: string, userId: string, content: string, attachments: Express.Multer.File[]) {
        const workspaceMember = await workspaceRepository.memberExists(userId, workspaceId)

        if (!workspaceMember) throw new ForbiddenError("You are not an member of this Workspace")
        const conversation = await conversationRepository.conversationExists(conversationId, userId)
        if (!conversation) throw new NotFoundError("Conversation not Found")
        if (conversation.userId !== userId) throw new ForbiddenError("You are not allowed to perform this action")

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
    async getConversation(workspaceId: string, conversationId: string, userId: string) {
        const workspaceMember = await workspaceRepository.memberExists(userId, workspaceId)

        if (!workspaceMember) throw new ForbiddenError("You are not an member of this Workspace")
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
    async getMessages(workspaceId: string, conversationId: string, userId: string, pagination: { limit: number, cursor?: string | undefined }) {
        const workspaceMember = await workspaceRepository.memberExists(userId, workspaceId)

        if (!workspaceMember) throw new ForbiddenError("You are not an member of this Workspace")
        const conversation = await conversationRepository.conversationExists(conversationId, userId)
        if (!conversation) throw new NotFoundError("Conversation Not Found")
        if (conversation.userId !== userId) throw new ForbiddenError("You are not allowed to perform this action")
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
    async editMessage(editMessageParams: { conversationId: string, messageId: string, workspaceId: string }, userId: string, content: string) {
        const workspaceMember = await workspaceRepository.memberExists(userId, editMessageParams.workspaceId)

        if (!workspaceMember) throw new ForbiddenError("You are not an member of this Workspace")
        const conversation = await conversationRepository.conversationExists(editMessageParams.conversationId, userId)
        if (!conversation) throw new NotFoundError("Conversation Not Found")
        if (conversation.userId !== userId) throw new ForbiddenError("You are not allowed to perform this action")

        const message = await messageRepository.messageExists(editMessageParams.messageId)
        if (!message) throw new NotFoundError("Message Not Found")
        if (!message.conversationId) {
            throw new BadRequestError("Message does not belong to a conversation");
        }

        if (message.conversationId !== editMessageParams.conversationId) {
            throw new BadRequestError(
                "Message does not belong to the specified conversation"
            );
        }
        if (message.senderId !== userId) throw new ForbiddenError("You are not allowed to perform this action")

        const editedMessage = await messageRepository.editMessage(content, editMessageParams.messageId)
        return editedMessage
    }
    async postReply(userId: string, postReplyParams: { conversationId: string, messageId: string, workspaceId: string }, content: string) {
        const workspaceMember = await workspaceRepository.memberExists(userId, postReplyParams.workspaceId)

        if (!workspaceMember) throw new ForbiddenError("You are not an member of this Workspace")
        const conversation = await conversationRepository.conversationExists(postReplyParams.conversationId, userId)
        if (!conversation) throw new NotFoundError("Conversation Not Found")
        const message = await messageRepository.messageExists(postReplyParams.messageId)
        if (!message) {
            throw new NotFoundError("Message not found");
        }

        if (!message.conversationId) {
            throw new BadRequestError("Message does not belong to a conversation");
        }

        if (message.conversationId !== postReplyParams.conversationId) {
            throw new BadRequestError(
                "Message does not belong to the specified conversation"
            );
        }

        const messageObject: ConversationMessageDTO = {
            conversationId: message.conversationId,
            senderId: userId,
            content
        }

        const reply = await messageRepository.createReply(messageObject, postReplyParams.messageId)
        if (reply === undefined) throw new BadRequestError("Invalid ParentMsgId")

        return reply


    }
    async postReaction(userId: string, postReactionParams: { messageId: string, conversationId: string, workspaceId: string }, emoji: string) {
        const workspaceMember = await workspaceRepository.memberExists(userId, postReactionParams.workspaceId)

        if (!workspaceMember) throw new ForbiddenError("You are not an member of this Workspace")
        const conversation = await conversationRepository.conversationExists(postReactionParams.conversationId, userId)
        if (!conversation) throw new NotFoundError("Conversation Not Found")
        const message = await messageRepository.messageExists(postReactionParams.messageId)
        if (!message) {
            throw new NotFoundError("Message not found");
        }
        if (message.deletedAt) throw new BadRequestError("Can't React to Deleted Message")


        const reactionExists = await messageRepository.reactionExists(userId, postReactionParams.messageId)
        let reaction
        if (reactionExists) {
            if (reactionExists.emoji === emoji) {

                await messageRepository.toggleReaction(userId, postReactionParams.messageId, emoji)
                return {
                    action: "deleted",
                    data: {}
                }
            } else {
                console.log("New Reaction posted")
                reaction = await messageRepository.addReaction(userId, postReactionParams.messageId, emoji)
                return {
                    action: "posted",
                    data: reaction
                }

            }
        }
        reaction = await messageRepository.addReaction(userId, postReactionParams.messageId, emoji)
        return {
            action: "posted",
            data: reaction
        }
    }

    async createGDM(gdm: { memberIds: string[], name: string, idempotencyKey: string }, userId: string, workspaceId: string) {
        const workspaceMember = await workspaceRepository.memberExists(userId, workspaceId)

        if (!workspaceMember) throw new ForbiddenError("You are not an member of this Workspace")
        const members = await workspaceRepository.getWorkspaceMembers(gdm.memberIds, workspaceId)
        if (members.length !== gdm.memberIds.length) throw new BadRequestError("One or more users are not members of the workspace.")
        const existing = await conversationRepository.getGDMByKey(gdm.idempotencyKey)

        if (existing) throw new ConfilctError("Group already exists")


        const gdmMembers = [...new Set([...gdm.memberIds, userId])].map((userId) => ({ userId }))

        try {
            return await conversationRepository.createGDM(gdm.name, gdmMembers, gdm.idempotencyKey, workspaceId)
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")
                return conversationRepository.getGDMByKey(gdm.idempotencyKey)
            throw err
        }

    }

    async renameGDM(groupName: string, userId: string, conversationId: string, workspaceId: string) {
        const workspaceMember = await workspaceRepository.memberExists(userId, workspaceId)

        if (!workspaceMember) throw new ForbiddenError("You are not an member of this Workspace")
        const conversation = await conversationRepository.conversationExists(conversationId, userId)
        if (!conversation) {
            throw new NotFoundError("Group conversation not found");
        }

        if (conversation.conversation.type !== ConvoType.GDM) {
            throw new BadRequestError("Only group conversations can be renamed");
        }

        if (conversation.conversation.groupName === groupName) {
            return conversation;
        }
        const newGDM = await conversationRepository.renameGDM(groupName, conversationId)
        return newGDM
    }

    async addMembers(memberIds: string[], userId: string, reqParams: { conversationId: string, workspaceId: string }) {
         const workspaceMember = await workspaceRepository.memberExists(userId, reqParams.workspaceId)

        if (!workspaceMember) throw new ForbiddenError("You are not an member of this Workspace")
        const conversation = await conversationRepository.conversationExists(reqParams.conversationId, userId)
        if (!conversation) {
            throw new NotFoundError("Group conversation not found");
        }

        if (conversation.conversation.type !== ConvoType.GDM) {
            throw new BadRequestError("Only group conversations support add members");
        }
        const wsMembers = await workspaceRepository.getWorkspaceMembers(memberIds, reqParams.workspaceId)
        const validMemberIds = new Set(
            wsMembers.map(member => member.userId)
        );

        const invalidMemberIds = memberIds.filter(
            id => !validMemberIds.has(id)
        );


        if (invalidMemberIds.length > 0) {
            const InvalidMembers = await workspaceRepository.nonMembers(invalidMemberIds)
            throw new ForbiddenError(JSON.stringify({
                nonMembersCount: invalidMemberIds.length,
                InvalidMembers,
                msg: "You can't invite non Workspace Members"
            }))
        }

        const members = memberIds.map((memberId => ({
            userId: memberId,
            convoId: reqParams.conversationId
        })))

        conversationRepository.addMembers(members)
        const updatedConvo = await conversationRepository.getConversation(reqParams.conversationId, userId)
        return updatedConvo

    }
    async deleteMembers(memberIds: string[], userId: string, reqParams: { workspaceId: string, conversationId: string }) {
         const workspaceMember = await workspaceRepository.memberExists(userId, reqParams.workspaceId)

        if (!workspaceMember) throw new ForbiddenError("You are not an member of this Workspace")
        const conversation = await conversationRepository.conversationExists(reqParams.conversationId, userId)
        if (!conversation) {
            throw new NotFoundError("Group conversation not found");
        }

        if (conversation.conversation.type !== ConvoType.GDM) {
            throw new BadRequestError("Only group conversations support add members");
        }
        const wsMembers = await workspaceRepository.getWorkspaceMembers(memberIds, reqParams.workspaceId)
        const validMemberIds = new Set(
            wsMembers.map(member => member.userId)
        );

        const invalidMemberIds = memberIds.filter(
            id => !validMemberIds.has(id)
        );


        if (invalidMemberIds.length > 0) {
            const InvalidMembers = await workspaceRepository.nonMembers(invalidMemberIds)
            throw new ForbiddenError(JSON.stringify({
                nonMembersCount: invalidMemberIds.length,
                InvalidMembers,
                msg: "You can't remove non Workspace Members"
            }))
        }

        if (conversation.conversation._count.members === memberIds.length) {
            throw new BadRequestError("Can't remove all the group members")
        }
        conversationRepository.removeMembers(memberIds)
        return {}

    }
    async leaveGroup(userId: string, reqParams: { workspaceId: string, conversationId: string }) {
        const conversation = await conversationRepository.conversationExists(reqParams.conversationId, userId)
        if (!conversation) {
            throw new NotFoundError("Group conversation not found");
        }
        if (conversation.conversation.type !== ConvoType.GDM) {
            throw new BadRequestError("Only group conversations support add members");
        }

        try {
            await conversationRepository.leaveGroup(userId, reqParams.conversationId)

        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
                throw new NotFoundError("You are not an member of this Conversation")
            }
            throw err
        }
    }
}

export const conversationService = new ConversationService()
