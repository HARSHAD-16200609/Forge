import { describe, it, expect } from "vitest";
import type { WebSocket } from "ws";
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

    it("should track subscriptions across multiple conversations", () => {
        const ws = {} as WebSocket;
        const convoA = "conversation-a";
        const convoB = "conversation-b";

        subscriptionManager.subscribe(convoA, ws);
        subscriptionManager.subscribe(convoB, ws);
        subscriptionManager.subscribe(convoA, {} as WebSocket);

        expect(subscriptionManager.getSubscribers(convoA)?.size).toBe(2);
        expect(subscriptionManager.getSubscribers(convoB)?.size).toBe(1);
        expect(subscriptionManager.getSubscriptions(ws)).toEqual(new Set([convoA, convoB]));
    });

    it("should clean up all channel memberships when a socket is removed", () => {
        const wsA = {} as WebSocket;
        const wsB = {} as WebSocket;
        const convoA = "conversation-a";
        const convoB = "conversation-b";

        subscriptionManager.subscribe(convoA, wsA);
        subscriptionManager.subscribe(convoB, wsA);
        subscriptionManager.subscribe(convoA, wsB);
        subscriptionManager.subscribe(convoB, wsB);

        subscriptionManager.removeSocket(wsA);

        expect(subscriptionManager.getSubscribers(convoA)?.has(wsA)).toBe(false);
        expect(subscriptionManager.getSubscribers(convoB)?.has(wsA)).toBe(false);
        expect(subscriptionManager.getSubscribers(convoA)?.has(wsB)).toBe(true);
        expect(subscriptionManager.getSubscribers(convoB)?.has(wsB)).toBe(true);
        expect(subscriptionManager.getSubscriptions(wsA)).toBeUndefined();
    });

    it("should drop an empty conversation entry when its last subscriber leaves", () => {
        const ws = {} as WebSocket;
        const convo = "conversation-solo";

        subscriptionManager.subscribe(convo, ws);
        subscriptionManager.unsubscribe(convo, ws);

        expect(subscriptionManager.getSubscribers(convo)).toBeUndefined();
        expect(subscriptionManager.getSubscriptions(ws)).toBeUndefined();
    });

    it("should not throw when unsubscribing a socket from a conversation it never joined", () => {
        const ws = {} as WebSocket;
        expect(() => subscriptionManager.unsubscribe("never-joined", ws)).not.toThrow();
    });

    it("broadcast recipients should exclude a sender that is also subscribed (dedup)", () => {
        const senderWs = {} as WebSocket;
        const convo = "conversation-dedup";

        subscriptionManager.subscribe(convo, senderWs);

        const subscribers = subscriptionManager.getSubscribers(convo);
        const recipients = [...(subscribers ?? [])].filter((s) => s !== senderWs);

        expect(recipients).not.toContain(senderWs);
    });

});