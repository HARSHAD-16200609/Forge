import { WebSocket } from "ws";

class SubscriptionManager {

    private readonly subscriptions = new Map<WebSocket, Set<string>>();
    private readonly subscribers = new Map<string, Set<WebSocket>>();

    subscribe(entityId: string, ws: WebSocket): void {

        let entityIds = this.subscriptions.get(ws)
        if (!entityIds) {
            entityIds = new Set<string>()
            this.subscriptions.set(ws, entityIds)
        }

        entityIds.add(entityId)

        let subscribers = this.subscribers.get(entityId)
        if (!subscribers) {
            subscribers = new Set<WebSocket>()
            this.subscribers.set(entityId, subscribers)
        }

        subscribers.add(ws)
    }

    getSubscribers(entityId: string): ReadonlySet<WebSocket> | undefined {
        return this.subscribers.get(entityId)
    }
    getSubscriptions(ws: WebSocket): ReadonlySet<string> | undefined {
        return this.subscriptions.get(ws)
    }


    unsubscribe(entityId: string, ws: WebSocket): void {
        const subscribers = this.subscribers.get(entityId)
        if (!subscribers) {
            return
        }
        subscribers.delete(ws)
        if (subscribers.size == 0) {
            this.subscribers.delete(entityId)
        }
        let subscriptions = this.subscriptions.get(ws)
        if (!subscriptions) {
            return
        }
        subscriptions.delete(entityId)
        if (subscriptions.size === 0) {
            this.subscriptions.delete(ws);
        }
 
    }


    removeSocket(ws: WebSocket): void {
        const entities = this.subscriptions.get(ws);

        if (!entities) return;

        for (const entityId of entities) {

            const subscribers =
                this.subscribers.get(entityId);

            if (!subscribers) continue;

            subscribers.delete(ws);

            if (subscribers.size === 0) {
                this.subscribers.delete(entityId);
            }
        }

        this.subscriptions.delete(ws);
    }

}


export const subscriptionManager = new SubscriptionManager()