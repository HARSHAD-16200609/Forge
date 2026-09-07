import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WebSocket } from "ws";
import { StatusCodes } from "http-status-codes";
import { messageHandler } from "../../../src/websockets/handlers/messageHandler";
import { subscriptionManager } from "../../../src/websockets/subscriptionManager";
import { connectionManager } from "../../../src/websockets/connectionManager";
import { workspaceRepository } from "../../../src/modules/Workspace/workspace.repository";
import { channelRepository } from "../../../src/modules/Channel/channel.repository";
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

const CHANNEL_ID = "f5f63127-9f69-446d-b5a1-82d25fc45a96";
const WORKSPACE_ID = "30a3aa89-92bc-4ecf-97d2-a642bc445c74";

describe("messageHandler.channel.subscribe", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sentFrames.length = 0;
    });

    it("subscribes the socket to the channel and replies OK for a valid payload", async () => {
        const member = WS_MEMBER;
        vi.mocked(connectionManager.getMetadata).mockReturnValue(metadata);
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue(member);
        vi.mocked(channelRepository.memberExists).mockResolvedValue({ id: "cm-1" } as never);

        const message = {
            type: WsEvent.ChannelSubscribe,
            payload: { workspaceId: WORKSPACE_ID, channelId: CHANNEL_ID },
        };

        await messageHandler.subscribe(ws, message);

        expect(workspaceRepository.memberExists).toHaveBeenCalledWith("user-1", WORKSPACE_ID);
        expect(channelRepository.memberExists).toHaveBeenCalledWith("wm-1", CHANNEL_ID);
        expect(subscriptionManager.getSubscribers(CHANNEL_ID)?.has(ws)).toBe(true);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        const response = sent[0]!.response as { type: string; success: boolean; statusCode: number };
        expect(response.type).toBe(WsEvent.ChannelSubscribe);
        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(StatusCodes.OK);
    });

    it("rejects with VALIDATION_ERROR when payload uses conversationId instead of channelId", async () => {
        const message = {
            type: WsEvent.ChannelSubscribe,
            payload: { workspaceId: WORKSPACE_ID, conversationId: CHANNEL_ID },
        };

        await messageHandler.subscribe(ws, message);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        const response = sent[0]!.response as { success: boolean; statusCode: number; error: { code: string } };
        expect(response.success).toBe(false);
        expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
        expect(response.error?.code).toBe("VALIDATION_ERROR");
        expect(subscriptionManager.getSubscribers(CHANNEL_ID)).toBeUndefined();
    });

    it("rejects unauthenticated users with UNAUTHORIZED", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(undefined);

        const message = {
            type: WsEvent.ChannelSubscribe,
            payload: { workspaceId: WORKSPACE_ID, channelId: CHANNEL_ID },
        };

        await messageHandler.subscribe(ws, message);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        expect(sent[0]!.response as { statusCode: number }).toMatchObject({ statusCode: StatusCodes.UNAUTHORIZED });
    });

    it("rejects with FORBIDDEN when user is not a workspace member", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(metadata);
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue(null);

        const message = {
            type: WsEvent.ChannelSubscribe,
            payload: { workspaceId: WORKSPACE_ID, channelId: CHANNEL_ID },
        };

        await messageHandler.subscribe(ws, message);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        const response = sent[0]!.response as { statusCode: number; error: { code: string } };
        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN);
        expect(response.error?.code).toBe("FORBIDDEN");
        expect(subscriptionManager.getSubscribers(CHANNEL_ID)).toBeUndefined();
    });

    it("rejects with FORBIDDEN when user is not a channel member", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(metadata);
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue(WS_MEMBER);
        vi.mocked(channelRepository.memberExists).mockResolvedValue(null);

        const message = {
            type: WsEvent.ChannelSubscribe,
            payload: { workspaceId: WORKSPACE_ID, channelId: CHANNEL_ID },
        };

        await messageHandler.subscribe(ws, message);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        const response = sent[0]!.response as { statusCode: number; error: { code: string } };
        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN);
        expect(response.error?.code).toBe("FORBIDDEN");
        expect(subscriptionManager.getSubscribers(CHANNEL_ID)).toBeUndefined();
    });

    it("is idempotent when the same socket re-subscribes", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(metadata);
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue(WS_MEMBER);
        vi.mocked(channelRepository.memberExists).mockResolvedValue({ id: "cm-1" } as never);

        const message = {
            type: WsEvent.ChannelSubscribe,
            payload: { workspaceId: WORKSPACE_ID, channelId: CHANNEL_ID },
        };

        await messageHandler.subscribe(ws, message);
        await messageHandler.subscribe(ws, message);

        const subscribers = subscriptionManager.getSubscribers(CHANNEL_ID);
        expect(subscribers).toBeDefined();
        expect(subscribers!.size).toBe(1);
        expect(subscriptionManager.getSubscriptions(ws)?.size).toBe(1);
    });
});

describe("messageHandler.channel.message.create", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sentFrames.length = 0;
    });

    const validMessage = {
        type: WsEvent.ChannelMessage,
        payload: { workspaceId: WORKSPACE_ID, channelId: CHANNEL_ID, content: "hello" },
    };

    it("posts a message and replies with channel.message.created (sender only)", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(metadata);
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue(WS_MEMBER);
        vi.mocked(channelRepository.memberExists).mockResolvedValue({ id: "cm-1" } as never);
        const posts = { message: { id: "m-1" }, uploads: [] };
        vi.mocked(messageRepository.postMessage).mockResolvedValue(posts as never);

        await messageHandler.createMessage(ws, validMessage);

        expect(messageRepository.postMessage).toHaveBeenCalledWith(
            { channelId: CHANNEL_ID, content: "hello", senderId: "user-1" },
            [],
            "user-1"
        );
        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        const response = sent[0]!.response as { type: string; success: boolean; message: string };
        expect(response.type).toBe(WsEvent.ChannelMessageCreated);
        expect(response.success).toBe(true);
        expect(JSON.parse(response.message)).toEqual(posts);
    });

    it("forwards uploadIds and broadcasts to other subscribers but not the sender", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(metadata);
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue(WS_MEMBER);
        vi.mocked(channelRepository.memberExists).mockResolvedValue({ id: "cm-1" } as never);
        const posts = { message: { id: "m-2" }, uploads: [] };
        vi.mocked(messageRepository.postMessage).mockResolvedValue(posts as never);

        const otherWs = { readyState: WebSocket.OPEN } as WebSocket;
        subscriptionManager.subscribe(CHANNEL_ID, otherWs);

        const uploadIds = ["00000000-0000-4000-8000-000000000001", "00000000-0000-4000-8000-000000000002"];
        const message = {
            type: WsEvent.ChannelMessage,
            payload: { workspaceId: WORKSPACE_ID, channelId: CHANNEL_ID, content: "", uploadIds },
        };

        await messageHandler.createMessage(ws, message);

        expect(messageRepository.postMessage).toHaveBeenCalledWith(
            { channelId: CHANNEL_ID, content: "", senderId: "user-1" },
            uploadIds,
            "user-1"
        );
        const sent = sentFrames;
        expect(sent).toHaveLength(2);
        const senderFrame = sent.find((f) => f.ws === ws);
        const otherFrame = sent.find((f) => f.ws === otherWs);
        expect(senderFrame).toBeDefined();
        expect(otherFrame).toBeDefined();
        expect(sent.filter((f) => f.ws === ws)).toHaveLength(1);
        subscriptionManager.unsubscribe(CHANNEL_ID, otherWs);
    });

    it("still replies to the sender when no one subscribed / getSubscribers undefined", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(metadata);
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue(WS_MEMBER);
        vi.mocked(channelRepository.memberExists).mockResolvedValue({ id: "cm-1" } as never);
        const posts = { message: { id: "m-3" }, uploads: [] };
        vi.mocked(messageRepository.postMessage).mockResolvedValue(posts as never);

        await messageHandler.createMessage(ws, validMessage);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        expect(sent[0]!.ws).toBe(ws);
    });

    it("rejects empty content with no uploads as VALIDATION_ERROR", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(metadata);
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue(WS_MEMBER);
        vi.mocked(channelRepository.memberExists).mockResolvedValue({ id: "cm-1" } as never);

        const message = {
            type: WsEvent.ChannelMessage,
            payload: { workspaceId: WORKSPACE_ID, channelId: CHANNEL_ID, content: "   " },
        };

        await messageHandler.createMessage(ws, message);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        const response = sent[0]!.response as { statusCode: number; error: { code: string } };
        expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
        expect(response.error?.code).toBe("VALIDATION_ERROR");
        expect(messageRepository.postMessage).not.toHaveBeenCalled();
    });

    it("rejects more than 3 uploadIds as VALIDATION_ERROR", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(metadata);
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue(WS_MEMBER);
        vi.mocked(channelRepository.memberExists).mockResolvedValue({ id: "cm-1" } as never);

        const uploadIds = ["1", "2", "3", "4"];

        const message = {
            type: WsEvent.ChannelMessage,
            payload: { workspaceId: WORKSPACE_ID, channelId: CHANNEL_ID, content: "hi", uploadIds },
        };

        await messageHandler.createMessage(ws, message);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        const response = sent[0]!.response as { statusCode: number; error: { code: string } };
        expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
        expect(response.error?.code).toBe("VALIDATION_ERROR");
    });

    it("rejects unauthenticated users with UNAUTHORIZED", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(undefined);

        await messageHandler.createMessage(ws, validMessage);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        expect(sent[0]!.response as { statusCode: number }).toMatchObject({ statusCode: StatusCodes.UNAUTHORIZED });
    });

    it("rejects with FORBIDDEN when not a workspace member", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(metadata);
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue(null);

        await messageHandler.createMessage(ws, validMessage);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        expect(sent[0]!.response as { statusCode: number }).toMatchObject({ statusCode: StatusCodes.FORBIDDEN });
        expect(messageRepository.postMessage).not.toHaveBeenCalled();
    });

    it("rejects with FORBIDDEN when not a channel member", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(metadata);
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue(WS_MEMBER);
        vi.mocked(channelRepository.memberExists).mockResolvedValue(null);

        await messageHandler.createMessage(ws, validMessage);

        const sent = sentFrames;
        expect(sent).toHaveLength(1);
        expect(sent[0]!.response as { statusCode: number }).toMatchObject({ statusCode: StatusCodes.FORBIDDEN });
        expect(messageRepository.postMessage).not.toHaveBeenCalled();
    });

    it("propagates postMessage failures so the router can handle them", async () => {
        vi.mocked(connectionManager.getMetadata).mockReturnValue(metadata);
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue(WS_MEMBER);
        vi.mocked(channelRepository.memberExists).mockResolvedValue({ id: "cm-1" } as never);
        vi.mocked(messageRepository.postMessage).mockRejectedValue(new Error("db down"));

        await expect(messageHandler.createMessage(ws, validMessage)).rejects.toThrow("db down");
    });
});

afterEach(() => {
    subscriptionManager.removeSocket(ws);
});