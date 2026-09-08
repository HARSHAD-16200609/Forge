import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WebSocket } from "ws";
import { StatusCodes } from "http-status-codes";
import { typingHandler } from "../../../src/websockets/handlers/typingHandler";
import { eventRouter } from "../../../src/websockets/eventRouter";
import { subscriptionManager } from "../../../src/websockets/subscriptionManager";
import { connectionManager } from "../../../src/websockets/connectionManager";
import { workspaceRepository } from "../../../src/modules/Workspace/workspace.repository";
import { channelRepository } from "../../../src/modules/Channel/channel.repository";
import { conversationRepository } from "../../../src/modules/Conversations/conversations.repository";
import { WsEvent } from "../../../src/websockets/types/events";
import { ConnectionMetadata } from "../../../src/websockets/types/auth";
import { Role } from "../../../generated/prisma/enums";

const WS_MEMBER = { id: "wm-1", role: Role.MEMBER };

vi.mock("../../../src/modules/Workspace/workspace.repository", () => ({
    workspaceRepository: {
        memberExists: vi.fn(),
    },
}));

vi.mock("../../../src/modules/Channel/channel.repository", () => ({
    channelRepository: {
        memberExists: vi.fn(),
    },
}));

vi.mock("../../../src/modules/Conversations/conversations.repository", () => ({
    conversationRepository: {
        conversationExists: vi.fn(),
    },
}));

vi.mock("../../../src/websockets/connectionManager", () => ({
    connectionManager: {
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

const metadata: ConnectionMetadata = {
    userId: "user-1",
    sessionId: "session-1",
    connectedAt: new Date(),
};

const WORKSPACE_ID = "30a3aa89-92bc-4ecf-97d2-a642bc445c74";
const CHANNEL_ID = "f5f63127-9f69-446d-b5a1-82d25fc45a96";
const CONVO_ID = "8b6e0b64-2c1f-4d2a-9a3c-7f9e2d1c4b5a";

const authMocks = () => {
    vi.mocked(connectionManager.getMetadata).mockReturnValue(metadata);
    vi.mocked(workspaceRepository.memberExists).mockResolvedValue(WS_MEMBER);
};

const lastFrame = () => sentFrames[sentFrames.length - 1]!.response as {
    type: string;
    success: boolean;
    statusCode: number;
    data?: { userId: string; entityId: string };
    error?: { code: string };
};

describe("typingHandler.typingStart", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sentFrames.length = 0;
    });

    it("forwards typing.start to channel subscribers excluding the sender with userId + entityId", async () => {
        authMocks();
        vi.mocked(channelRepository.memberExists).mockResolvedValue({ id: "cm-1" } as never);

        const otherWs = { readyState: WebSocket.OPEN } as WebSocket;
        subscriptionManager.subscribe(CHANNEL_ID, ws);
        subscriptionManager.subscribe(CHANNEL_ID, otherWs);

        await typingHandler.typingStart(ws, {
            type: WsEvent.TypingStart,
            payload: { workspaceId: WORKSPACE_ID, entityId: CHANNEL_ID, entityType: "channel" },
        });

        expect(workspaceRepository.memberExists).toHaveBeenCalledWith("user-1", WORKSPACE_ID);
        expect(channelRepository.memberExists).toHaveBeenCalledWith("wm-1", CHANNEL_ID);
        expect(conversationRepository.conversationExists).not.toHaveBeenCalled();

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        expect(sent[0]!.ws).toBe(otherWs);
        expect(sent.find((f) => f.ws === ws)).toBeUndefined();

        const response = lastFrame();
        expect(response.type).toBe(WsEvent.TypingStart);
        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(StatusCodes.OK);
        expect(response.data).toEqual({ userId: "user-1", entityId: CHANNEL_ID });

        subscriptionManager.unsubscribe(CHANNEL_ID, ws);
        subscriptionManager.unsubscribe(CHANNEL_ID, otherWs);
    });

    it("silently no-ops when no one is subscribed to the entity", async () => {
        authMocks();
        vi.mocked(channelRepository.memberExists).mockResolvedValue({ id: "cm-1" } as never);

        await typingHandler.typingStart(ws, {
            type: WsEvent.TypingStart,
            payload: { workspaceId: WORKSPACE_ID, entityId: CHANNEL_ID, entityType: "channel" },
        });

        expect(sentFrames).toHaveLength(0);
    });

    it("rejects unauthenticated users with UNAUTHORIZED", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(undefined);

        await typingHandler.typingStart(ws, {
            type: WsEvent.TypingStart,
            payload: { workspaceId: WORKSPACE_ID, entityId: CHANNEL_ID, entityType: "channel" },
        });

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        expect(sent[0]!.response as { statusCode: number }).toMatchObject({ statusCode: StatusCodes.UNAUTHORIZED });
    });

    it("rejects with FORBIDDEN when not a workspace member", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(metadata);
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue(null);

        await typingHandler.typingStart(ws, {
            type: WsEvent.TypingStart,
            payload: { workspaceId: WORKSPACE_ID, entityId: CHANNEL_ID, entityType: "channel" },
        });

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        expect(sent[0]!.response as { statusCode: number }).toMatchObject({ statusCode: StatusCodes.FORBIDDEN });
    });

    it("rejects with FORBIDDEN when not a channel member", async () => {
        authMocks();
        vi.mocked(channelRepository.memberExists).mockResolvedValue(null);

        await typingHandler.typingStart(ws, {
            type: WsEvent.TypingStart,
            payload: { workspaceId: WORKSPACE_ID, entityId: CHANNEL_ID, entityType: "channel" },
        });

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        expect(sent[0]!.response as { statusCode: number }).toMatchObject({ statusCode: StatusCodes.FORBIDDEN });
    });

    it("rejects invalid payloads with VALIDATION_ERROR", async () => {
        authMocks();

        await typingHandler.typingStart(ws, {
            type: WsEvent.TypingStart,
            payload: { workspaceId: WORKSPACE_ID, entityId: "not-a-uuid", entityType: "channel" },
        });
        await typingHandler.typingStart(ws, {
            type: WsEvent.TypingStart,
            payload: { workspaceId: WORKSPACE_ID, entityId: CHANNEL_ID, entityType: "banana" },
        });

        const sent = sentFrames;
        expect(sent).toHaveLength(2);
        for (const frame of sent) {
            const response = frame.response as { statusCode: number; error: { code: string } };
            expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
            expect(response.error?.code).toBe("VALIDATION_ERROR");
        }
    });
});

describe("typingHandler.typingStop", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sentFrames.length = 0;
    });

    it("forwards typing.stop to conversation subscribers excluding the sender", async () => {
        authMocks();
        vi.mocked(conversationRepository.conversationExists).mockResolvedValue({ id: CONVO_ID } as never);

        const otherWs = { readyState: WebSocket.OPEN } as WebSocket;
        subscriptionManager.subscribe(CONVO_ID, ws);
        subscriptionManager.subscribe(CONVO_ID, otherWs);

        await typingHandler.typingStop(ws, {
            type: WsEvent.TypingStop,
            payload: { workspaceId: WORKSPACE_ID, entityId: CONVO_ID, entityType: "conversation" },
        });

        expect(workspaceRepository.memberExists).toHaveBeenCalledWith("user-1", WORKSPACE_ID);
        expect(conversationRepository.conversationExists).toHaveBeenCalledWith(CONVO_ID, "user-1");
        expect(channelRepository.memberExists).not.toHaveBeenCalled();

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        expect(sent[0]!.ws).toBe(otherWs);

        const response = lastFrame();
        expect(response.type).toBe(WsEvent.TypingStop);
        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(StatusCodes.OK);
        expect(response.data).toEqual({ userId: "user-1", entityId: CONVO_ID });

        subscriptionManager.unsubscribe(CONVO_ID, ws);
        subscriptionManager.unsubscribe(CONVO_ID, otherWs);
    });

    it("rejects with FORBIDDEN when not a conversation member", async () => {
        authMocks();
        vi.mocked(conversationRepository.conversationExists).mockResolvedValue(null);

        await typingHandler.typingStop(ws, {
            type: WsEvent.TypingStop,
            payload: { workspaceId: WORKSPACE_ID, entityId: CONVO_ID, entityType: "conversation" },
        });

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        expect(sent[0]!.response as { statusCode: number }).toMatchObject({ statusCode: StatusCodes.FORBIDDEN });
    });
});

describe("eventRouter.dispatch typing path", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sentFrames.length = 0;
    });

    it("dispatches typing.start to the registered handler and fans out to subscribers", async () => {
        authMocks();
        vi.mocked(channelRepository.memberExists).mockResolvedValue({ id: "cm-1" } as never);

        const otherWs = { readyState: WebSocket.OPEN } as WebSocket;
        subscriptionManager.subscribe(CHANNEL_ID, ws);
        subscriptionManager.subscribe(CHANNEL_ID, otherWs);

        await eventRouter.dispatch(ws, {
            type: WsEvent.TypingStart,
            payload: { workspaceId: WORKSPACE_ID, entityId: CHANNEL_ID, entityType: "channel" },
        });

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        expect(sent[0]!.ws).toBe(otherWs);
        const response = sent[0]!.response as { type: string; success: boolean; statusCode: number; data: { userId: string; entityId: string } };
        expect(response.type).toBe(WsEvent.TypingStart);
        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(StatusCodes.OK);
        expect(response.data).toEqual({ userId: "user-1", entityId: CHANNEL_ID });

        subscriptionManager.unsubscribe(CHANNEL_ID, ws);
        subscriptionManager.unsubscribe(CHANNEL_ID, otherWs);
    });

    it("dispatches typing.stop through the router without throwing on an unbound handler", async () => {
        authMocks();
        vi.mocked(conversationRepository.conversationExists).mockResolvedValue({ id: CONVO_ID } as never);

        const otherWs = { readyState: WebSocket.OPEN } as WebSocket;
        subscriptionManager.subscribe(CONVO_ID, otherWs);

        await expect(
            eventRouter.dispatch(ws, {
                type: WsEvent.TypingStop,
                payload: { workspaceId: WORKSPACE_ID, entityId: CONVO_ID, entityType: "conversation" },
            })
        ).resolves.toBeUndefined();

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        expect(sent[0]!.ws).toBe(otherWs);
        const response = sent[0]!.response as { type: string; success: boolean };
        expect(response.type).toBe(WsEvent.TypingStop);
        expect(response.success).toBe(true);

        subscriptionManager.unsubscribe(CONVO_ID, otherWs);
    });
});

afterEach(() => {
    subscriptionManager.removeSocket(ws);
});