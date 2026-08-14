import { WebSocket } from "ws";

import { subscriptionManager } from "../subscriptionManager";
import { WebSocketMessage } from "../types/websocketMessage";
import { conversationIdSchema, messageEnvelopeSchema } from "../schema/envelope";
import { connectionManager } from "../connectionManager";

class ConversationHandler {
    async subscribe(
        ws: WebSocket,
        message: WebSocketMessage
    ): Promise<void> {

        const result = conversationIdSchema.safeParse(message.payload)
        if (!result.success) {
            throw new Error("Invalid conversation subscribe payload");
        }

         const user = connectionManager.getMetadata(ws)
         console.log(user)
         
        const conversationId = result.data.conversationId

        subscriptionManager.subscribe(conversationId, ws);
    }

    async unsubscribe(
        ws: WebSocket,
        message: WebSocketMessage
    ): Promise<void> {
console.log("Unsubscribed")

        const result = conversationIdSchema.safeParse(message.payload)
        if (!result.success) {
            throw new Error("Invalid conversation subscribe payload");
        }

             const user = connectionManager.getMetadata(ws)
         console.log(user)
         
        const conversationId = result.data.conversationId


        subscriptionManager.unsubscribe(conversationId, ws);


    }
}

export const conversationHandler = new ConversationHandler();