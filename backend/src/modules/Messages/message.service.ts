import { NotBeforeError } from "jsonwebtoken";
import { channelParamsDTO } from "../../db/channel.schema";
import { Message } from "../../db/message.schema";
import { ForbiddenError, NotFoundError } from "../../utility/errorHandling/customErrors";
import { channelRepository } from "../Channel/channel.repository";
import { workspaceRepository } from "../Workspace/workspace.repository";
import { messageRepository } from "./message.repositoty";
import { ChannelMessageDTO } from "../../types/message";


class MessageService {

    async postMessage(Channel: channelParamsDTO, content: string, User: { username: string, userId: string }) {
        const workspaceMember = await workspaceRepository.memberExists(User.userId, Channel.workspaceId)
        if (!workspaceMember) throw new ForbiddenError("You are not a member of this workspace")

        const channelMember = await channelRepository.memberExists(workspaceMember.id, Channel.channelId)
        if (!channelMember) throw new ForbiddenError("You are not an member of this channel")

        const messageObject: ChannelMessageDTO = {
            channelId: Channel.channelId,
            senderId: User.userId,
            content
        }

        const message = await messageRepository.createMessage(messageObject)
        return message

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
            Messages: messagesVisible,
            hasMore,
            nextCursor
        }

    }

}

export const messageService = new MessageService()