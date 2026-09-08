import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WebSocket } from "ws";
import { StatusCodes } from "http-status-codes";
import { presenceHandler } from "../../../src/websockets/presenceManager";
import { eventRouter } from "../../../src/websockets/eventRouter";
import { connectionManager } from "../../../src/websockets/connectionManager";
import { subscriptionManager } from "../../../src/websockets/subscriptionManager";
import { workspaceRepository } from "../../../src/modules/Workspace/workspace.repository";
import { WsEvent } from "../../../src/websockets/types/events";
import { ConnectionMetadata } from "../../../src/websockets/types/auth";
import { Role } from "../../../generated/prisma/enums";

const WS_MEMBER = { id: "wm-1", role: Role.MEMBER };

vi.mock("../../../src/modules/Workspace/workspace.repository", () => ({
    workspaceRepository: {
        memberExists: vi.fn(),
    },
}));

vi.mock("../../../src/websockets/connectionManager", () => ({
    connectionManager: {
        getMetadata: vi.fn(),
    },
}));

vi.mock("../../../src/websockets/subscriptionManager", () => ({
    subscriptionManager: {
        removeSocket: vi.fn(),
        unsubscribe: vi.fn(),
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
const otherWs = { readyState: WebSocket.OPEN } as WebSocket;
const thirdWs = { readyState: WebSocket.OPEN } as WebSocket;

const metadataFor = (userId: string, username: string): ConnectionMetadata => ({
    userId,
    username,
    sessionId: `session-${userId}`,
    connectedAt: new Date(),
});

const ALICE = metadataFor("user-1", "alice");
const BOB = metadataFor("user-2", "bob");

const WORKSPACE_A = "30a3aa89-92bc-4ecf-97d2-a642bc445c74";
const WORKSPACE_B = "8b6e0b64-2c1f-4d2a-9a3c-7f9e2d1c4b5a";

const presenceMessage = (workspaceId: string) => ({
    type: WsEvent.PresenceUpdate,
    payload: { workspaceId },
});

const asFrame = (response: unknown) => response as {
    type: string;
    success: boolean;
    statusCode: number;
    data?: {
        workspaceId?: string;
        online?: { userId: string; username: string }[];
        userId?: string;
        username?: string;
        status?: string;
    };
    error?: { code: string };
};

const framesFor = (targetWs: WebSocket) =>
    sentFrames.filter((f) => f.ws === targetWs).map((f) => asFrame(f.response));

const metadataMap = new Map<WebSocket, ConnectionMetadata>();

const setMetadata = (socket: WebSocket, metadata: ConnectionMetadata) => {
    metadataMap.set(socket, metadata);
    vi.mocked(connectionManager.getMetadata).mockImplementation((socketRef) =>
        metadataMap.get(socketRef)
    );
};

const registerSocket = async (socket: WebSocket, metadata: ConnectionMetadata, workspaceId: string) => {
    setMetadata(socket, metadata);
    await presenceHandler.registerConnection(socket, presenceMessage(workspaceId));
};

describe("presenceHandler.registerConnection", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sentFrames.length = 0;
        metadataMap.clear();
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue(WS_MEMBER);
    });

    afterEach(() => {
        presenceHandler.removeConnection(ws);
        presenceHandler.removeConnection(otherWs);
        presenceHandler.removeConnection(thirdWs);
    });

    it("registers online and replies with the workspace roster while broadcasting online to other members excluding the sender", async () => {
        await registerSocket(otherWs, BOB, WORKSPACE_A);
        await registerSocket(ws, ALICE, WORKSPACE_A);

        const aliceFrames = framesFor(ws);
        const bobFrames = framesFor(otherWs);

        expect(aliceFrames).toHaveLength(1);
        expect(aliceFrames[0]!.type).toBe(WsEvent.PresenceUpdate);
        expect(aliceFrames[0]!.success).toBe(true);
        expect(aliceFrames[0]!.statusCode).toBe(StatusCodes.OK);
        expect(aliceFrames[0]!.data?.workspaceId).toBe(WORKSPACE_A);
        expect(aliceFrames[0]!.data?.online).toHaveLength(2);
        expect(aliceFrames[0]!.data?.online).toEqual(expect.arrayContaining([
            { userId: "user-1", username: "alice" },
            { userId: "user-2", username: "bob" },
        ]));

        const onlineBroadcast = bobFrames.filter((f) => f.data?.status === "online");

        expect(onlineBroadcast).toHaveLength(1);
        expect(onlineBroadcast[0]!.data).toEqual({
            workspaceId: WORKSPACE_A,
            userId: "user-1",
            username: "alice",
            status: "online",
        });
    });

    it("dedupes the roster when a user has multiple sockets online in the workspace", async () => {
        await registerSocket(otherWs, BOB, WORKSPACE_A);
        await registerSocket(thirdWs, ALICE, WORKSPACE_A);
        await registerSocket(ws, ALICE, WORKSPACE_A);

        const aliceFrames = framesFor(ws);
        expect(aliceFrames[0]!.data?.online).toHaveLength(2);
        expect(aliceFrames[0]!.data?.online).toEqual(expect.arrayContaining([
            { userId: "user-1", username: "alice" },
            { userId: "user-2", username: "bob" },
        ]));
    });

    it("is idempotent when re-registering the same workspace (no broadcast, no wipe)", async () => {
        await registerSocket(ws, ALICE, WORKSPACE_A);
        await registerSocket(ws, ALICE, WORKSPACE_A);

        expect(framesFor(ws)).toHaveLength(1);
        expect(framesFor(otherWs)).toHaveLength(0);
        expect(subscriptionManager.removeSocket).not.toHaveBeenCalled();
    });

    it("moves the socket to the new workspace, wipes subscriptions, and broadcasts offline to the old workspace", async () => {
        await registerSocket(otherWs, BOB, WORKSPACE_A);
        await registerSocket(ws, ALICE, WORKSPACE_A);
        sentFrames.length = 0;

        await registerSocket(ws, ALICE, WORKSPACE_B);

        expect(subscriptionManager.removeSocket).toHaveBeenCalledWith(ws);
        expect(presenceHandler.getWorkspace(ws)).toBe(WORKSPACE_B);

        const bobFrames = framesFor(otherWs);
        expect(bobFrames).toHaveLength(1);
        expect(bobFrames[0]!.data).toEqual({
            workspaceId: WORKSPACE_A,
            userId: "user-1",
            username: "alice",
            status: "offline",
        });

        const aliceFrames = framesFor(ws);
        expect(aliceFrames).toHaveLength(1);
        expect(aliceFrames[0]!.data?.workspaceId).toBe(WORKSPACE_B);
        expect(aliceFrames[0]!.data?.online).toEqual([
            { userId: "user-1", username: "alice" },
        ]);
    });

    it("does not broadcast offline on a switch while the user keeps another socket in the old workspace", async () => {
        await registerSocket(otherWs, BOB, WORKSPACE_A);
        await registerSocket(thirdWs, ALICE, WORKSPACE_A);
        await registerSocket(ws, ALICE, WORKSPACE_A);
        sentFrames.length = 0;

        await registerSocket(ws, ALICE, WORKSPACE_B);

        expect(presenceHandler.getWorkspace(ws)).toBe(WORKSPACE_B);
        const bobFrames = framesFor(otherWs);
        const offlineFrames = bobFrames.filter((f) => f.data?.status === "offline");
        expect(offlineFrames).toHaveLength(0);
    });

    it("rejects unauthenticated users with UNAUTHORIZED", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(undefined);

        await presenceHandler.registerConnection(ws, presenceMessage(WORKSPACE_A));

        const frames = framesFor(ws);
        expect(frames).toHaveLength(1);
        expect(frames[0]!.statusCode).toBe(StatusCodes.UNAUTHORIZED);
    });

    it("rejects non-members with FORBIDDEN", async () => {
        setMetadata(ws, ALICE);
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue(null);

        await presenceHandler.registerConnection(ws, presenceMessage(WORKSPACE_A));

        const frames = framesFor(ws);
        expect(frames).toHaveLength(1);
        expect(frames[0]!.statusCode).toBe(StatusCodes.FORBIDDEN);
    });

    it("rejects invalid payloads with VALIDATION_ERROR", async () => {
        setMetadata(ws, ALICE);

        await presenceHandler.registerConnection(ws, {
            type: WsEvent.PresenceUpdate,
            payload: { workspaceId: "not-a-uuid" },
        });

        const frames = framesFor(ws);
        expect(frames).toHaveLength(1);
        expect(frames[0]!.statusCode).toBe(StatusCodes.BAD_REQUEST);
        expect(frames[0]!.error?.code).toBe("VALIDATION_ERROR");
    });
});

describe("presenceHandler.removeConnection + notifyOffline", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sentFrames.length = 0;
        metadataMap.clear();
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue(WS_MEMBER);
    });

    afterEach(() => {
        presenceHandler.removeConnection(ws);
        presenceHandler.removeConnection(otherWs);
        presenceHandler.removeConnection(thirdWs);
    });

    it("broadcasts offline to the workspace when the last socket of a user closes", async () => {
        await registerSocket(ws, ALICE, WORKSPACE_A);
        await registerSocket(otherWs, BOB, WORKSPACE_A);
        sentFrames.length = 0;

        const previousWorkspaceId = presenceHandler.removeConnection(ws);

        expect(previousWorkspaceId).toBe(WORKSPACE_A);
        expect(presenceHandler.isUserOnlineInWorkspace(WORKSPACE_A, "user-1")).toBe(false);

        presenceHandler.notifyOffline(WORKSPACE_A, "user-1", "alice");

        const bobFrames = framesFor(otherWs);
        expect(bobFrames).toHaveLength(1);
        expect(bobFrames[0]!.data).toEqual({
            workspaceId: WORKSPACE_A,
            userId: "user-1",
            username: "alice",
            status: "offline",
        });
    });

    it("keeps the user online while a second socket remains in the workspace", async () => {
        await registerSocket(ws, ALICE, WORKSPACE_A);
        await registerSocket(thirdWs, ALICE, WORKSPACE_A);

        presenceHandler.removeConnection(ws);

        expect(presenceHandler.isUserOnlineInWorkspace(WORKSPACE_A, "user-1")).toBe(true);
    });
});

describe("eventRouter.dispatch presence path", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sentFrames.length = 0;
        metadataMap.clear();
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue(WS_MEMBER);
    });

    afterEach(() => {
        presenceHandler.removeConnection(ws);
        presenceHandler.removeConnection(otherWs);
    });

    it("dispatches presence.update through the router without throwing on the bound handler", async () => {
        await registerSocket(otherWs, BOB, WORKSPACE_A);
        setMetadata(ws, ALICE);
        sentFrames.length = 0;

        await expect(
            eventRouter.dispatch(ws, presenceMessage(WORKSPACE_A))
        ).resolves.toBeUndefined();

        const bobFrames = framesFor(otherWs);
        expect(bobFrames).toHaveLength(1);
        expect(bobFrames[0]!.type).toBe(WsEvent.PresenceUpdate);
        expect(bobFrames[0]!.success).toBe(true);
        expect(bobFrames[0]!.data).toEqual({
            workspaceId: WORKSPACE_A,
            userId: "user-1",
            username: "alice",
            status: "online",
        });
    });
});