import { describe, it, expect, vi, beforeEach } from "vitest";
import { WebSocket } from "ws";
import { StatusCodes } from "http-status-codes";
import { heartbeatHandler } from "../../../src/websockets/handlers/heartbeatHandler";
import { heartbeatManager } from "../../../src/websockets/heartbeatManager";
import { eventRouter } from "../../../src/websockets/eventRouter";
import { connectionManager } from "../../../src/websockets/connectionManager";
import { WsEvent } from "../../../src/websockets/types/events";
import { ConnectionMetadata } from "../../../src/websockets/types/auth";

vi.mock("../../../src/websockets/connectionManager", () => ({
    connectionManager: {
        getAllConnections: vi.fn(),
        getMetadata: vi.fn(),
    },
}));

const { sentFrames } = vi.hoisted(() => ({
    sentFrames: [] as { ws: WebSocket; response: unknown }[],
}));

vi.mock("../../../src/websockets/utility/wsResponse", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../../src/websockets/utility/wsResponse")>();
    return {
        ...actual,
        sendWs: vi.fn((ws: WebSocket, response: unknown) => {
            sentFrames.push({ ws, response });
        }),
    };
});

const ws = { readyState: WebSocket.OPEN } as WebSocket;

const asFrame = (response: unknown) => response as {
    type: string;
    success: boolean;
    statusCode: number;
    data?: { timestamp?: number; serverTime: number };
};

const lastFrame = () => asFrame(sentFrames[sentFrames.length - 1]!.response);

const metadataFor = (lastSeenAt: Date): ConnectionMetadata => ({
    userId: "user-1",
    sessionId: "session-1",
    connectedAt: new Date(),
    username: "alice",
    lastSeenAt,
});

describe("heartbeatHandler.ping", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sentFrames.length = 0;
    });

    it("replies with a pong carrying the server time", async () => {
        await heartbeatHandler.ping(ws, { type: WsEvent.Ping, payload: {} });

        const frame = lastFrame();
        expect(sentFrames).toHaveLength(1);
        expect(frame.type).toBe(WsEvent.Pong);
        expect(frame.success).toBe(true);
        expect(frame.statusCode).toBe(StatusCodes.OK);
        expect(typeof frame.data?.serverTime).toBe("number");
    });

    it("echoes a client timestamp when present", async () => {
        const timestamp = 123456789;
        await heartbeatHandler.ping(ws, { type: WsEvent.Ping, payload: { timestamp } });

        const frame = lastFrame();
        expect(frame.data).toEqual({ timestamp, serverTime: expect.any(Number) });
    });

    it("replies to pings with unknown payloads without failing", async () => {
        await heartbeatHandler.ping(ws, { type: WsEvent.Ping, payload: "garbage" });

        const frame = lastFrame();
        expect(frame.type).toBe(WsEvent.Pong);
        expect(frame.success).toBe(true);
    });
});

describe("eventRouter.dispatch ping path", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sentFrames.length = 0;
    });

    it("dispatches ping to the pong reply through the router without throwing", async () => {
        await expect(
            eventRouter.dispatch(ws, { type: WsEvent.Ping, payload: {} })
        ).resolves.toBeUndefined();

        const frame = lastFrame();
        expect(frame.type).toBe(WsEvent.Pong);
        expect(frame.success).toBe(true);
    });
});

describe("heartbeatManager.checkSockets", () => {
    const staleSocket = { term: vi.fn(), terminate: vi.fn() } as unknown as WebSocket;
    const freshSocket = { term: vi.fn(), terminate: vi.fn() } as unknown as WebSocket;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(connectionManager.getAllConnections).mockReturnValue(
            new Set([staleSocket, freshSocket])
        );
        vi.mocked(connectionManager.getMetadata).mockImplementation((socketRef) => {
            if (socketRef === staleSocket) {
                return metadataFor(new Date(Date.now() - 2_000));
            }
            if (socketRef === freshSocket) {
                return metadataFor(new Date());
            }
            return undefined;
        });
    });

    it("terminates only sockets that have been silent beyond the timeout", () => {
        heartbeatManager.checkSockets(1_000);

        expect(staleSocket.terminate).toHaveBeenCalledTimes(1);
        expect(freshSocket.terminate).not.toHaveBeenCalled();
    });

    it("does not terminate sockets registered without metadata", () => {
        vi.mocked(connectionManager.getAllConnections).mockReturnValue(
            new Set([staleSocket])
        );
        vi.mocked(connectionManager.getMetadata).mockReturnValue(undefined);

        heartbeatManager.checkSockets(1_000);

        expect(staleSocket.terminate).not.toHaveBeenCalled();
    });
});