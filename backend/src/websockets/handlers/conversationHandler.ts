import { WebSocket } from "ws";

import { subscriptionManager } from "../subscriptionManager";
import { WebSocketMessage } from "../types/websocketMessage";

class ConversationHandler {
    async subscribe(
        ws: WebSocket,
        message: WebSocketMessage
    ): Promise<void> {
        const { conversationId } = message.payload as {
            conversationId: string;
        };

        subscriptionManager.subscribe(conversationId, ws);
    }

    async unsubscribe(
        ws: WebSocket,
        message: WebSocketMessage
    ): Promise<void> {
        const { conversationId } = message.payload as {
            conversationId: string;
        };

        subscriptionManager.unsubscribe(conversationId, ws);
    }
}

export const conversationHandler = new ConversationHandler();