import { subscriptionManager } from "../subscriptionManager";
import { WebSocketMessage } from "../types/websocketMessage";
import { WebSocket } from "ws";
import { sendWs, WsResponse } from "../utility/wsResponse";
import { connectionManager } from "../connectionManager";
import { StatusCodes } from "http-status-codes";
import { typingIndicatorSchema } from "../schema/message.types";
import { formatValidationError } from "../utility/error";
import { workspaceRepository } from "../../modules/Workspace/workspace.repository";
import { channelRepository } from "../../modules/Channel/channel.repository";
import { conversationRepository } from "../../modules/Conversations/conversations.repository";

async function forwardTyping(
    ws: WebSocket,
    message: WebSocketMessage
): Promise<void> {
    const userMetadata = connectionManager.getMetadata(ws)
    if (!userMetadata) {
        sendWs(ws, WsResponse.fail(message.type, StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Unauthenticated User login first"))
        return
    }

    const indicatorPayload = typingIndicatorSchema.safeParse(message.payload)

    if (!indicatorPayload.success) {
        sendWs(
            ws,
            WsResponse.fail(
                message.type,
                StatusCodes.BAD_REQUEST,
                "VALIDATION_ERROR",
                formatValidationError(indicatorPayload.error)
            )
        )
        return
    }

    const { workspaceId, entityId, entityType } = indicatorPayload.data

    const workspaceMember = await workspaceRepository.memberExists(userMetadata.userId, workspaceId)
    if (!workspaceMember) {
        sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the workspace"))
        return
    }

    if (entityType === "channel") {
        const channelMember = await channelRepository.memberExists(workspaceMember.id, entityId)
        if (!channelMember) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the channel"))

            return
        }
    }

    if (entityType === "conversation") {
        const conversation = await conversationRepository.conversationExists(entityId, userMetadata.userId)
        if (!conversation) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the conversation"))

            return
        }
    }

    const subscribers = subscriptionManager.getSubscribers(entityId)
    if (!subscribers) {
        return
    }

    const response = WsResponse.ok(message.type, "OK", StatusCodes.OK, {
        userId: userMetadata.userId,
        entityId,
    })

    subscribers.forEach((subscriber) => {
        if (subscriber !== ws) {
            sendWs(subscriber, response)
        }
    })
}

class TypingHandler {

    async typingStart(ws: WebSocket, message: WebSocketMessage): Promise<void> {
        return forwardTyping(ws, message)
    }

    async typingStop(ws: WebSocket, message: WebSocketMessage): Promise<void> {
        return forwardTyping(ws, message)
    }

}

export const typingHandler = new TypingHandler()