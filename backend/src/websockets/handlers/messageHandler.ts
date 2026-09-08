import { WebSocket } from "ws";
import { subscriptionManager } from "../subscriptionManager";
import { WebSocketMessage } from "../types/websocketMessage";
import { createChannelMessageSchema, deleteChannelMessageSchema, subscribeChannelSchema, updateChannelMessageSchema } from "../schema/message.types"
import { sendWs, WsResponse } from "../utility/wsResponse";
import { StatusCodes } from "http-status-codes";
import { channelRepository } from "../../modules/Channel/channel.repository";
import { workspaceRepository } from "../../modules/Workspace/workspace.repository";
import { connectionManager } from "../connectionManager";
import { WsEvent } from "../types/events";
import { messageRepository } from "../../modules/Messages/message.repository";
import { ChannelMessageDTO } from "../../types/message";
import { formatValidationError } from "../utility/error";
import { messageService } from "../../modules/Messages/message.service";



class MessageHandler {

    async subscribe(
        ws: WebSocket,
        message: WebSocketMessage
    ): Promise<void> {

        const messagePayload = subscribeChannelSchema.safeParse(message.payload)

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

        const channelId = messagePayload.data.channelId

        const userMetadata = connectionManager.getMetadata(ws)
        if (userMetadata === undefined) {
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

        const workspaceMember = await workspaceRepository.memberExists(userMetadata.userId, messagePayload.data.workspaceId)
        if (!workspaceMember) {
            sendWs(ws, WsResponse.fail(WsEvent.ChannelSubscribe, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the workspace"))
            return
        }

        const channelMember = await channelRepository.memberExists(workspaceMember?.id, channelId)
        if (!channelMember) {
            sendWs(
                ws,
                WsResponse.fail(
                    WsEvent.ChannelSubscribe,
                    StatusCodes.FORBIDDEN,
                    "FORBIDDEN",
                    "You are not a member of this channel"
                )
            )
            return
        }

        subscriptionManager.subscribe(channelId, ws);

        sendWs(
            ws,
            WsResponse.ok(
                WsEvent.ChannelSubscribe,
                "Channel subscribed successfully"
            )
        )
    }
    async unsubscribe(
        ws: WebSocket,
        message: WebSocketMessage
    ): Promise<void> {
        const messagePayload = createChannelMessageSchema.safeParse(message.payload)
        const userMetadata = connectionManager.getMetadata(ws)
        if (!userMetadata) {
            sendWs(ws, WsResponse.fail(WsEvent.ChannelUnsubscribe, StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Unauthenticated User login first"))
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

        const workspaceMember = await workspaceRepository.memberExists(userMetadata.userId, messagePayload.data.workspaceId)
        if (!workspaceMember) {
            sendWs(ws, WsResponse.fail(WsEvent.ChannelUnsubscribe, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the workspace"))
            return
        }

        const channelMember = await channelRepository.memberExists(workspaceMember?.id, messagePayload.data.channelId)
        if (!channelMember) {
            sendWs(ws, WsResponse.fail(WsEvent.ChannelUnsubscribe, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the channel"))

            return
        }

        subscriptionManager.unsubscribe(messagePayload.data.channelId, ws)



        sendWs(ws, WsResponse.ok(WsEvent.ChannelUnsubscribe, "Channel Unsubscribed Successfully", StatusCodes.OK))

    }
    async createMessage(
        ws: WebSocket,
        message: WebSocketMessage
    ): Promise<void> {
        const messagePayload = createChannelMessageSchema.safeParse(message.payload)
        const userMetadata = connectionManager.getMetadata(ws)
        if (!userMetadata) {
            sendWs(ws, WsResponse.fail(WsEvent.ChannelMessage, StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Unauthenticated User login first"))
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

        const workspaceMember = await workspaceRepository.memberExists(userMetadata.userId, messagePayload.data.workspaceId)
        if (!workspaceMember) {
            sendWs(ws, WsResponse.fail(WsEvent.ChannelMessage, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the workspace"))
            return
        }

        const channelMember = await channelRepository.memberExists(workspaceMember?.id, messagePayload.data.channelId)
        if (!channelMember) {
            sendWs(ws, WsResponse.fail(WsEvent.ChannelMessage, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the channel"))

            return
        }
        let messageObj: ChannelMessageDTO = {
            channelId: messagePayload.data.channelId,
            content: messagePayload.data.content,
            senderId: userMetadata.userId

        }
        const posts = await messageRepository.postMessage(messageObj, messagePayload.data.uploadIds, userMetadata.userId)

        let subscribers = subscriptionManager.getSubscribers(messagePayload.data.channelId)



        sendWs(ws, WsResponse.ok(WsEvent.ChannelMessageCreated, "OK", StatusCodes.OK, posts))



        subscribers?.forEach((subscriber) => {
            if (subscriber !== ws) {

                sendWs(subscriber, WsResponse.ok(WsEvent.ChannelMessageCreated, "OK", StatusCodes.OK, posts))
            }
        })

    }
    async updateMessage(ws: WebSocket,
        message: WebSocketMessage
    ): Promise<void> {
        const messagePayload = updateChannelMessageSchema.safeParse(message.payload)
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
        if (!post.channelId) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.BAD_REQUEST, "BAD_REQUEST", "Message does not belong to a channel"))
            return
        }
        if (post.channelId !== messagePayload.data.channelId) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "Message does not belong to this channel"))
            return

        }
        const workspaceMember = await workspaceRepository.memberExists(userMetadata.userId, messagePayload.data.workspaceId)
        if (!workspaceMember) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the workspace"))
            return
        }

        const channelMember = await channelRepository.memberExists(workspaceMember?.id, messagePayload.data.channelId)
        if (!channelMember) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the channel"))

            return
        }


        const updatedPost = await messageRepository.editMessage(content, messageId)

        let subscribers = subscriptionManager.getSubscribers(messagePayload.data.channelId)

        sendWs(ws, WsResponse.ok(WsEvent.ChannelMessageUpdated, "OK", StatusCodes.OK, updatedPost))

        subscribers?.forEach((subscriber) => {
            if (subscriber !== ws) {

                sendWs(subscriber, WsResponse.ok(WsEvent.ChannelMessageUpdated, "OK", StatusCodes.OK, updatedPost))
            }
        })

    }

    async deleteMessage(ws: WebSocket,
        message: WebSocketMessage): Promise<void> {
        const messagePayload = deleteChannelMessageSchema.safeParse(message.payload)
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
        if (!post.channelId) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.BAD_REQUEST, "BAD_REQUEST", "Message does not belong to a channel"))
            return
        }
        if (post.channelId !== messagePayload.data.channelId) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "Message does not belong to this channel"))
            return

        }
        const workspaceMember = await workspaceRepository.memberExists(userMetadata.userId, messagePayload.data.workspaceId)
        if (!workspaceMember) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the workspace"))
            return
        }

        const channelMember = await channelRepository.memberExists(workspaceMember?.id, messagePayload.data.channelId)
        if (!channelMember) {
            sendWs(ws, WsResponse.fail(message.type, StatusCodes.FORBIDDEN, "FORBIDDEN", "You are not a member of the channel"))

            return
        }

        await messageRepository.deleteMessage(messageId)

        let subscribers = subscriptionManager.getSubscribers(messagePayload.data.channelId)

        const response = WsResponse.ok(WsEvent.ChannelMessageDeleted, "OK", StatusCodes.OK, { messageId })

        sendWs(ws, response)

        subscribers?.forEach((subscriber) => {
            if (subscriber !== ws) {

                sendWs(subscriber, response)
            }
        })



    }


}

export const messageHandler = new MessageHandler();

