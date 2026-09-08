import { WebSocket } from "ws";
import { StatusCodes } from "http-status-codes";

import { subscriptionManager } from "../subscriptionManager";
import { WebSocketMessage } from "../types/websocketMessage";
import { conversationIdSchema } from "../schema/envelope";
import { connectionManager } from "../connectionManager";
import { sendWs, WsResponse } from "../utility/wsResponse";
import { conversationRepository } from "../../modules/Conversations/conversations.repository";
import { WsEvent } from "../types/events";
import { createChannelMessageSchema, createConversationMessageSchema, deleteConversationMessageSchema, updateConversationMessageSchema } from "../schema/message.types";
import { formatValidationError } from "../utility/error";
import { workspaceRepository } from "../../modules/Workspace/workspace.repository";
import { ConversationMessageDTO } from "../../types/message";
import { messageRepository } from "../../modules/Messages/message.repository";

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
                    WsEvent.ConversationSubscribe,
                    StatusCodes.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    result.error.flatten().fieldErrors.conversationId?.join(", ") || "Invalid conversation payload"
                )
            )
            return
        }

        const conversationId = result.data.conversationId

        const userMetadata = connectionManager.getMetadata(ws)
        if (userMetadata === undefined) {
            sendWs(
                ws,
                WsResponse.fail(
                    WsEvent.ConversationSubscribe,
                    StatusCodes.UNAUTHORIZED,
                    "UNAUTHORIZED",
                    "Unauthenticated user, please login first"
                )
            )
            return;
        }

        const conversation = await conversationRepository.conversationExists(conversationId, userMetadata.userId)

        if (!conversation) {
            sendWs(
                ws,
                WsResponse.fail(
                    WsEvent.ConversationSubscribe,
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
                WsEvent.ConversationSubscribe,
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
                    WsEvent.ConversationUnsubscribe,
                    StatusCodes.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    result.error.flatten().fieldErrors.conversationId?.join(", ") || "Invalid conversation payload"
                )
            )
            return
        }

        const conversationId = result.data.conversationId

        const userMetadata = connectionManager.getMetadata(ws)
        if (userMetadata === undefined) {
            sendWs(
                ws,
                WsResponse.fail(
                    WsEvent.ConversationUnsubscribe,
                    StatusCodes.UNAUTHORIZED,
                    "UNAUTHORIZED",
                    "Unauthenticated user, please login first"
                )
            )
            return;
        }

        const conversation = await conversationRepository.conversationExists(conversationId, userMetadata.userId)

        if (!conversation) {
            sendWs(
                ws,
                WsResponse.fail(
                    WsEvent.ConversationUnsubscribe,
                    StatusCodes.FORBIDDEN,
                    "FORBIDDEN",
                    "You are not a member of this conversation"
                )
            )
            return
        }

        subscriptionManager.unsubscribe(conversationId, ws);

        sendWs(
            ws,
            WsResponse.ok(
                WsEvent.ConversationUnsubscribe,
                "Conversation Unsubscribed successfully"
            )
        )
    }

    async createMessage(
        ws: WebSocket,
        message: WebSocketMessage
    ): Promise<void> {

        const messagePayload = createConversationMessageSchema.safeParse(message.payload)
        const userMetadata = connectionManager.getMetadata(ws)
        if (!userMetadata) {
            sendWs(ws, WsResponse.fail(WsEvent.ConversationMessage, StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Unauthenticated User login first"))
            return
        }
        if (!messagePayload.success) {
            sendWs(
                ws,
                WsResponse.fail(
                    WsEvent.ConversationMessage,
                    StatusCodes.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    formatValidationError(messagePayload.error)
                )
            )
            return
        }

        const workspaceMember = await workspaceRepository.memberExists(userMetadata.userId, messagePayload.data.workspaceId)
        if (!workspaceMember) {
            sendWs(ws, WsResponse.fail(WsEvent.ConversationMessage, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the workspace"))
            return
        }

        const conversation = await conversationRepository.conversationExists(messagePayload.data.conversationId, userMetadata.userId)
        if (!conversation) {
            sendWs(ws, WsResponse.fail(WsEvent.ConversationMessage, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the conversation"))

            return
        }
        let messageObj: ConversationMessageDTO = {
            conversationId: messagePayload.data.conversationId,
            content: messagePayload.data.content,
            senderId: userMetadata.userId

        }
        const posts = await messageRepository.postMessage(messageObj, messagePayload.data.uploadIds, userMetadata.userId)

        let subscribers = subscriptionManager.getSubscribers(messagePayload.data.conversationId)



        sendWs(ws, WsResponse.ok(WsEvent.ConversationMessageCreated, "OK", StatusCodes.OK, posts))



        subscribers?.forEach((subscriber) => {
            if (subscriber !== ws) {

                sendWs(subscriber, WsResponse.ok(WsEvent.ConversationMessageCreated, "OK", StatusCodes.OK, posts))
            }
        })
    }

    async updateMessage(ws: WebSocket,
        message: WebSocketMessage
    ): Promise<void> {
        const messagePayload = updateConversationMessageSchema.safeParse(message.payload)
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
        const { content, messageId } = messagePayload.data


        const post = await messageRepository.messageExists(messageId)
        if (!post) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.NOT_FOUND, "NOT_FOUND_ERROR", "Message does not exist"))
            return
        }
        if (post.senderId !== userMetadata.userId) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not allowed to perform this action"))
            return
        }
        if (post.deletedAt) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.BAD_REQUEST, "BAD_REQUEST", "Message is already deleted"))
            return

        }
        if (!post.conversationId) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.BAD_REQUEST, "BAD_REQUEST", "Message does not belong to a conversation"))
            return
        }
        if (post.conversationId !== messagePayload.data.conversationId) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "Message does not belong to this conversation"))
            return

        }
        const workspaceMember = await workspaceRepository.memberExists(userMetadata.userId, messagePayload.data.workspaceId)
        if (!workspaceMember) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the workspace"))
            return
        }

        const conversation = await conversationRepository.conversationExists(messagePayload.data.conversationId, userMetadata.userId)
        if (!conversation) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the conversation"))

            return
        }


        const updatedPost = await messageRepository.editMessage(content, messageId)

        let subscribers = subscriptionManager.getSubscribers(messagePayload.data.conversationId)

        sendWs(ws, WsResponse.ok(WsEvent.ConversationMessageUpdated, "OK", StatusCodes.OK, updatedPost))

        subscribers?.forEach((subscriber) => {
            if (subscriber !== ws) {

                sendWs(subscriber, WsResponse.ok(WsEvent.ConversationMessageUpdated, "OK", StatusCodes.OK, updatedPost))
            }
        })

    }

    async deleteMessage(ws: WebSocket,
        message: WebSocketMessage): Promise<void> {
        const messagePayload = deleteConversationMessageSchema.safeParse(message.payload)
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
        const { messageId } = messagePayload.data


        const post = await messageRepository.messageExists(messageId)
        if (!post) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.NOT_FOUND, "NOT_FOUND_ERROR", "Message does not exist"))
            return
        }
        if (post.senderId !== userMetadata.userId) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not allowed to perform this action"))
            return
        }
        if (post.deletedAt) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.BAD_REQUEST, "BAD_REQUEST", "Message is already deleted"))
            return

        }
        if (!post.conversationId) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.BAD_REQUEST, "BAD_REQUEST", "Message does not belong to a conversation"))
            return
        }
        if (post.conversationId !== messagePayload.data.conversationId) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "Message does not belong to this conversation"))
            return

        }
        const workspaceMember = await workspaceRepository.memberExists(userMetadata.userId, messagePayload.data.workspaceId)
        if (!workspaceMember) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the workspace"))
            return
        }

        const conversation = await conversationRepository.conversationExists(messagePayload.data.conversationId, userMetadata.userId)
        if (!conversation) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the conversation"))

            return
        }
        await messageRepository.deleteMessage(messageId)

        let subscribers = subscriptionManager.getSubscribers(messagePayload.data.conversationId)

        const response = WsResponse.ok(WsEvent.ConversationMessageDeleted, "OK", StatusCodes.OK, { messageId })

        sendWs(ws, response)

        subscribers?.forEach((subscriber) => {
            if (subscriber !== ws) {

                sendWs(subscriber, response)
            }
        })

    }

}

export const conversationHandler = new ConversationHandler();