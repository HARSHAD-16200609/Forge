import { WebSocket } from "ws";
import { subscriptionManager } from "../subscriptionManager";
import { WebSocketMessage } from "../types/websocketMessage";
import { createChannelMessageSchema, subscribeChannelSchema } from "../schema/message.types"
import { sendWs, WsResponse } from "../utility/wsResponse";
import { StatusCodes } from "http-status-codes";
import { channelRepository } from "../../modules/Channel/channel.repository";
import { workspaceRepository } from "../../modules/Workspace/workspace.repository";
import { connectionManager } from "../connectionManager";
import { WsEvent } from "../types/events";
import { messageRepository } from "../../modules/Messages/message.repository";
import { ChannelMessageDTO } from "../../types/message";
import { formatValidationError } from "../utility/error";



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



        sendWs(ws, WsResponse.ok(WsEvent.ChannelMessageCreated, JSON.stringify(posts), StatusCodes.OK))



        subscribers?.forEach((subscriber) => {
            if (subscriber !== ws) {

                sendWs(subscriber, WsResponse.ok(WsEvent.ChannelMessageCreated, JSON.stringify(posts), StatusCodes.OK))
            }
        })

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
}

export const messageHandler = new MessageHandler();

