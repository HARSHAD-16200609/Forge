import { afterEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("../../../src/modules/Notifications/notifications.repository", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../../src/modules/Notifications/notifications.repository")>();
    return {
        ...actual,
        notificationRepository: {
            createMentions: vi.fn(),
            list: vi.fn(),
            findById: vi.fn(),
            markRead: vi.fn(),
            markAllRead: vi.fn(),
            unreadCount: vi.fn(),
        },
    };
});

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

import { notificationRepository } from "../../../src/modules/Notifications/notifications.repository";
import { notificationService, mentionSnippet } from "../../../src/modules/Notifications/notifications.service";
import { channelRepository } from "../../../src/modules/Channel/channel.repository";
import { workspaceRepository } from "../../../src/modules/Workspace/workspace.repository";
import { ForbiddenError, NotFoundError } from "../../../src/utility/errorHandling/customErrors";

const WORKSPACE_ID = "30a3aa89-92bc-4ecf-97d2-a642bc445c74";
const CHANNEL_ID = "f5f63127-9f69-446d-b5a1-82d25fc45a96";
const CONVO_ID = "8b6e0b64-2c1f-4d2a-9a3c-7f9e2d1c4b5a";
const ACTOR_ID = "user-1";
const MESSAGE_ID = "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d";

const WS_MEMBER = { id: "wm-1" };
const CHANNEL_MEMBER = { id: "cm-1" };

const channelContext = {
    kind: "channel",
    workspaceId: WORKSPACE_ID,
    channelId: CHANNEL_ID,
    snippet: "hello",
} as const;

const conversationContext = {
    kind: "conversation",
    workspaceId: WORKSPACE_ID,
    conversationId: CONVO_ID,
    snippet: "hello",
} as const;

describe("notificationService.createMentions", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    const mentionIds = ["user-2", "user-3"];

    it("returns without membership checks or repository calls when mentionIds is empty", async () => {
        await notificationService.createMentions(MESSAGE_ID, ACTOR_ID, [], channelContext);

        expect(workspaceRepository.memberExists).not.toHaveBeenCalled();
        expect(channelRepository.memberExists).not.toHaveBeenCalled();
        expect(notificationRepository.createMentions).not.toHaveBeenCalled();
    });

    it("throws ForbiddenError when the actor is not a workspace member", async () => {
        (workspaceRepository.memberExists as Mock).mockResolvedValue(null);

        await expect(
            notificationService.createMentions(MESSAGE_ID, ACTOR_ID, mentionIds, channelContext)
        ).rejects.toBeInstanceOf(ForbiddenError);
        await expect(
            notificationService.createMentions(MESSAGE_ID, ACTOR_ID, mentionIds, channelContext)
        ).rejects.toThrow("You are not a member of this workspace");
        expect(notificationRepository.createMentions).not.toHaveBeenCalled();
    });

    it("throws ForbiddenError when the actor is not a channel member", async () => {
        (workspaceRepository.memberExists as Mock).mockResolvedValue(WS_MEMBER);
        (channelRepository.memberExists as Mock).mockResolvedValue(null);

        await expect(
            notificationService.createMentions(MESSAGE_ID, ACTOR_ID, mentionIds, channelContext)
        ).rejects.toBeInstanceOf(ForbiddenError);
        await expect(
            notificationService.createMentions(MESSAGE_ID, ACTOR_ID, mentionIds, channelContext)
        ).rejects.toThrow("You are not a member of this channel");
        expect(notificationRepository.createMentions).not.toHaveBeenCalled();
    });

    it("creates mentions when the actor is both a workspace and channel member", async () => {
        (workspaceRepository.memberExists as Mock).mockResolvedValue(WS_MEMBER);
        (channelRepository.memberExists as Mock).mockResolvedValue(CHANNEL_MEMBER);
        (notificationRepository.createMentions as Mock).mockResolvedValue(undefined);

        await notificationService.createMentions(MESSAGE_ID, ACTOR_ID, mentionIds, channelContext);

        expect(workspaceRepository.memberExists).toHaveBeenCalledWith(ACTOR_ID, WORKSPACE_ID);
        expect(channelRepository.memberExists).toHaveBeenCalledWith(WS_MEMBER.id, CHANNEL_ID);
        expect(notificationRepository.createMentions).toHaveBeenCalledWith(
            MESSAGE_ID,
            ACTOR_ID,
            mentionIds,
            channelContext
        );
    });

    it("skips the channel membership check for conversation mentions", async () => {
        (workspaceRepository.memberExists as Mock).mockResolvedValue(WS_MEMBER);
        (notificationRepository.createMentions as Mock).mockResolvedValue(undefined);

        await notificationService.createMentions(MESSAGE_ID, ACTOR_ID, mentionIds, conversationContext);

        expect(channelRepository.memberExists).not.toHaveBeenCalled();
        expect(notificationRepository.createMentions).toHaveBeenCalledWith(
            MESSAGE_ID,
            ACTOR_ID,
            mentionIds,
            conversationContext
        );
    });
});

describe("notificationService.list", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("returns the paginated result when notifications exist", async () => {
        const result = {
            items: [{ id: "n-1" }],
            hasMore: false,
            nextCursor: undefined,
        };
        (notificationRepository.list as Mock).mockResolvedValue(result);

        await expect(notificationService.list("user-1", "all", undefined, 20)).resolves.toEqual(result);
        expect(notificationRepository.list).toHaveBeenCalledWith("user-1", "all", { cursor: undefined, limit: 20 });
    });

    it("throws NotFoundError when there are no notifications", async () => {
        (notificationRepository.list as Mock).mockResolvedValue({ items: [], hasMore: false, nextCursor: undefined });

        await expect(notificationService.list("user-1", "all", undefined, 20)).rejects.toBeInstanceOf(NotFoundError);
        await expect(notificationService.list("user-1", "all", undefined, 20)).rejects.toThrow("No Notifications Found");
    });
});

describe("notificationService.markRead", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    const NOTIF_ID = "11111111-1111-4111-8111-111111111111";

    it("throws NotFoundError when the notification does not belong to the recipient", async () => {
        (notificationRepository.findById as Mock).mockResolvedValue(null);

        await expect(notificationService.markRead("user-1", NOTIF_ID)).rejects.toBeInstanceOf(NotFoundError);
        await expect(notificationService.markRead("user-1", NOTIF_ID)).rejects.toThrow("Notification not found");
        expect(notificationRepository.markRead).not.toHaveBeenCalled();
    });

    it("returns read=true without touching the database when already read", async () => {
        (notificationRepository.findById as Mock).mockResolvedValue({ id: NOTIF_ID, read: true });

        await expect(notificationService.markRead("user-1", NOTIF_ID)).resolves.toEqual({ id: NOTIF_ID, read: true });
        expect(notificationRepository.markRead).not.toHaveBeenCalled();
    });

    it("marks an unread notification as read and returns read=true", async () => {
        (notificationRepository.findById as Mock).mockResolvedValue({ id: NOTIF_ID, read: false });
        (notificationRepository.markRead as Mock).mockResolvedValue({ count: 1 });

        await expect(notificationService.markRead("user-1", NOTIF_ID)).resolves.toEqual({ id: NOTIF_ID, read: true });
        expect(notificationRepository.markRead).toHaveBeenCalledWith(NOTIF_ID, "user-1");
    });
});

describe("notificationService.markAllRead", () => {
    it("returns the number of notifications marked read", async () => {
        (notificationRepository.markAllRead as Mock).mockResolvedValue({ count: 4 });

        await expect(notificationService.markAllRead("user-1")).resolves.toEqual({ count: 4 });
        expect(notificationRepository.markAllRead).toHaveBeenCalledWith("user-1");
    });
});

describe("notificationService.unreadCount", () => {
    it("returns the unread notification count", async () => {
        (notificationRepository.unreadCount as Mock).mockResolvedValue(7);

        await expect(notificationService.unreadCount("user-1")).resolves.toEqual({ count: 7 });
        expect(notificationRepository.unreadCount).toHaveBeenCalledWith("user-1");
    });
});

describe("mentionSnippet", () => {
    it("extracts plain text from editor blocks and strips html", () => {
        const content = JSON.stringify({
            blocks: [{ data: { text: "<p>Hello <b>world</b>&nbsp;</p>" } }],
        });

        expect(mentionSnippet(content)).toBe("Hello world");
    });

    it("collects text, code and list items across blocks", () => {
        const content = JSON.stringify({
            blocks: [
                { data: { text: "Check this" } },
                { data: { code: "const answer = 42" } },
                { data: { items: ["<li>first</li>", "second"] } },
            ],
        });

        expect(mentionSnippet(content)).toBe("Check this const answer = 42 first second");
    });

    it("normalizes whitespace and truncates to 120 characters", () => {
        const longText = "word ".repeat(60);
        const content = JSON.stringify({ blocks: [{ data: { text: longText } }] });

        const snippet = mentionSnippet(content);
        expect(snippet.length).toBeLessThanOrEqual(120);
        expect(snippet).not.toMatch(/\s{2,}/);
    });

    it("returns empty string for invalid json", () => {
        expect(mentionSnippet("not-json")).toBe("");
    });

    it("returns empty string for content without recognised blocks", () => {
        expect(mentionSnippet(JSON.stringify({ hello: 1 }))).toBe("");
        expect(mentionSnippet(JSON.stringify(["a", "b"]))).toBe("");
    });
});