import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WebSocket } from "ws";
import { StatusCodes } from "http-status-codes";
import { reactionHandler } from "../../../src/websockets/handlers/reactionHandler";
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
        addReaction: vi.fn(),
        reactionExists: vi.fn(),
        toggleReaction: vi.fn(),
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
const MESSAGE_ID = "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d";
const REACTION = "🔥";

const channelMessage = {
    deletedAt: null,
    senderId: "user-2",
    sentAt: new Date(),
    channelId: CHANNEL_ID,
    conversationId: null,
    channel: { workspaceId: WORKSPACE_ID },
};

const conversationMessage = {
    deletedAt: null,
    senderId: "user-2",
    sentAt: new Date(),
    channelId: null,
    conversationId: CONVO_ID,
    channel: null,
};

const authMocks = () => {
    vi.mocked(connectionManager.getMetadata).mockReturnValue(metadata);
    vi.mocked(workspaceRepository.memberExists).mockResolvedValue(WS_MEMBER);
};

const lastFrame = () => sentFrames[sentFrames.length - 1]!.response as {
    type: string;
    success: boolean;
    statusCode: number;
    data?: { userId: string; messageId: string; reaction: string; action: "added" | "removed" };
    error?: { code: string };
};

const framesFor = (targetWs: WebSocket) =>
    sentFrames.filter((f) => f.ws === targetWs);

describe("reactionHandler.react", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sentFrames.length = 0;
    });

    it("adds a reaction on a channel message and broadcasts to channel subscribers excluding the sender", async () => {
        authMocks();
        vi.mocked(channelRepository.memberExists).mockResolvedValue({ id: "cm-1" } as never);
        vi.mocked(messageRepository.messageExists).mockResolvedValue(channelMessage as never);
        vi.mocked(messageRepository.reactionExists).mockResolvedValue(null);

        const otherWs = { readyState: WebSocket.OPEN } as WebSocket;
        subscriptionManager.subscribe(CHANNEL_ID, ws);
        subscriptionManager.subscribe(CHANNEL_ID, otherWs);

        await reactionHandler.react(ws, {
            type: WsEvent.ChannelMessageReaction,
            payload: { workspaceId: WORKSPACE_ID, messageId: MESSAGE_ID, reaction: REACTION },
        });

        expect(messageRepository.addReaction).toHaveBeenCalledWith("user-1", MESSAGE_ID, REACTION);
        expect(messageRepository.toggleReaction).not.toHaveBeenCalled();

        const sent = sentFrames;
        expect(sent).toHaveLength(2);
        expect(sent[0]!.ws).toBe(ws);
        expect(sent[1]!.ws).toBe(otherWs);

        for (const frame of sent) {
            const response = frame.response as typeof frame.response & { type: string; success: boolean; statusCode: number; data: { messageId: string; reaction: string; action: string } };
            expect(response.type).toBe(WsEvent.ChannelMessageReaction);
            expect(response.success).toBe(true);
            expect(response.statusCode).toBe(StatusCodes.OK);
            expect(response.data).toEqual({
                userId: "user-1",
                messageId: MESSAGE_ID,
                reaction: REACTION,
                action: "added",
            });
        }

        subscriptionManager.unsubscribe(CHANNEL_ID, ws);
        subscriptionManager.unsubscribe(CHANNEL_ID, otherWs);
    });

    it("adds a reaction on a conversation message and broadcasts to conversation subscribers", async () => {
        authMocks();
        vi.mocked(conversationRepository.conversationExists).mockResolvedValue({ id: CONVO_ID } as never);
        vi.mocked(messageRepository.messageExists).mockResolvedValue(conversationMessage as never);
        vi.mocked(messageRepository.reactionExists).mockResolvedValue(null);

        const otherWs = { readyState: WebSocket.OPEN } as WebSocket;
        subscriptionManager.subscribe(CONVO_ID, ws);
        subscriptionManager.subscribe(CONVO_ID, otherWs);

        await reactionHandler.react(ws, {
            type: WsEvent.ConversationMessageReaction,
            payload: { workspaceId: WORKSPACE_ID, messageId: MESSAGE_ID, reaction: REACTION },
        });

        expect(conversationRepository.conversationExists).toHaveBeenCalledWith(CONVO_ID, "user-1");
        expect(channelRepository.memberExists).not.toHaveBeenCalled();
        expect(messageRepository.addReaction).toHaveBeenCalledWith("user-1", MESSAGE_ID, REACTION);

        const sent = sentFrames;
        expect(sent).toHaveLength(2);
        expect(sent[1]!.ws).toBe(otherWs);

        const response = lastFrame();
        expect(response.type).toBe(WsEvent.ConversationMessageReaction);
        expect(response.data).toEqual({
            userId: "user-1",
            messageId: MESSAGE_ID,
            reaction: REACTION,
            action: "added",
        });

        subscriptionManager.unsubscribe(CONVO_ID, ws);
        subscriptionManager.unsubscribe(CONVO_ID, otherWs);
    });

    it("removes the reaction when the same emoji is re-submitted", async () => {
        authMocks();
        vi.mocked(channelRepository.memberExists).mockResolvedValue({ id: "cm-1" } as never);
        vi.mocked(messageRepository.messageExists).mockResolvedValue(channelMessage as never);
        vi.mocked(messageRepository.reactionExists).mockResolvedValue({ emoji: REACTION });

        await reactionHandler.react(ws, {
            type: WsEvent.ChannelMessageReaction,
            payload: { workspaceId: WORKSPACE_ID, messageId: MESSAGE_ID, reaction: REACTION },
        });

        expect(messageRepository.toggleReaction).toHaveBeenCalledWith("user-1", MESSAGE_ID, REACTION);
        expect(messageRepository.addReaction).not.toHaveBeenCalled();

        const response = lastFrame();
        expect(response.data).toEqual({
            userId: "user-1",
            messageId: MESSAGE_ID,
            reaction: REACTION,
            action: "removed",
        });
    });

    it("swaps the emoji when a different one is submitted on an existing reaction", async () => {
        authMocks();
        vi.mocked(channelRepository.memberExists).mockResolvedValue({ id: "cm-1" } as never);
        vi.mocked(messageRepository.messageExists).mockResolvedValue(channelMessage as never);
        vi.mocked(messageRepository.reactionExists).mockResolvedValue({ emoji: "😀" });

        await reactionHandler.react(ws, {
            type: WsEvent.ChannelMessageReaction,
            payload: { workspaceId: WORKSPACE_ID, messageId: MESSAGE_ID, reaction: "👍" },
        });

        expect(messageRepository.toggleReaction).toHaveBeenCalledWith("user-1", MESSAGE_ID, "😀");
        expect(messageRepository.addReaction).toHaveBeenCalledWith("user-1", MESSAGE_ID, "👍");

        const response = lastFrame();
        expect(response.data).toEqual({
            userId: "user-1",
            messageId: MESSAGE_ID,
            reaction: "👍",
            action: "added",
        });
    });

    it("rejects with NOT_FOUND when the message does not exist", async () => {
        authMocks();
        vi.mocked(messageRepository.messageExists).mockResolvedValue(null);

        await reactionHandler.react(ws, {
            type: WsEvent.ChannelMessageReaction,
            payload: { workspaceId: WORKSPACE_ID, messageId: MESSAGE_ID, reaction: REACTION },
        });

        const response = lastFrame();
        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND);
        expect(messageRepository.addReaction).not.toHaveBeenCalled();
        expect(messageRepository.toggleReaction).not.toHaveBeenCalled();
    });

    it("rejects with BAD_REQUEST when the message is already deleted", async () => {
        authMocks();
        vi.mocked(messageRepository.messageExists).mockResolvedValue({
            ...channelMessage,
            deletedAt: new Date(),
        } as never);

        await reactionHandler.react(ws, {
            type: WsEvent.ChannelMessageReaction,
            payload: { workspaceId: WORKSPACE_ID, messageId: MESSAGE_ID, reaction: REACTION },
        });

        const response = lastFrame();
        expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
        expect(messageRepository.addReaction).not.toHaveBeenCalled();
    });

    it("rejects with FORBIDDEN when not a workspace member", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(metadata);
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue(null);
        vi.mocked(messageRepository.messageExists).mockResolvedValue(channelMessage as never);

        await reactionHandler.react(ws, {
            type: WsEvent.ChannelMessageReaction,
            payload: { workspaceId: WORKSPACE_ID, messageId: MESSAGE_ID, reaction: REACTION },
        });

        const response = lastFrame();
        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN);
        expect(messageRepository.addReaction).not.toHaveBeenCalled();
    });

    it("rejects with FORBIDDEN when not a channel member", async () => {
        authMocks();
        vi.mocked(channelRepository.memberExists).mockResolvedValue(null);
        vi.mocked(messageRepository.messageExists).mockResolvedValue(channelMessage as never);

        await reactionHandler.react(ws, {
            type: WsEvent.ChannelMessageReaction,
            payload: { workspaceId: WORKSPACE_ID, messageId: MESSAGE_ID, reaction: REACTION },
        });

        const response = lastFrame();
        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN);
        expect(messageRepository.addReaction).not.toHaveBeenCalled();
    });

    it("rejects with FORBIDDEN when not a conversation member", async () => {
        authMocks();
        vi.mocked(conversationRepository.conversationExists).mockResolvedValue(null);
        vi.mocked(messageRepository.messageExists).mockResolvedValue(conversationMessage as never);

        await reactionHandler.react(ws, {
            type: WsEvent.ConversationMessageReaction,
            payload: { workspaceId: WORKSPACE_ID, messageId: MESSAGE_ID, reaction: REACTION },
        });

        const response = lastFrame();
        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN);
        expect(messageRepository.addReaction).not.toHaveBeenCalled();
    });

    it("rejects invalid payloads with VALIDATION_ERROR", async () => {
        authMocks();

        await reactionHandler.react(ws, {
            type: WsEvent.ChannelMessageReaction,
            payload: { workspaceId: WORKSPACE_ID, messageId: "not-a-uuid", reaction: REACTION },
        });
        await reactionHandler.react(ws, {
            type: WsEvent.ChannelMessageReaction,
            payload: { workspaceId: WORKSPACE_ID, messageId: MESSAGE_ID, reaction: "not-an-emoji" },
        });

        const sent = sentFrames;
        expect(sent).toHaveLength(2);
        for (const frame of sent) {
            const response = frame.response as { statusCode: number; error: { code: string } };
            expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
            expect(response.error?.code).toBe("VALIDATION_ERROR");
        }
        expect(messageRepository.addReaction).not.toHaveBeenCalled();
    });

    it("rejects unauthenticated users with UNAUTHORIZED", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(undefined);

        await reactionHandler.react(ws, {
            type: WsEvent.ChannelMessageReaction,
            payload: { workspaceId: WORKSPACE_ID, messageId: MESSAGE_ID, reaction: REACTION },
        });

        const response = lastFrame();
        expect(response.statusCode).toBe(StatusCodes.UNAUTHORIZED);
    });
});

describe("eventRouter.dispatch reaction path", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sentFrames.length = 0;
    });

    it("dispatches channel.message.reaction to the registered handler without throwing on an unbound handler", async () => {
        authMocks();
        vi.mocked(channelRepository.memberExists).mockResolvedValue({ id: "cm-1" } as never);
        vi.mocked(messageRepository.messageExists).mockResolvedValue(channelMessage as never);
        vi.mocked(messageRepository.reactionExists).mockResolvedValue(null);

        const otherWs = { readyState: WebSocket.OPEN } as WebSocket;
        subscriptionManager.subscribe(CHANNEL_ID, otherWs);

        await expect(
            eventRouter.dispatch(ws, {
                type: WsEvent.ChannelMessageReaction,
                payload: { workspaceId: WORKSPACE_ID, messageId: MESSAGE_ID, reaction: REACTION },
            })
        ).resolves.toBeUndefined();

        const otherFrames = framesFor(otherWs);
        expect(otherFrames).toHaveLength(1);
        const response = otherFrames[0]!.response as { type: string; success: boolean; statusCode: number; data: { action: string } };
        expect(response.type).toBe(WsEvent.ChannelMessageReaction);
        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(StatusCodes.OK);
        expect(response.data).toEqual({
            userId: "user-1",
            messageId: MESSAGE_ID,
            reaction: REACTION,
            action: "added",
        });

        subscriptionManager.unsubscribe(CHANNEL_ID, otherWs);
    });

    it("dispatches conversation.message.reaction to the registered handler", async () => {
        authMocks();
        vi.mocked(conversationRepository.conversationExists).mockResolvedValue({ id: CONVO_ID } as never);
        vi.mocked(messageRepository.messageExists).mockResolvedValue(conversationMessage as never);
        vi.mocked(messageRepository.reactionExists).mockResolvedValue(null);

        const otherWs = { readyState: WebSocket.OPEN } as WebSocket;
        subscriptionManager.subscribe(CONVO_ID, otherWs);

        await expect(
            eventRouter.dispatch(ws, {
                type: WsEvent.ConversationMessageReaction,
                payload: { workspaceId: WORKSPACE_ID, messageId: MESSAGE_ID, reaction: REACTION },
            })
        ).resolves.toBeUndefined();

        const otherFrames = framesFor(otherWs);
        expect(otherFrames).toHaveLength(1);
        const response = otherFrames[0]!.response as { type: string; success: boolean };
        expect(response.type).toBe(WsEvent.ConversationMessageReaction);
        expect(response.success).toBe(true);

        subscriptionManager.unsubscribe(CONVO_ID, otherWs);
    });
});

afterEach(() => {
    subscriptionManager.removeSocket(ws);
});