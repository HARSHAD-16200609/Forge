import { WebSocket } from "ws";
import { StatusCodes } from "http-status-codes";

import { subscriptionManager } from "../subscriptionManager";
import { WebSocketMessage } from "../types/websocketMessage";
import { conversationIdSchema } from "../schema/envelope";
import { connectionManager } from "../connectionManager";
import { sendWs, WsResponse } from "../utility/wsResponse";
import { conversationRepository } from "../../modules/Conversations/conversations.repository";

class ConversationHandler {
    async subscribe(
        ws: WebSocket,
        message: WebSocketMessage
    ): Promise<void> {

        const result = conversationIdSchema.safeParse(message.payload)
        if (!result.success) {
            sendWs(
                ws,
                WsResponse.fail(
                    message.type,
                    StatusCodes.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    result.error.flatten().fieldErrors.conversationId?.join(", ") || "Invalid conversation payload"
                )
            )
            return
        }

        const conversationId = result.data.conversationId

        const subscriberMetadata = connectionManager.getMetadata(ws)
        if (subscriberMetadata === undefined) {
            sendWs(
                ws,
                WsResponse.fail(
                    message.type,
                    StatusCodes.UNAUTHORIZED,
                    "UNAUTHORIZED",
                    "Unauthenticated user, please login first"
                )
            )
            return;
        }

        const conversation = await conversationRepository.conversationExists(conversationId, subscriberMetadata.userId)

        if (!conversation) {
            sendWs(
                ws,
                WsResponse.fail(
                    message.type,
                    StatusCodes.FORBIDDEN,
                    "FORBIDDEN",
                    "You are not a member of this conversation"
                )
            )
            return
        }

        subscriptionManager.subscribe(conversationId, ws);

        sendWs(
            ws,
            WsResponse.ok(
                message.type,
                "Conversation subscribed successfully"
            )
        )
    }

    async unsubscribe(
        ws: WebSocket,
        message: WebSocketMessage
    ): Promise<void> {

        const result = conversationIdSchema.safeParse(message.payload)
        if (!result.success) {
            sendWs(
                ws,
                WsResponse.fail(
                    message.type,
                    StatusCodes.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    result.error.flatten().fieldErrors.conversationId?.join(", ") || "Invalid conversation payload"
                )
            )
            return
        }

        const conversationId = result.data.conversationId

        subscriptionManager.unsubscribe(conversationId, ws);

        sendWs(
            ws,
            WsResponse.ok(
                message.type,
                "Conversation unsubscribed successfully"
            )
        )
    }
}

export const conversationHandler = new ConversationHandler();