import { channelParamsDTO } from "../../db/channel.schema";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../utility/errorHandling/customErrors";
import { channelRepository } from "../Channel/channel.repository";
import { workspaceRepository } from "../Workspace/workspace.repository";
import { messageRepository } from "./message.repository";



class MessageService {

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

    async getMessage(messageId: string, userId: string) {
        const message = await messageRepository.getById(messageId)
        if (!message) {
            throw new NotFoundError("Message not found");
        }

        if (message.entity.type !== "channel") {
            throw new BadRequestError("Message does not belong to a channel");
        }
        const channel = await channelRepository.getWorkspaceId(message.entity.id)
        if (!channel) throw new NotFoundError("Channel not found")

        const workspaceMember = await workspaceRepository.memberExists(userId, channel.workspaceId)
        if (!workspaceMember) throw new ForbiddenError("You are not a member of this workspace")

        const channelMember = await channelRepository.memberExists(workspaceMember.id, message.entity.id)
        if (!channelMember) throw new ForbiddenError("You are not an member of this channel")

        return {
            message
        }

    }

}

export const messageService = new MessageService()