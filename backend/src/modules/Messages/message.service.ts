import { channelParamsDTO, conversationParamsDTO } from "../../db/channel.schema";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../utility/errorHandling/customErrors";
import { channelRepository } from "../Channel/channel.repository";
import { workspaceRepository } from "../Workspace/workspace.repository";
import { messageRepository } from "./message.repositoty";
import { ChannelMessageDTO } from "../../types/message";
import { uploadService } from "./upload.service";
import { getResourceType } from "../../db/message.schema";
import { deleteFromCloudinary } from "../../config/cloudinary";
import { fType } from "../../../generated/prisma/enums";
import { loggers } from "../../utility/logger/serviceLoggers";
import { conversationRepository } from "../Conversations/conversations.repository";



class MessageService {

    async postMessage(Channel: channelParamsDTO, content: string, User: { username: string, userId: string }, attachments: Express.Multer.File[]) {
        const workspaceMember = await workspaceRepository.memberExists(User.userId, Channel.workspaceId)
        if (!workspaceMember) throw new ForbiddenError("You are not a member of this workspace")

        const channelMember = await channelRepository.memberExists(workspaceMember.id, Channel.channelId)
        if (!channelMember) throw new ForbiddenError("You are not an member of this channel")

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

            const messageObject: ChannelMessageDTO = {
                channelId: Channel.channelId,
                senderId: User.userId,
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

    async getMessages(Channel: channelParamsDTO, User: { username: string, userId: string }, pagination: { cursor?: string | undefined, limit: number }) {
        const workspaceMember = await workspaceRepository.memberExists(User.userId, Channel.workspaceId)
        if (!workspaceMember) throw new ForbiddenError("You are not a member of this workspace")

        const channelMember = await channelRepository.memberExists(workspaceMember.id, Channel.channelId)
        if (!channelMember) throw new ForbiddenError("You are not an member of this channel")


        const channelMessages = await messageRepository.getMessages(Channel.channelId, pagination)
        if (channelMessages.length === 0) throw new NotFoundError("No Messages Found")
        const hasMore = channelMessages.length > pagination.limit


        const messagesVisible = hasMore ? channelMessages.slice(0, pagination.limit) : channelMessages
        const nextCursor = hasMore ? messagesVisible[messagesVisible.length - 1]?.id : null

        return {
            messages: messagesVisible,
            hasMore,
            nextCursor
        }

    }
       async getConvoMessages(Conversation: conversationParamsDTO, User: { username: string, userId: string }, pagination: { cursor?: string | undefined, limit: number }) {
        const workspaceMember = await workspaceRepository.memberExists(User.userId, Conversation.workspaceId)
        if (!workspaceMember) throw new ForbiddenError("You are not a member of this workspace")

        const conversation = await conversationRepository.conversationExists(Conversation.conversationId, User.userId)
        if (!conversation) throw new NotFoundError("No Conversation Found")


        const channelMessages = await messageRepository.getConversationMessages(Conversation.conversationId, pagination)
        if (channelMessages.length === 0) throw new NotFoundError("No Messages Found")
        const hasMore = channelMessages.length > pagination.limit


        const messagesVisible = hasMore ? channelMessages.slice(0, pagination.limit) : channelMessages
        const nextCursor = hasMore ? messagesVisible[messagesVisible.length - 1]?.id : null

        return {
            messages: messagesVisible,
            hasMore,
            nextCursor
        }

    }

    async getMessage(messageId: string, userId: string) {
        const message = await messageRepository.getById(messageId)
        if (!message) {
            throw new NotFoundError("Message not found");
        }

        if (!message.channelId) {
            throw new BadRequestError("Message does not belong to a channel");
        }
        const workspaceMember = await workspaceRepository.memberExists(userId, message.channel!.workspaceId)
        if (!workspaceMember) throw new ForbiddenError("You are not a member of this workspace")

        const channelMember = await channelRepository.memberExists(workspaceMember.id, message.channelId)
        if (!channelMember) throw new ForbiddenError("You are not an member of this channel")

        const { channel, ...messagewithoutChannelInfo } = message
        return {
            message: messagewithoutChannelInfo
        }

    }
    async editMessage(content: string, userId: string, messageId: string) {
        const message = await messageRepository.messageExists(messageId)
        if (!message) {
            throw new NotFoundError("Message not found");
        }
        if (message.deletedAt) throw new BadRequestError("Message is already Deleted")
        if (message.senderId !== userId) throw new ForbiddenError("You are not allowed to perform this action")
        if (!message.channelId) {
            throw new BadRequestError("Message does not belong to a channel");
        }
        const workspaceMember = await workspaceRepository.memberExists(userId, message.channel!.workspaceId)
        if (!workspaceMember) throw new ForbiddenError("You are not a member of this workspace")

        const channelMember = await channelRepository.memberExists(workspaceMember.id, message.channelId)
        if (!channelMember) throw new ForbiddenError("You are not an member of this channel")


        const editedMessage = await messageRepository.editMessage(content, messageId)
        return editedMessage

    }
    async deleteMessage(userId: string, messageId: string) {
        const message = await messageRepository.messageExists(messageId)
        if (!message) {
            throw new NotFoundError("Message not found");
        }
        if (message.deletedAt) throw new BadRequestError("Message is already Deleted")
        if (message.senderId !== userId) throw new ForbiddenError("You are not allowed to perform this action")
        if (!message.channelId) {
            throw new BadRequestError("Message does not belong to a channel");
        }
        const workspaceMember = await workspaceRepository.memberExists(userId, message.channel!.workspaceId)
        if (!workspaceMember) throw new ForbiddenError("You are not a member of this workspace")

        const channelMember = await channelRepository.memberExists(workspaceMember.id, message.channelId)
        if (!channelMember) throw new ForbiddenError("You are not an member of this channel")
        const deletedMessage = await messageRepository.deleteMessage(messageId)

    }

    async postReply(userId: string, messageId: string, content: string) {
        const message = await messageRepository.getById(messageId)
        if (!message) {
            throw new NotFoundError("Message not found");
        }

        if (!message.channelId) {
            throw new BadRequestError("Message does not belong to a channel");
        }
        const workspaceMember = await workspaceRepository.memberExists(userId, message.channel!.workspaceId)
        if (!workspaceMember) throw new ForbiddenError("You are not a member of this workspace")

        const channelMember = await channelRepository.memberExists(workspaceMember.id, message.channelId)
        if (!channelMember) throw new ForbiddenError("You are not an member of this channel")

        const messageObject: ChannelMessageDTO = {
            channelId: message.channelId,
            senderId: userId,
            content
        }

        const reply = await messageRepository.createReply(messageObject, messageId)
        if (reply === undefined) throw new BadRequestError("Invalid ParentMsgId")

        return reply


    }
    async postReaction(userId: string, messageId: string, emoji: string) {
        const message = await messageRepository.getById(messageId)
        if (!message) {
            throw new NotFoundError("Message not found");
        }
        if (message.deletedAt) throw new BadRequestError("Can't React to Deleted Message")
        if (!message.channelId) {
            throw new BadRequestError("Message does not belong to a channel");
        }
        const workspaceMember = await workspaceRepository.memberExists(userId, message.channel!.workspaceId)
        if (!workspaceMember) throw new ForbiddenError("You are not a member of this workspace")

        const channelMember = await channelRepository.memberExists(workspaceMember.id, message.channelId)
        if (!channelMember) throw new ForbiddenError("You are not an member of this channel")



        const reactionExists = await messageRepository.reactionExists(userId, messageId)
        let reaction
        if (reactionExists) {
            if (reactionExists.emoji === emoji) {

                await messageRepository.toggleReaction(userId, messageId, emoji)
                return {
                    action: "deleted",
                    data: {}
                }
            } else {
                reaction = await messageRepository.addReaction(userId, messageId, emoji)
                return {
                    action: "posted",
                    data: reaction
                }

            }
        }
      reaction = await messageRepository.addReaction(userId, messageId, emoji)
        return {
            action: "posted",
            data: reaction
        }


    }

}

export const messageService = new MessageService()