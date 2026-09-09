import { WebSocket } from "ws";
import { StatusCodes } from "http-status-codes";
import { subscriptionManager } from "../subscriptionManager";
import { WebSocketMessage } from "../types/websocketMessage";
import { connectionManager } from "../connectionManager";
import { sendWs, WsResponse } from "../utility/wsResponse";
import { postReactionSchema } from "../schema/message.types";
import { formatValidationError } from "../utility/error";
import { messageRepository } from "../../modules/Messages/message.repository";
import { workspaceRepository } from "../../modules/Workspace/workspace.repository";
import { channelRepository } from "../../modules/Channel/channel.repository";
import { conversationRepository } from "../../modules/Conversations/conversations.repository";

async function react(
    ws: WebSocket,
    message: WebSocketMessage
): Promise<void> {
    const messagePayload = postReactionSchema.safeParse(message.payload)
    const userMetadata = connectionManager.getMetadata(ws)
    if (!userMetadata) {
        sendWs(ws, WsResponse.fail(message.type, StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Unauthenticated User login first"))
        return
    }
    if (!messagePayload.success) {
        sendWs(
            ws,
            WsResponse.fail(
                message.type,
                StatusCodes.BAD_REQUEST,
                "VALIDATION_ERROR",
                formatValidationError(messagePayload.error)
            )
        )
        return
    }
    const { workspaceId, entityId, entityType, messageId, reaction } = messagePayload.data

    const post = await messageRepository.messageExists(messageId)
    if (!post) {
        sendWs(ws, WsResponse.fail(message.type, StatusCodes.NOT_FOUND, "NOT_FOUND_ERROR", "Message does not exist"))
        return
    }
    if (post.deletedAt) {
        sendWs(ws, WsResponse.fail(message.type, StatusCodes.BAD_REQUEST, "BAD_REQUEST", "Message is already deleted"))
        return
    }

    const workspaceMember = await workspaceRepository.memberExists(userMetadata.userId, workspaceId)
    if (!workspaceMember) {
        sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the workspace"))
        return
    }

    if (entityType === "channel") {
        if (post.channelId !== entityId) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "Message does not belong to this channel"))
            return
        }
        const channelMember = await channelRepository.memberExists(workspaceMember.id, entityId)
        if (!channelMember) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the channel"))
            return
        }
    } else {
        if (post.conversationId !== entityId) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "Message does not belong to this conversation"))
            return
        }
        const conversation = await conversationRepository.conversationExists(entityId, userMetadata.userId)
        if (!conversation) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the conversation"))
            return
        }
    }

    const existing = await messageRepository.reactionExists(userMetadata.userId, messageId)

    let action: "added" | "removed" = "added"

    if (existing) {
        if (existing.emoji === reaction) {
            await messageRepository.toggleReaction(userMetadata.userId, messageId, reaction)
            action = "removed"
        } else {
            await messageRepository.toggleReaction(userMetadata.userId, messageId, existing.emoji)
            action = "added"
        }
    }

    if (!existing || existing.emoji !== reaction) {
        await messageRepository.addReaction(userMetadata.userId, messageId, reaction)
    }

    const data = {
        userId: userMetadata.userId,
        username: userMetadata.username,
        messageId,
        reaction,
        action,
    }

    const response = WsResponse.ok(message.type, "OK", StatusCodes.OK, data)
    const subscribers = subscriptionManager.getSubscribers(entityId)

    sendWs(ws, response)

    subscribers?.forEach((subscriber) => {
        if (subscriber !== ws) {
            sendWs(subscriber, response)
        }
    })
}

export const reactionHandler = { react }