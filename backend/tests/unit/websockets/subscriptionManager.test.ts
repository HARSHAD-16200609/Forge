import { describe, it, expect } from "vitest";
import {subscriptionManager} from "../../../src/websockets/subscriptionManager"




describe("SubscriptionManager", () => {
    it("should add a websocket to a conversation when subscribed", () => {

        

        // Arrange
        const ws = {} as WebSocket;
        const conversationId = "conversation-1";

        // Act

        subscriptionManager.subscribe(conversationId,ws)

        // Assert
        const subscribers = subscriptionManager.getSubscribers(conversationId);

        expect(subscribers?.has(ws)).toBe(true);

    });

    it("should remove a websocket from a conversation when unsubscribed", () => {

        // Arrange
      
        const ws = {} as WebSocket;
        const conversationId = "conversation-1";

        subscriptionManager.subscribe(conversationId, ws);

        // Act
        subscriptionManager.unsubscribe(conversationId, ws);

        // Assert
        const subscribers = subscriptionManager.getSubscribers(conversationId);

        expect(subscribers?.has(ws)).toBe(false);
    });



});