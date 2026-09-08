import { WebSocket } from "ws";
import { StatusCodes } from "http-status-codes";
import { subscriptionManager } from "../subscriptionManager";
import { WebSocketMessage } from "../types/websocketMessage";
import { connectionManager } from "../connectionManager";
import { sendWs, WsResponse } from "../utility/wsResponse";
import { postReplySchema } from "../schema/message.types";
import { formatValidationError } from "../utility/error";
import { messageRepository } from "../../modules/Messages/message.repository";
import { workspaceRepository } from "../../modules/Workspace/workspace.repository";
import { channelRepository } from "../../modules/Channel/channel.repository";
import { conversationRepository } from "../../modules/Conversations/conversations.repository";
import { ChannelMessageDTO, ConversationMessageDTO } from "../../types/message";

async function reply(
    ws: WebSocket,
    message: WebSocketMessage
): Promise<void> {
    const messagePayload = postReplySchema.safeParse(message.payload)
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
    const { workspaceId, parentMsgId, entityId, content, entityType } = messagePayload.data

    const parent = await messageRepository.messageExists(parentMsgId)
    if (!parent) {
        sendWs(ws, WsResponse.fail(message.type, StatusCodes.NOT_FOUND, "NOT_FOUND_ERROR", "Parent message does not exist"))
        return
    }
    if (parent.deletedAt) {
        sendWs(ws, WsResponse.fail(message.type, StatusCodes.BAD_REQUEST, "BAD_REQUEST", "Parent message is already deleted"))
        return
    }

    const workspaceMember = await workspaceRepository.memberExists(userMetadata.userId, workspaceId)
    if (!workspaceMember) {
        sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the workspace"))
        return
    }

    let messageObj: ChannelMessageDTO | ConversationMessageDTO
    if (entityType === "channel") {
        if (parent.channelId !== entityId) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "Parent message does not belong to this channel"))
            return
        }
        const channelMember = await channelRepository.memberExists(workspaceMember.id, entityId)
        if (!channelMember) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the channel"))
            return
        }
        messageObj = {
            channelId: entityId,
            content,
            senderId: userMetadata.userId,
        }
    } else {
        if (parent.conversationId !== entityId) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "Parent message does not belong to this conversation"))
            return
        }
        const conversation = await conversationRepository.conversationExists(entityId, userMetadata.userId)
        if (!conversation) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the conversation"))
            return
        }
        messageObj = {
            conversationId: entityId,
            content,
            senderId: userMetadata.userId,
        }
    }

    const createdReply = await messageRepository.createReply(messageObj, parentMsgId)
    if (!createdReply) {
        sendWs(ws, WsResponse.fail(message.type, StatusCodes.BAD_REQUEST, "BAD_REQUEST", "Invalid ParentMsgId"))
        return
    }

    const response = WsResponse.ok(message.type, "OK", StatusCodes.OK, createdReply)
    const subscribers = subscriptionManager.getSubscribers(entityId)

    sendWs(ws, response)

    subscribers?.forEach((subscriber) => {
        if (subscriber !== ws) {
            sendWs(subscriber, response)
        }
    })
}

export const replyHandler = { reply }