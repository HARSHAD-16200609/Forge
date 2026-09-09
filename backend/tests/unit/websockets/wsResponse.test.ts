import { describe, it, expect, vi } from "vitest";
import { WebSocket } from "ws";
import { WsResponse, sendWs } from "../../../src/websockets/utility/wsResponse";
import { WsEvent } from "../../../src/websockets/types/events";
import { eventRouter } from "../../../src/websockets/eventRouter";
import { conversationHandler } from "../../../src/websockets/handlers/conversationHandler";

interface MockWs {
    readyState: number;
    send: ReturnType<typeof vi.fn>;
}

function mockWs(readyState: number = WebSocket.OPEN): MockWs {
    return { readyState, send: vi.fn() };
}

function sentFrame(ws: MockWs): {
    type: string;
    success: boolean;
    error?: { code: string };
} {
    return JSON.parse(ws.send.mock.calls[0]![0] as string);
}

describe("WsResponse", () => {
    it("should build a success frame with WsResponse.ok", () => {
        const response = WsResponse.ok(WsEvent.ConversationSubscribe, "Subscribed");

        expect(response.success).toBe(true);
        expect(response.type).toBe(WsEvent.ConversationSubscribe);
        expect(response.statusCode).toBe(200);
        expect(response.message).toBe("Subscribed");
        expect(response.error).toBeUndefined();
    });

    it("should build a failure frame with WsResponse.fail", () => {
        const response = WsResponse.fail(
            WsEvent.ConversationSubscribe,
            400,
            "VALIDATION_ERROR",
            "Invalid conversation payload"
        );

        expect(response.success).toBe(false);
        expect(response.type).toBe(WsEvent.ConversationSubscribe);
        expect(response.statusCode).toBe(400);
        expect(response.message).toBe("Invalid conversation payload");
        expect(response.error).toEqual({
            code: "VALIDATION_ERROR",
            errorMessage: "Invalid conversation payload",
        });
    });

    it("should always mark a frame with an error as unsuccessful", () => {
        const response = new WsResponse(400, WsEvent.error, true, "boom", {
            code: "VALIDATION_ERROR",
            errorMessage: "boom",
        });

        expect(response.success).toBe(false);
    });

    it("should serialize to the expected wire shape", () => {
        const response = WsResponse.fail(
            WsEvent.ConversationSubscribe,
            403,
            "FORBIDDEN",
            "Not a member"
        );

        expect(JSON.stringify(response)).toBe(
            JSON.stringify({
                type: "conversation.subscribe",
                success: false,
                message: "Not a member",
                statusCode: 403,
                error: { code: "FORBIDDEN", errorMessage: "Not a member" },
            })
        );
    });
});

describe("sendWs", () => {
    it("should send a JSON stringified response", () => {
        const ws = mockWs(WebSocket.OPEN);
        const response = WsResponse.ok(WsEvent.ConversationSubscribe, "OK");

        sendWs(ws as unknown as WebSocket, response);

        expect(ws.send).toHaveBeenCalledTimes(1);
        expect(ws.send).toHaveBeenCalledWith(JSON.stringify(response));
    });

    it("should not send when the socket is not open", () => {
        const ws = mockWs(WebSocket.CLOSED);

        sendWs(ws as unknown as WebSocket, WsResponse.fail(WsEvent.error, 500, "INTERNAL_ERROR", "boom"));

        expect(ws.send).not.toHaveBeenCalled();
    });
});

describe("EventRouter error handling", () => {
    it("should reply with an UNKNOWN_EVENT frame for an unregistered event type", async () => {
        const ws = mockWs(WebSocket.OPEN);

        await eventRouter.dispatch(ws as unknown as WebSocket, {
            type: "unknown.event" as WsEvent,
            payload: {},
        });

        expect(ws.send).toHaveBeenCalledTimes(1);
        const frame = sentFrame(ws);
        expect(frame.type).toBe("unknown.event");
        expect(frame.success).toBe(false);
        expect(frame.error?.code).toBe("UNKNOWN_EVENT");
    });

    it("should reply with a VALIDATION_ERROR frame when a handler rejects the payload", async () => {
        const ws = mockWs(WebSocket.OPEN);

        await conversationHandler.subscribe(ws as unknown as WebSocket, {
            type: WsEvent.ConversationSubscribe,
            payload: { conversationId: "not-a-uuid" },
        });

        expect(ws.send).toHaveBeenCalledTimes(1);
        const frame = sentFrame(ws);
        expect(frame.type).toBe("conversation.subscribe");
        expect(frame.success).toBe(false);
        expect(frame.error?.code).toBe("VALIDATION_ERROR");
    });
});