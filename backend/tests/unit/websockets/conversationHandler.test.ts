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
        messageExists: vi.fn(),
        editMessage: vi.fn(),
        deleteMessage: vi.fn(),
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
    lastSeenAt: new Date(),
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
        const response = sent[0]!.response as { type: string; success: boolean; data: unknown };
        expect(response.type).toBe(WsEvent.ConversationMessageCreated);
        expect(response.success).toBe(true);
        expect(response.data).toEqual(posts);
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

describe("conversationHandler.updateMessage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sentFrames.length = 0;
    });

    const MESSAGE_ID = "12121212-1212-4212-8212-121212121212";
    const OTHER_CONVO_ID = "66666666-6666-4666-8666-666666666666";

    const convoPost = {
        id: MESSAGE_ID,
        senderId: "user-1",
        channelId: null,
        conversationId: CONVO_ID,
        deletedAt: null,
        sentAt: new Date("2024-01-01T00:00:00Z"),
        channel: { workspaceId: WORKSPACE_ID },
    };

    const updateMessage = {
        type: WsEvent.ConversationMessageUpdate,
        payload: { workspaceId: WORKSPACE_ID, conversationId: CONVO_ID, messageId: MESSAGE_ID, content: "edited" },
    };

    it("edits the message and replies + broadcasts conversation.message.updated with the post in data", async () => {
        authMocks();
        vi.mocked(messageRepository.messageExists).mockResolvedValue(convoPost as never);
        const updated = { ...convoPost, content: "edited" };
        vi.mocked(messageRepository.editMessage).mockResolvedValue(updated as never);

        const otherWs = { readyState: WebSocket.OPEN } as WebSocket;
        subscriptionManager.subscribe(CONVO_ID, otherWs);

        await conversationHandler.updateMessage(ws, updateMessage);

        expect(messageRepository.messageExists).toHaveBeenCalledWith(MESSAGE_ID);
        expect(messageRepository.editMessage).toHaveBeenCalledWith("edited", MESSAGE_ID);

        const sent = sentFrames;
        expect(sent).toHaveLength(2);
        const senderFrame = sent.find((f) => f.ws === ws);
        const otherFrame = sent.find((f) => f.ws === otherWs);
        expect(senderFrame).toBeDefined();
        expect(otherFrame).toBeDefined();
        expect(sent.filter((f) => f.ws === ws)).toHaveLength(1);
        for (const frame of sent) {
            const response = frame.response as { type: string; success: boolean; statusCode: number; data: unknown };
            expect(response.type).toBe(WsEvent.ConversationMessageUpdated);
            expect(response.success).toBe(true);
            expect(response.statusCode).toBe(StatusCodes.OK);
            expect(response.data).toEqual(updated);
        }
        subscriptionManager.unsubscribe(CONVO_ID, otherWs);
    });

    it("rejects with FORBIDDEN when another user tries to edit and never calls editMessage", async () => {
        authMocks();
        vi.mocked(messageRepository.messageExists).mockResolvedValue({ ...convoPost, senderId: "user-2" } as never);

        await conversationHandler.updateMessage(ws, updateMessage);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        const response = sent[0]!.response as { statusCode: number; error: { code: string } };
        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN);
        expect(response.error?.code).toBe("FORBIDDEN");
        expect(messageRepository.editMessage).not.toHaveBeenCalled();
    });

    it("rejects a channel message as BAD_REQUEST and never calls editMessage", async () => {
        authMocks();
        vi.mocked(messageRepository.messageExists).mockResolvedValue({
            ...convoPost,
            channelId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            conversationId: null,
        } as never);

        await conversationHandler.updateMessage(ws, updateMessage);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        const response = sent[0]!.response as { statusCode: number; error: { code: string } };
        expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
        expect(response.error?.code).toBe("BAD_REQUEST");
        expect(messageRepository.editMessage).not.toHaveBeenCalled();
    });

    it("rejects a message from another conversation as FORBIDDEN and never calls editMessage", async () => {
        authMocks();
        vi.mocked(messageRepository.messageExists).mockResolvedValue({
            ...convoPost,
            conversationId: OTHER_CONVO_ID,
        } as never);

        await conversationHandler.updateMessage(ws, updateMessage);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        const response = sent[0]!.response as { statusCode: number; error: { code: string } };
        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN);
        expect(response.error?.code).toBe("FORBIDDEN");
        expect(messageRepository.editMessage).not.toHaveBeenCalled();
    });

    it("rejects an already-deleted message as BAD_REQUEST and never calls editMessage", async () => {
        authMocks();
        vi.mocked(messageRepository.messageExists).mockResolvedValue({
            ...convoPost,
            deletedAt: new Date("2024-01-02T00:00:00Z"),
        } as never);

        await conversationHandler.updateMessage(ws, updateMessage);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        const response = sent[0]!.response as { statusCode: number; error: { code: string } };
        expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
        expect(response.error?.code).toBe("BAD_REQUEST");
        expect(messageRepository.editMessage).not.toHaveBeenCalled();
    });

    it("rejects a missing message as NOT_FOUND and never calls editMessage", async () => {
        authMocks();
        vi.mocked(messageRepository.messageExists).mockResolvedValue(null);

        await conversationHandler.updateMessage(ws, updateMessage);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        const response = sent[0]!.response as { statusCode: number; error: { code: string } };
        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND);
        expect(response.error?.code).toBe("NOT_FOUND_ERROR");
        expect(messageRepository.editMessage).not.toHaveBeenCalled();
    });

    it("rejects empty content as VALIDATION_ERROR and never calls editMessage", async () => {
        authMocks();
        vi.mocked(messageRepository.messageExists).mockResolvedValue(convoPost as never);

        const message = {
            type: WsEvent.ConversationMessageUpdate,
            payload: { workspaceId: WORKSPACE_ID, conversationId: CONVO_ID, messageId: MESSAGE_ID, content: "   " },
        };

        await conversationHandler.updateMessage(ws, message);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        const response = sent[0]!.response as { statusCode: number; error: { code: string } };
        expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
        expect(response.error?.code).toBe("VALIDATION_ERROR");
        expect(messageRepository.editMessage).not.toHaveBeenCalled();
    });
});

describe("conversationHandler.deleteMessage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sentFrames.length = 0;
    });

    const MESSAGE_ID = "78787878-7878-4878-8878-787878787878";
    const OTHER_CONVO_ID = "89898989-8989-4989-8989-898989898989";

    const convoPost = {
        id: MESSAGE_ID,
        senderId: "user-1",
        channelId: null,
        conversationId: CONVO_ID,
        deletedAt: null,
        sentAt: new Date("2024-01-01T00:00:00Z"),
        channel: { workspaceId: WORKSPACE_ID },
    };

    const deleteMessage = {
        type: WsEvent.ConversationMessageDelete,
        payload: { workspaceId: WORKSPACE_ID, conversationId: CONVO_ID, messageId: MESSAGE_ID },
    };

    it("deletes the message and sends exactly one frame to the sender plus one broadcast", async () => {
        authMocks();
        vi.mocked(messageRepository.messageExists).mockResolvedValue(convoPost as never);

        const otherWs = { readyState: WebSocket.OPEN } as WebSocket;
        subscriptionManager.subscribe(CONVO_ID, otherWs);

        await conversationHandler.deleteMessage(ws, deleteMessage);

        expect(messageRepository.messageExists).toHaveBeenCalledWith(MESSAGE_ID);
        expect(messageRepository.deleteMessage).toHaveBeenCalledWith(MESSAGE_ID);

        const sent = sentFrames;
        expect(sent).toHaveLength(2);
        const senderFrames = sent.filter((f) => f.ws === ws);
        const otherFrame = sent.find((f) => f.ws === otherWs);
        expect(senderFrames).toHaveLength(1);
        expect(otherFrame).toBeDefined();
        for (const frame of sent) {
            const response = frame.response as { type: string; success: boolean; statusCode: number; data: { messageId: string } };
            expect(response.type).toBe(WsEvent.ConversationMessageDeleted);
            expect(response.success).toBe(true);
            expect(response.statusCode).toBe(StatusCodes.OK);
            expect(response.data).toEqual({ messageId: MESSAGE_ID });
        }
        subscriptionManager.unsubscribe(CONVO_ID, otherWs);
    });

    it("rejects with FORBIDDEN when another user tries to delete and never calls deleteMessage", async () => {
        authMocks();
        vi.mocked(messageRepository.messageExists).mockResolvedValue({ ...convoPost, senderId: "user-2" } as never);

        await conversationHandler.deleteMessage(ws, deleteMessage);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        const response = sent[0]!.response as { statusCode: number; error: { code: string } };
        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN);
        expect(response.error?.code).toBe("FORBIDDEN");
        expect(messageRepository.deleteMessage).not.toHaveBeenCalled();
    });

    it("rejects a channel message as BAD_REQUEST and never calls deleteMessage", async () => {
        authMocks();
        vi.mocked(messageRepository.messageExists).mockResolvedValue({
            ...convoPost,
            channelId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            conversationId: null,
        } as never);

        await conversationHandler.deleteMessage(ws, deleteMessage);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        const response = sent[0]!.response as { statusCode: number; error: { code: string } };
        expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
        expect(response.error?.code).toBe("BAD_REQUEST");
        expect(messageRepository.deleteMessage).not.toHaveBeenCalled();
    });

    it("rejects a message from another conversation as FORBIDDEN and never calls deleteMessage", async () => {
        authMocks();
        vi.mocked(messageRepository.messageExists).mockResolvedValue({
            ...convoPost,
            conversationId: OTHER_CONVO_ID,
        } as never);

        await conversationHandler.deleteMessage(ws, deleteMessage);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        const response = sent[0]!.response as { statusCode: number; error: { code: string } };
        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN);
        expect(response.error?.code).toBe("FORBIDDEN");
        expect(messageRepository.deleteMessage).not.toHaveBeenCalled();
    });
});

afterEach(() => {
    subscriptionManager.removeSocket(ws);
});