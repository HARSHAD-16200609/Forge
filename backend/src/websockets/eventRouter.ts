import { WebSocket } from "ws";
import { StatusCodes } from "http-status-codes";
import { loggers } from "../utility/logger/serviceLoggers";
import { WsEvent } from "./types/events";
import { WebSocketMessage } from "./types/websocketMessage";
import { sendWs, WsResponse } from "./utility/wsResponse";

import { conversationHandler } from "./handlers/conversationHandler";
import { connectionManager } from "./connectionManager";
// import { messageHandler } from "./handlers/messageHandler";
// import { presenceHandler } from "./handlers/presenceHandler";

type EventHandler = (
    ws: WebSocket,
    message: WebSocketMessage
) => Promise<void>;

class EventRouter {

    private readonly handlers = new Map<WsEvent, EventHandler>();

    constructor() {
        this.handlers.set(
            WsEvent.ConversationSubscribe,
            conversationHandler.subscribe
        );

        this.handlers.set(
            WsEvent.ConversationUnsubscribe,
            conversationHandler.unsubscribe
        );

        // this.handlers.set(
        //     WsEvent.MessageCreate,
        //     messageHandler.create
        // );

        // this.handlers.set(
        //     WsEvent.TypingStart,
        //     presenceHandler.typingStart
        // );

        // this.handlers.set(
        //     WsEvent.TypingStop,
        //     presenceHandler.typingStop
        // );

    }

    async dispatch(
        ws: WebSocket,
        message: WebSocketMessage
    ): Promise<void> {
        const handler = this.handlers.get(message.type);

        if (!handler) {
            loggers.audit.warn("UNKNOWN_WS_EVENT", {
                eventType: message.type,
                userId: connectionManager.getMetadata(ws)?.userId,
            });

            sendWs(
                ws,
                WsResponse.fail(
                    message.type,
                    StatusCodes.BAD_REQUEST,
                    "UNKNOWN_EVENT",
                    `Unknown event: ${message.type}`
                )
            );
            return;
        }

        try {
            await handler(ws, message);
        } catch (error) {
            loggers.audit.error("WS_EVENT_PROCESSING_FAILED", {
                eventType: message.type,
                userId: connectionManager.getMetadata(ws)?.userId,
                payload: message.payload,
                error: error instanceof Error ? error.stack : String(error),
            });

            sendWs(
                ws,
                WsResponse.fail(
                    message.type,
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    "INTERNAL_ERROR",
                    "Failed to process WebSocket event"
                )
            );
        }
    }
}

export const eventRouter = new EventRouter();