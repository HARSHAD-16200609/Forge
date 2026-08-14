import { WebSocket } from "ws";

class SubscriptionManager {

    private readonly subscriptions = new Map<WebSocket, Set<string>>();
    private readonly subscribers = new Map<string, Set<WebSocket>>();

    subscribe(conversationId: string, ws: WebSocket): void {

        let conversationIds = this.subscriptions.get(ws)
        if (!conversationIds) {
            conversationIds = new Set<string>()
            this.subscriptions.set(ws, conversationIds)
        }

        conversationIds.add(conversationId)

        let subscribers = this.subscribers.get(conversationId)
        if (!subscribers) {
            subscribers = new Set<WebSocket>()
            this.subscribers.set(conversationId, subscribers)
        }

        subscribers.add(ws)
    }

    getSubscribers(conversationId: string): ReadonlySet<WebSocket> | undefined {
        return this.subscribers.get(conversationId)
    }
    getSubscriptions(ws: WebSocket): ReadonlySet<string> | undefined {
        return this.subscriptions.get(ws)
    }


    unsubscribe(conversationId: string, ws: WebSocket): void {
        const subscribers = this.subscribers.get(conversationId)
        if (!subscribers) {
            return
        }
        subscribers.delete(ws)
        if (subscribers.size == 0) {
            this.subscribers.delete(conversationId)
        }
        let subscriptions = this.subscriptions.get(ws)
        if (!subscriptions) {
            return
        }
        subscriptions.delete(conversationId)
        if (subscriptions.size === 0) {
            this.subscriptions.delete(ws);
        }

    }


    removeSocket(ws: WebSocket): void {
        const conversations = this.subscriptions.get(ws);

        if (!conversations) return;

        for (const conversationId of conversations) {

            const subscribers =
                this.subscribers.get(conversationId);

            if (!subscribers) continue;

            subscribers.delete(ws);

            if (subscribers.size === 0) {
                this.subscribers.delete(conversationId);
            }
        }

        this.subscriptions.delete(ws);
    }

}


export const subscriptionManager = new SubscriptionManager()