import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WebSocket } from "ws";
import { StatusCodes } from "http-status-codes";
import { replyHandler } from "../../../src/websockets/handlers/replyHandler";
import { eventRouter } from "../../../src/websockets/eventRouter";
import { subscriptionManager } from "../../../src/websockets/subscriptionManager";
import { connectionManager } from "../../../src/websockets/connectionManager";
import { workspaceRepository } from "../../../src/modules/Workspace/workspace.repository";
import { channelRepository } from "../../../src/modules/Channel/channel.repository";
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

vi.mock("../../../src/modules/Messages/message.repository", () => ({
    messageRepository: {
        messageExists: vi.fn(),
        createReply: vi.fn(),
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

const WORKSPACE_ID = "30a3aa89-92bc-4ecf-97d2-a642bc445c74";
const CHANNEL_ID = "f5f63127-9f69-446d-b5a1-82d25fc45a96";
const CONVO_ID = "8b6e0b64-2c1f-4d2a-9a3c-7f9e2d1c4b5a";
const PARENT_ID = "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d";

const channelParent = {
    deletedAt: null,
    senderId: "user-2",
    sentAt: new Date(),
    channelId: CHANNEL_ID,
    conversationId: null,
    channel: { workspaceId: WORKSPACE_ID },
};

const conversationParent = {
    deletedAt: null,
    senderId: "user-2",
    sentAt: new Date(),
    channelId: null,
    conversationId: CONVO_ID,
    channel: null,
};

const createdReply = {
    id: "9f8e7d6c-5b4a-3c2d-1e0f-a1b2c3d4e5f6",
    parentMsgId: PARENT_ID,
    channelId: CHANNEL_ID,
    content: "hello",
    senderId: "user-1",
    sentAt: new Date(),
};

const authMocks = () => {
    vi.mocked(connectionManager.getMetadata).mockReturnValue(metadata);
    vi.mocked(workspaceRepository.memberExists).mockResolvedValue(WS_MEMBER);
};

const lastFrame = () => sentFrames[sentFrames.length - 1]!.response as {
    type: string;
    success: boolean;
    statusCode: number;
    data?: unknown;
    error?: { code: string };
};

const framesFor = (targetWs: WebSocket) =>
    sentFrames.filter((f) => f.ws === targetWs);

describe("replyHandler.reply", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sentFrames.length = 0;
    });

    it("creates a channel reply and broadcasts to channel subscribers excluding the sender", async () => {
        authMocks();
        vi.mocked(channelRepository.memberExists).mockResolvedValue({ id: "cm-1" } as never);
        vi.mocked(messageRepository.messageExists).mockResolvedValue(channelParent as never);
        vi.mocked(messageRepository.createReply).mockResolvedValue(createdReply as never);

        const otherWs = { readyState: WebSocket.OPEN } as WebSocket;
        subscriptionManager.subscribe(CHANNEL_ID, ws);
        subscriptionManager.subscribe(CHANNEL_ID, otherWs);

        await replyHandler.reply(ws, {
            type: WsEvent.ChannelMessageReply,
            payload: {
                workspaceId: WORKSPACE_ID,
                parentMsgId: PARENT_ID,
                entityId: CHANNEL_ID,
                entityType: "channel",
                content: "hello",
            },
        });

        expect(messageRepository.createReply).toHaveBeenCalledWith(
            { channelId: CHANNEL_ID, content: "hello", senderId: "user-1" },
            PARENT_ID
        );
        expect(conversationRepository.conversationExists).not.toHaveBeenCalled();

        const sent = sentFrames;
        expect(sent).toHaveLength(2);
        expect(sent[0]!.ws).toBe(ws);
        expect(sent[1]!.ws).toBe(otherWs);

        for (const frame of sent) {
            const response = frame.response as { type: string; success: boolean; statusCode: number; data: unknown };
            expect(response.type).toBe(WsEvent.ChannelMessageReply);
            expect(response.success).toBe(true);
            expect(response.statusCode).toBe(StatusCodes.OK);
            expect(response.data).toEqual(createdReply);
        }

        subscriptionManager.unsubscribe(CHANNEL_ID, ws);
        subscriptionManager.unsubscribe(CHANNEL_ID, otherWs);
    });

    it("creates a conversation reply and broadcasts to conversation subscribers", async () => {
        authMocks();
        vi.mocked(conversationRepository.conversationExists).mockResolvedValue({ id: CONVO_ID } as never);
        vi.mocked(messageRepository.messageExists).mockResolvedValue(conversationParent as never);
        vi.mocked(messageRepository.createReply).mockResolvedValue({ ...createdReply, channelId: null, conversationId: CONVO_ID } as never);

        const otherWs = { readyState: WebSocket.OPEN } as WebSocket;
        subscriptionManager.subscribe(CONVO_ID, ws);
        subscriptionManager.subscribe(CONVO_ID, otherWs);

        await replyHandler.reply(ws, {
            type: WsEvent.ConversationMessageReply,
            payload: {
                workspaceId: WORKSPACE_ID,
                parentMsgId: PARENT_ID,
                entityId: CONVO_ID,
                entityType: "conversation",
                content: "hello",
            },
        });

        expect(messageRepository.createReply).toHaveBeenCalledWith(
            { conversationId: CONVO_ID, content: "hello", senderId: "user-1" },
            PARENT_ID
        );
        expect(channelRepository.memberExists).not.toHaveBeenCalled();

        const sent = sentFrames;
        expect(sent).toHaveLength(2);
        expect(sent[1]!.ws).toBe(otherWs);

        const response = lastFrame();
        expect(response.type).toBe(WsEvent.ConversationMessageReply);
        expect(response.success).toBe(true);

        subscriptionManager.unsubscribe(CONVO_ID, ws);
        subscriptionManager.unsubscribe(CONVO_ID, otherWs);
    });

    it("rejects with NOT_FOUND when the parent message does not exist", async () => {
        authMocks();
        vi.mocked(messageRepository.messageExists).mockResolvedValue(null);

        await replyHandler.reply(ws, {
            type: WsEvent.ChannelMessageReply,
            payload: {
                workspaceId: WORKSPACE_ID,
                parentMsgId: PARENT_ID,
                entityId: CHANNEL_ID,
                entityType: "channel",
                content: "hello",
            },
        });

        const response = lastFrame();
        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND);
        expect(messageRepository.createReply).not.toHaveBeenCalled();
    });

    it("rejects with BAD_REQUEST when the parent message is deleted", async () => {
        authMocks();
        vi.mocked(messageRepository.messageExists).mockResolvedValue({
            ...channelParent,
            deletedAt: new Date(),
        } as never);

        await replyHandler.reply(ws, {
            type: WsEvent.ChannelMessageReply,
            payload: {
                workspaceId: WORKSPACE_ID,
                parentMsgId: PARENT_ID,
                entityId: CHANNEL_ID,
                entityType: "channel",
                content: "hello",
            },
        });

        const response = lastFrame();
        expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
        expect(messageRepository.createReply).not.toHaveBeenCalled();
    });

    it("rejects with FORBIDDEN when the parent channel does not match the claimed entity", async () => {
        authMocks();
        vi.mocked(messageRepository.messageExists).mockResolvedValue(channelParent as never);

        await replyHandler.reply(ws, {
            type: WsEvent.ChannelMessageReply,
            payload: {
                workspaceId: WORKSPACE_ID,
                parentMsgId: PARENT_ID,
                entityId: "d0e1f2a3-4b5c-6d7e-8f9a-0b1c2d3e4f5a",
                entityType: "channel",
                content: "hello",
            },
        });

        const response = lastFrame();
        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN);
        expect(messageRepository.createReply).not.toHaveBeenCalled();
    });

    it("rejects with FORBIDDEN when not a workspace member", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(metadata);
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue(null);
        vi.mocked(messageRepository.messageExists).mockResolvedValue(channelParent as never);

        await replyHandler.reply(ws, {
            type: WsEvent.ChannelMessageReply,
            payload: {
                workspaceId: WORKSPACE_ID,
                parentMsgId: PARENT_ID,
                entityId: CHANNEL_ID,
                entityType: "channel",
                content: "hello",
            },
        });

        const response = lastFrame();
        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN);
        expect(messageRepository.createReply).not.toHaveBeenCalled();
    });

    it("rejects with FORBIDDEN when not a channel member", async () => {
        authMocks();
        vi.mocked(channelRepository.memberExists).mockResolvedValue(null);
        vi.mocked(messageRepository.messageExists).mockResolvedValue(channelParent as never);

        await replyHandler.reply(ws, {
            type: WsEvent.ChannelMessageReply,
            payload: {
                workspaceId: WORKSPACE_ID,
                parentMsgId: PARENT_ID,
                entityId: CHANNEL_ID,
                entityType: "channel",
                content: "hello",
            },
        });

        const response = lastFrame();
        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN);
        expect(messageRepository.createReply).not.toHaveBeenCalled();
    });

    it("rejects with FORBIDDEN when not a conversation member", async () => {
        authMocks();
        vi.mocked(conversationRepository.conversationExists).mockResolvedValue(null);
        vi.mocked(messageRepository.messageExists).mockResolvedValue(conversationParent as never);

        await replyHandler.reply(ws, {
            type: WsEvent.ConversationMessageReply,
            payload: {
                workspaceId: WORKSPACE_ID,
                parentMsgId: PARENT_ID,
                entityId: CONVO_ID,
                entityType: "conversation",
                content: "hello",
            },
        });

        const response = lastFrame();
        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN);
        expect(messageRepository.createReply).not.toHaveBeenCalled();
    });

    it("rejects invalid payloads with VALIDATION_ERROR", async () => {
        authMocks();

        await replyHandler.reply(ws, {
            type: WsEvent.ChannelMessageReply,
            payload: {
                workspaceId: WORKSPACE_ID,
                parentMsgId: "not-a-uuid",
                entityId: CHANNEL_ID,
                entityType: "channel",
                content: "hello",
            },
        });
        await replyHandler.reply(ws, {
            type: WsEvent.ChannelMessageReply,
            payload: {
                workspaceId: WORKSPACE_ID,
                parentMsgId: PARENT_ID,
                entityId: CHANNEL_ID,
                entityType: "channel",
                content: "",
            },
        });

        const sent = sentFrames;
        expect(sent).toHaveLength(2);
        for (const frame of sent) {
            const response = frame.response as { statusCode: number; error: { code: string } };
            expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
            expect(response.error?.code).toBe("VALIDATION_ERROR");
        }
        expect(messageRepository.createReply).not.toHaveBeenCalled();
    });

    it("rejects unauthenticated users with UNAUTHORIZED", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(undefined);

        await replyHandler.reply(ws, {
            type: WsEvent.ChannelMessageReply,
            payload: {
                workspaceId: WORKSPACE_ID,
                parentMsgId: PARENT_ID,
                entityId: CHANNEL_ID,
                entityType: "channel",
                content: "hello",
            },
        });

        const response = lastFrame();
        expect(response.statusCode).toBe(StatusCodes.UNAUTHORIZED);
    });
});

describe("eventRouter.dispatch reply path", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sentFrames.length = 0;
    });

    it("dispatches channel.message.reply to the registered handler without throwing", async () => {
        authMocks();
        vi.mocked(channelRepository.memberExists).mockResolvedValue({ id: "cm-1" } as never);
        vi.mocked(messageRepository.messageExists).mockResolvedValue(channelParent as never);
        vi.mocked(messageRepository.createReply).mockResolvedValue(createdReply as never);

        const otherWs = { readyState: WebSocket.OPEN } as WebSocket;
        subscriptionManager.subscribe(CHANNEL_ID, otherWs);

        await expect(
            eventRouter.dispatch(ws, {
                type: WsEvent.ChannelMessageReply,
                payload: {
                    workspaceId: WORKSPACE_ID,
                    parentMsgId: PARENT_ID,
                    entityId: CHANNEL_ID,
                    entityType: "channel",
                    content: "hello",
                },
            })
        ).resolves.toBeUndefined();

        const otherFrames = framesFor(otherWs);
        expect(otherFrames).toHaveLength(1);
        const response = otherFrames[0]!.response as { type: string; success: boolean; statusCode: number };
        expect(response.type).toBe(WsEvent.ChannelMessageReply);
        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(StatusCodes.OK);

        subscriptionManager.unsubscribe(CHANNEL_ID, otherWs);
    });

    it("dispatches conversation.message.reply to the registered handler", async () => {
        authMocks();
        vi.mocked(conversationRepository.conversationExists).mockResolvedValue({ id: CONVO_ID } as never);
        vi.mocked(messageRepository.messageExists).mockResolvedValue(conversationParent as never);
        vi.mocked(messageRepository.createReply).mockResolvedValue({ ...createdReply, channelId: null, conversationId: CONVO_ID } as never);

        const otherWs = { readyState: WebSocket.OPEN } as WebSocket;
        subscriptionManager.subscribe(CONVO_ID, otherWs);

        await expect(
            eventRouter.dispatch(ws, {
                type: WsEvent.ConversationMessageReply,
                payload: {
                    workspaceId: WORKSPACE_ID,
                    parentMsgId: PARENT_ID,
                    entityId: CONVO_ID,
                    entityType: "conversation",
                    content: "hello",
                },
            })
        ).resolves.toBeUndefined();

        const otherFrames = framesFor(otherWs);
        expect(otherFrames).toHaveLength(1);
        expect(otherFrames[0]!.response as { type: string }).toMatchObject({ type: WsEvent.ConversationMessageReply });

        subscriptionManager.unsubscribe(CONVO_ID, otherWs);
    });
});

afterEach(() => {
    subscriptionManager.removeSocket(ws);
});