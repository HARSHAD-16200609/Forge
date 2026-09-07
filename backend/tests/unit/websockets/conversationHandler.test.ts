import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WebSocket } from "ws";
import { StatusCodes } from "http-status-codes";
import { conversationHandler } from "../../../src/websockets/handlers/conversationHandler";
import { subscriptionManager } from "../../../src/websockets/subscriptionManager";
import { connectionManager } from "../../../src/websockets/connectionManager";
import { workspaceRepository } from "../../../src/modules/Workspace/workspace.repository";
import { conversationRepository } from "../../../src/modules/Conversations/conversations.repository";
import { messageRepository } from "../../../src/modules/Messages/message.repository";
import { WsEvent } from "../../../src/websockets/types/events";
import { ConnectionMetadata } from "../../../src/websockets/types/auth";
import { Role } from "../../../generated/prisma/enums";

const WS_MEMBER = { id: "wm-1", role: Role.MEMBER };

vi.mock("../../../src/modules/Workspace/workspace.repository", () => ({
    workspaceRepository: {
        memberExists: vi.fn(),
    },
}));

vi.mock("../../../src/modules/Conversations/conversations.repository", () => ({
    conversationRepository: {
        conversationExists: vi.fn(),
    },
}));

vi.mock("../../../src/modules/Messages/message.repository", () => ({
    messageRepository: {
        postMessage: vi.fn(),
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

const CONVO_ID = "8b6e0b64-2c1f-4d2a-9a3c-7f9e2d1c4b5a";
const WORKSPACE_ID = "30a3aa89-92bc-4ecf-97d2-a642bc445c74";

const CONVERSATION_MEMBER = { conversation: { type: "DM", groupName: null } };

const validCreateMessage = {
    type: WsEvent.ConversationMessage,
    payload: { workspaceId: WORKSPACE_ID, conversationId: CONVO_ID, content: "hello" },
};

const authMocks = () => {
    vi.mocked(connectionManager.getMetadata).mockReturnValue(metadata);
    vi.mocked(workspaceRepository.memberExists).mockResolvedValue(WS_MEMBER);
    vi.mocked(conversationRepository.conversationExists).mockResolvedValue(CONVERSATION_MEMBER as never);
};

describe("conversationHandler.subscribe", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sentFrames.length = 0;
    });

    it("subscribes the socket and replies OK for a valid payload", async () => {
        authMocks();

        await conversationHandler.subscribe(ws, {
            type: WsEvent.ConversationSubscribe,
            payload: { conversationId: CONVO_ID },
        });

        expect(conversationRepository.conversationExists).toHaveBeenCalledWith(CONVO_ID, "user-1");
        expect(subscriptionManager.getSubscribers(CONVO_ID)?.has(ws)).toBe(true);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        const response = sent[0]!.response as { type: string; success: boolean };
        expect(response.type).toBe(WsEvent.ConversationSubscribe);
        expect(response.success).toBe(true);
    });

    it("rejects with FORBIDDEN when not a conversation member", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(metadata);
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue(WS_MEMBER);
        vi.mocked(conversationRepository.conversationExists).mockResolvedValue(null);

        await conversationHandler.subscribe(ws, {
            type: WsEvent.ConversationSubscribe,
            payload: { conversationId: CONVO_ID },
        });

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        expect(sent[0]!.response as { statusCode: number }).toMatchObject({ statusCode: StatusCodes.FORBIDDEN });
        expect(subscriptionManager.getSubscribers(CONVO_ID)).toBeUndefined();
    });
});

describe("conversationHandler.unsubscribe", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sentFrames.length = 0;
    });

    it("removes the socket from the conversation and replies OK", async () => {
        authMocks();
        subscriptionManager.subscribe(CONVO_ID, ws);

        await conversationHandler.unsubscribe(ws, {
            type: WsEvent.ConversationUnsubscribe,
            payload: { conversationId: CONVO_ID },
        });

        expect(subscriptionManager.getSubscribers(CONVO_ID)).toBeUndefined();
        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        const response = sent[0]!.response as { type: string; success: boolean };
        expect(response.type).toBe(WsEvent.ConversationUnsubscribe);
        expect(response.success).toBe(true);
    });

    it("rejects an invalid payload with VALIDATION_ERROR", async () => {
        await conversationHandler.unsubscribe(ws, {
            type: WsEvent.ConversationUnsubscribe,
            payload: { conversationId: "not-a-uuid" },
        });

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        expect(sent[0]!.response as { statusCode: number }).toMatchObject({ statusCode: StatusCodes.BAD_REQUEST });
    });
});

describe("conversationHandler.createMessage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sentFrames.length = 0;
    });

    it("posts a conversation message and replies with conversation.message.created", async () => {
        authMocks();
        const posts = { message: { id: "cm-1" }, uploads: [] };
        vi.mocked(messageRepository.postMessage).mockResolvedValue(posts as never);

        await conversationHandler.createMessage(ws, validCreateMessage);

        expect(messageRepository.postMessage).toHaveBeenCalledWith(
            { conversationId: CONVO_ID, content: "hello", senderId: "user-1" },
            [],
            "user-1"
        );
        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        const response = sent[0]!.response as { type: string; success: boolean; message: string };
        expect(response.type).toBe(WsEvent.ConversationMessageCreated);
        expect(response.success).toBe(true);
        expect(JSON.parse(response.message)).toEqual(posts);
    });

    it("forwards uploadIds and broadcasts to conversation subscribers excluding the sender", async () => {
        authMocks();
        const posts = { message: { id: "cm-2" }, uploads: [] };
        vi.mocked(messageRepository.postMessage).mockResolvedValue(posts as never);

        const otherWs = { readyState: WebSocket.OPEN } as WebSocket;
        subscriptionManager.subscribe(CONVO_ID, otherWs);

        const uploadIds = ["00000000-0000-4000-8000-000000000001", "00000000-0000-4000-8000-000000000002"];
        await conversationHandler.createMessage(ws, {
            type: WsEvent.ConversationMessage,
            payload: { workspaceId: WORKSPACE_ID, conversationId: CONVO_ID, content: "", uploadIds },
        });

        expect(messageRepository.postMessage).toHaveBeenCalledWith(
            { conversationId: CONVO_ID, content: "", senderId: "user-1" },
            uploadIds,
            "user-1"
        );
        const sent = sentFrames;
        expect(sent).toHaveLength(2);
        expect(sent.find((f) => f.ws === ws)).toBeDefined();
        expect(sent.find((f) => f.ws === otherWs)).toBeDefined();
        expect(sent.filter((f) => f.ws === ws)).toHaveLength(1);
        subscriptionManager.unsubscribe(CONVO_ID, otherWs);
    });

    it("still replies to the sender when no subscribers exist", async () => {
        authMocks();
        const posts = { message: { id: "cm-3" }, uploads: [] };
        vi.mocked(messageRepository.postMessage).mockResolvedValue(posts as never);

        await conversationHandler.createMessage(ws, validCreateMessage);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        expect(sent[0]!.ws).toBe(ws);
    });

    it("rejects empty content with no uploads as VALIDATION_ERROR", async () => {
        authMocks();

        await conversationHandler.createMessage(ws, {
            type: WsEvent.ConversationMessage,
            payload: { workspaceId: WORKSPACE_ID, conversationId: CONVO_ID, content: "   " },
        });

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        const response = sent[0]!.response as { statusCode: number; error: { code: string } };
        expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
        expect(response.error?.code).toBe("VALIDATION_ERROR");
        expect(messageRepository.postMessage).not.toHaveBeenCalled();
    });

    it("rejects more than 3 uploadIds as VALIDATION_ERROR", async () => {
        authMocks();

        await conversationHandler.createMessage(ws, {
            type: WsEvent.ConversationMessage,
            payload: {
                workspaceId: WORKSPACE_ID,
                conversationId: CONVO_ID,
                content: "hi",
                uploadIds: ["1", "2", "3", "4"],
            },
        });

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        expect(sent[0]!.response as { statusCode: number }).toMatchObject({ statusCode: StatusCodes.BAD_REQUEST });
        expect(messageRepository.postMessage).not.toHaveBeenCalled();
    });

    it("rejects unauthenticated users with UNAUTHORIZED", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(undefined);

        await conversationHandler.createMessage(ws, validCreateMessage);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        expect(sent[0]!.response as { statusCode: number }).toMatchObject({ statusCode: StatusCodes.UNAUTHORIZED });
        expect(messageRepository.postMessage).not.toHaveBeenCalled();
    });

    it("rejects with FORBIDDEN when not a workspace member", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(metadata);
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue(null);

        await conversationHandler.createMessage(ws, validCreateMessage);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        expect(sent[0]!.response as { statusCode: number }).toMatchObject({ statusCode: StatusCodes.FORBIDDEN });
        expect(messageRepository.postMessage).not.toHaveBeenCalled();
    });

    it("rejects with FORBIDDEN when not a conversation member", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(metadata);
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue(WS_MEMBER);
        vi.mocked(conversationRepository.conversationExists).mockResolvedValue(null);

        await conversationHandler.createMessage(ws, validCreateMessage);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        expect(sent[0]!.response as { statusCode: number }).toMatchObject({ statusCode: StatusCodes.FORBIDDEN });
        expect(messageRepository.postMessage).not.toHaveBeenCalled();
    });

    it("propagates postMessage failures so the router can handle them", async () => {
        authMocks();
        vi.mocked(messageRepository.postMessage).mockRejectedValue(new Error("db down"));

        await expect(conversationHandler.createMessage(ws, validCreateMessage)).rejects.toThrow("db down");
    });
});

afterEach(() => {
    subscriptionManager.removeSocket(ws);
});