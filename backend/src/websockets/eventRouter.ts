import { WebSocket } from "ws";
import {loggers} from "../utility/logger/serviceLoggers";
import { WsEvent } from "./types/events";
import { WebSocketMessage } from "./types/websocketMessage";

import { conversationHandler } from "./handlers/conversationHandler";
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
        try {
            const handler = this.handlers.get(message.type);

            if (!handler) {
                throw new Error(`Unknown WebSocket event: ${message.type}`);
            }

            await handler(ws, message);
            
        } catch (error) {
    
            loggers.audit.error(`Error processing WebSocket event: ${error}`, {
                eventType: message.type,
                payload: message.payload,
            });


            ws.send(
                JSON.stringify({
                    type: "error",
                    payload: {
                        message: "Failed to process WebSocket event",
                    },
                })
            );
        }
    }
}

export const eventRouter = new EventRouter();