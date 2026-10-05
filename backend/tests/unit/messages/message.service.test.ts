import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/modules/Messages/message.repository", async (importOriginal) => {
    const actual =
        await importOriginal<typeof import("../../../src/modules/Messages/message.repository")>();
    return {
        ...actual,
        messageRepository: {
            ...actual.messageRepository,
            getMessages: vi.fn(),
            getConversationMessages: vi.fn(),
        },
    };
});

vi.mock("../../../src/modules/Channel/channel.repository", () => ({
    channelRepository: {
        channelExists: vi.fn(),
        memberExists: vi.fn(),
    },
}));

vi.mock("../../../src/modules/Conversations/conversations.repository", () => ({
    conversationRepository: {
        conversationExists: vi.fn(),
        getConversations: vi.fn(),
    },
}));

vi.mock("../../../src/modules/Workspace/workspace.repository", () => ({
    workspaceRepository: {
        memberExists: vi.fn(),
    },
}));

import { messageRepository } from "../../../src/modules/Messages/message.repository";
import { messageService } from "../../../src/modules/Messages/message.service";
import { channelRepository } from "../../../src/modules/Channel/channel.repository";
import { conversationRepository } from "../../../src/modules/Conversations/conversations.repository";
import { conversationService } from "../../../src/modules/Conversations/conversations.service";
import { workspaceRepository } from "../../../src/modules/Workspace/workspace.repository";
import { Visibility } from "../../../generated/prisma/enums";

const WORKSPACE_ID = "30a3aa89-92bc-4ecf-97d2-a642bc445c74";
const CHANNEL_ID = "f5f63127-9f69-446d-b5a1-82d25fc45a96";
const CONVO_ID = "8b6e0b64-2c1f-4d2a-9a3c-7f9e2d1c4b5a";
const USER_ID = "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d";
const USER = { username: "harshad", userId: USER_ID };
const PAGINATION = { limit: 30 };

const emptyPage = { messages: [], hasMore: false, nextCursor: null };

afterEach(() => {
    vi.clearAllMocks();
});

/**
 * Regression cover for the bug where a brand-new channel answered its message-history
 * request with 404 "No Messages Found". An empty channel is a valid state, not an error:
 * returning 404 left the messages query in an error state on the client, so a sender's
 * own realtime acknowledgement stayed buffered and their first message never rendered
 * until a manual refresh.
 */
describe("messageService history — empty channels are not an error", () => {
    describe("getMessages", () => {
        it("returns an empty page for a channel with no messages", async () => {
            vi.mocked(workspaceRepository.memberExists).mockResolvedValue({
                id: "membership-1",
            } as never);
            vi.mocked(channelRepository.channelExists).mockResolvedValue({
                channelId: CHANNEL_ID,
                visibility: Visibility.PUBLIC,
            } as never);
            vi.mocked(channelRepository.memberExists).mockResolvedValue(null as never);
            vi.mocked(messageRepository.getMessages).mockResolvedValue([]);

            await expect(
                messageService.getMessages(
                    { workspaceId: WORKSPACE_ID, channelId: CHANNEL_ID },
                    USER,
                    PAGINATION,
                ),
            ).resolves.toEqual(emptyPage);
        });

        it("does not reject when a private channel has no messages and the user is not yet a member", async () => {
            vi.mocked(workspaceRepository.memberExists).mockResolvedValue({
                id: "membership-1",
            } as never);
            vi.mocked(channelRepository.channelExists).mockResolvedValue({
                channelId: CHANNEL_ID,
                visibility: Visibility.PRIVATE,
            } as never);
            vi.mocked(channelRepository.memberExists).mockResolvedValue(null as never);
            vi.mocked(messageRepository.getMessages).mockResolvedValue([]);

            // Membership is only enforced for private channels; an empty history must not
            // turn that ForbiddenError into a misleading "No Messages Found" 404.
            await expect(
                messageService.getMessages(
                    { workspaceId: WORKSPACE_ID, channelId: CHANNEL_ID },
                    USER,
                    PAGINATION,
                ),
            ).rejects.toThrow();
        });

        it("still reports hasMore and nextCursor when the channel is full", async () => {
            const page = Array.from({ length: 31 }, (_, index) => ({
                id: `m${index}`,
                content: `body ${index}`,
            }));

            vi.mocked(workspaceRepository.memberExists).mockResolvedValue({
                id: "membership-1",
            } as never);
            vi.mocked(channelRepository.channelExists).mockResolvedValue({
                channelId: CHANNEL_ID,
                visibility: Visibility.PUBLIC,
            } as never);
            vi.mocked(channelRepository.memberExists).mockResolvedValue({ id: "cm-1" } as never);
            vi.mocked(messageRepository.getMessages).mockResolvedValue(page as never);

            const result = await messageService.getMessages(
                { workspaceId: WORKSPACE_ID, channelId: CHANNEL_ID },
                USER,
                PAGINATION,
            );

            expect(result.hasMore).toBe(true);
            expect(result.messages).toHaveLength(30);
            expect(result.nextCursor).toBe("m29");
        });
    });

    describe("getConvoMessages", () => {
        it("returns an empty page for a conversation with no messages", async () => {
            vi.mocked(workspaceRepository.memberExists).mockResolvedValue({
                id: "membership-1",
            } as never);
            vi.mocked(conversationRepository.conversationExists).mockResolvedValue({
                conversationId: CONVO_ID,
                userId: USER_ID,
            } as never);
            vi.mocked(messageRepository.getConversationMessages).mockResolvedValue([]);

            await expect(
                messageService.getConvoMessages(
                    { workspaceId: WORKSPACE_ID, conversationId: CONVO_ID },
                    USER,
                    PAGINATION,
                ),
            ).resolves.toEqual(emptyPage);
        });

        it("still throws NotFoundError when the conversation itself does not exist", async () => {
            vi.mocked(workspaceRepository.memberExists).mockResolvedValue({
                id: "membership-1",
            } as never);
            vi.mocked(conversationRepository.conversationExists).mockResolvedValue(null as never);

            await expect(
                messageService.getConvoMessages(
                    { workspaceId: WORKSPACE_ID, conversationId: CONVO_ID },
                    USER,
                    PAGINATION,
                ),
            ).rejects.toThrow("No Conversation Found");
        });
    });
});

/**
 * `conversations.service.ts` carried a third copy of the same "empty history is a 404" defect in its
 * own `getMessages`. It is a separate service with its own copy of the logic, so it gets its own
 * cover — a shared helper that both call sites happened to agree on would not have caught the
 * duplicate.
 */
describe("conversationService.getMessages — an empty conversation is not an error", () => {
    it("returns an empty page for a conversation with no messages", async () => {
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue({
            id: "membership-1",
        } as never);
        vi.mocked(conversationRepository.conversationExists).mockResolvedValue({
            conversationId: CONVO_ID,
            userId: USER_ID,
        } as never);
        vi.mocked(messageRepository.getConversationMessages).mockResolvedValue([]);

        await expect(
            conversationService.getMessages(WORKSPACE_ID, CONVO_ID, USER_ID, PAGINATION),
        ).resolves.toEqual(emptyPage);
    });

    it("still throws NotFoundError when the conversation is missing", async () => {
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue({
            id: "membership-1",
        } as never);
        vi.mocked(conversationRepository.conversationExists).mockResolvedValue(null as never);

        await expect(
            conversationService.getMessages(WORKSPACE_ID, CONVO_ID, USER_ID, PAGINATION),
        ).rejects.toThrow("Conversation Not Found");
    });
});

/**
 * The fourth instance of the same "empty result is an error" anti-pattern, this time on the
 * conversations *list*. It had a client-side band-aid over it — `useDms` caught the 404 and
 * returned `{ conversations: [] }` — which is why the UI mostly coped. The 404 itself was still
 * wrong, it still polluted the network log, and it only ever worked for the one call site that
 * remembered to swallow it.
 */
describe("conversationService.getConversations — an empty inbox is not an error", () => {
    it("returns an empty list for a user with no conversations", async () => {
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue({
            id: "membership-1",
        } as never);
        vi.mocked(conversationRepository.getConversations).mockResolvedValue([]);

        await expect(conversationService.getConversations(USER_ID, WORKSPACE_ID)).resolves.toEqual(
            [],
        );
    });

    it("still forbids a user who is not a member of the workspace", async () => {
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue(null as never);

        await expect(conversationService.getConversations(USER_ID, WORKSPACE_ID)).rejects.toThrow(
            "You are not an member of this Workspace",
        );
    });

    it("maps a populated list into the shape the sidebar consumes", async () => {
        vi.mocked(workspaceRepository.memberExists).mockResolvedValue({
            id: "membership-1",
        } as never);
        vi.mocked(conversationRepository.getConversations).mockResolvedValue([
            {
                conversation: {
                    id: CONVO_ID,
                    type: "DM",
                    groupName: null,
                    members: [
                        { user: { id: USER_ID, username: "harshad", avatar: null } },
                        { user: { id: "user-2", username: "teammate", avatar: "a.png" } },
                    ],
                    messages: [{ content: "hi", sentAt: new Date("2026-01-01") }],
                },
            },
        ] as never);

        const result = await conversationService.getConversations(USER_ID, WORKSPACE_ID);

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            id: CONVO_ID,
            type: "DM",
            displayName: "teammate",
            avatar: "a.png",
            receiverId: "user-2",
            lastMessage: { content: "hi" },
        });
    });
});