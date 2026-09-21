import { WebSocket } from "ws";
import { getPublisher, getSubscriber, isRelayEnabled } from "../config/redis";
import { subscriptionManager } from "./subscriptionManager";
import { sendWs, WsResponse } from "./utility/wsResponse";
import { StatusCodes } from "http-status-codes";
import { WsEvent } from "./types/events";
import { connectionManager } from "./connectionManager";
import { RelayEnvelope, relayEnvelopeSchema } from "./schema/envelope";
import { loggers } from "../utility/logger/serviceLoggers";

export const RELAY_CHANNEL = "forge:relay";


export function relayBroadcast(type: WsEvent, ws: WebSocket, entityId: string, message: unknown): void {

    const deliverLocally = () => {
        const senderSession = connectionManager.getMetadata(ws)?.sessionId;
        subscriptionManager.getSubscribers(entityId)?.forEach((subscriber) => {
            if (connectionManager.getMetadata(subscriber)?.sessionId !== senderSession) {
                sendWs(subscriber, WsResponse.ok(type, "OK", StatusCodes.OK, message));
            }
        });

    }
    if (!isRelayEnabled()) {

        return deliverLocally()
    }
    try {
        const excludeSessionId = connectionManager.getMetadata(ws)?.sessionId;
        const relayedMessage = { message, entityId, excludeSessionId, eventType: type }
        getPublisher().publish(RELAY_CHANNEL, JSON.stringify(relayedMessage))

    } catch (error) {
        deliverLocally()

    }

}



export function deliverEnvelope(envelope: RelayEnvelope): void {
    const subscribers = subscriptionManager.getSubscribers(envelope.entityId);
    if (!subscribers) return;
    const response = WsResponse.ok(envelope.eventType, "OK", StatusCodes.OK, envelope.message);
    for (const s of subscribers) {
        if (connectionManager.getMetadata(s)?.sessionId === envelope.excludeSessionId) continue;
        sendWs(s, response);
    }

}

let started = false;
export function startRelay(): void {
    if (!isRelayEnabled() || started) return;
    const sub = getSubscriber();
    sub.on("message", (channel, raw) => {
        if (channel !== RELAY_CHANNEL) return;
        let parsed: unknown;
        try { parsed = JSON.parse(raw); } catch {
            loggers.audit.warn("Malformed JSON", parsed)
            return;
        } 
        
        const envelope = relayEnvelopeSchema.safeParse(parsed);
        if (!envelope.success) {
            loggers.audit.warn("RELAY_INVALID_ENVELOPE", {
                channel,
            })
            return;
        }
        deliverEnvelope(envelope.data);
    });
    sub.subscribe(RELAY_CHANNEL, (err) => {
        if (err) {

        }
    });
    started = true;
}

export function stopRelay(): void {
    if (!started) return;
    const sub = getSubscriber();
    sub.unsubscribe(RELAY_CHANNEL);
    sub.removeAllListeners("message");                   
    started = false;
}