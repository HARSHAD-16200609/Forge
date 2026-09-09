import { describe, expect, it } from "vitest";
import {
    applyReactionDelta,
    extractPlainText,
    updateConversationLastMessage,
    upsertMessage,
} from "@/realtime/realtimeCache";
import type { Message, ReactionDelta } from "@/features/Messages/types";

function makeMessage(overrides: Partial<Message> = {}): Message {
    return {
        id: "msg-1",
        entityId: "ch-1",
        entityType: "channel",
        content: JSON.stringify([
            { type: "paragraph", data: { text: "hello" } },
        ]),
        sentAt: "2026-09-09T10:00:00.000Z",
        sender: {
            id: "user-1",
            username: "harshad",
            name: "Harshad",
            avatar: null,
        },
        reactions: [],
        replies: [],
        parentMsgId: null,
        deletedAt: null,
        ...overrides,
    };
}

const page = (messages: Message[]): { messages: Message[]; hasMore: boolean } => ({
    messages,
    hasMore: false,
});

describe("upsertMessage", () => {
    it("appends a new message to the page", () => {
        const before = page([makeMessage({ id: "a" })]);
        const next = upsertMessage([before], makeMessage({ id: "b" }));
        expect(next?.[0].messages.map((m) => m.id)).toEqual(["a", "b"]);
    });

    it("replaces an existing message by id instead of duplicating", () => {
        const before = page([makeMessage({ id: "a" })]);
        const updated = upsertMessage([before], makeMessage({ id: "a", content: "[]" }));
        expect(updated?.[0].messages).toHaveLength(1);
        expect(updated?.[0].messages[0].content).toBe("[]");
    });

    it("returns undefined when pages are empty", () => {
        expect(upsertMessage(undefined, makeMessage())).toBeUndefined();
    });
});

describe("applyReactionDelta", () => {
    const base = makeMessage();

    it("adds a reaction for a new user", () => {
        const pages = [page([base])];
        const delta: ReactionDelta = {
            userId: "user-2",
            username: "kim",
            messageId: "msg-1",
            reaction: "👍",
            action: "added",
        };
        const next = applyReactionDelta(pages, delta);
        expect(next?.[0].messages[0].reactions).toEqual([
            {
                emoji: "👍",
                reactedBy: { id: "user-2", username: "kim", name: "", avatar: null },
            },
        ]);
    });

    it("does not duplicate a reaction from the same user", () => {
        const pages = [
            page([
                makeMessage({
                    reactions: [
                        {
                            emoji: "👍",
                            reactedBy: { id: "user-2", username: "kim", name: "", avatar: null },
                        },
                    ],
                }),
            ]),
        ];
        const delta: ReactionDelta = {
            userId: "user-2",
            username: "kim",
            messageId: "msg-1",
            reaction: "👍",
            action: "added",
        };
        const next = applyReactionDelta(pages, delta);
        expect(next?.[0].messages[0].reactions).toHaveLength(1);
    });

    it("removes a reaction on removed action", () => {
        const pages = [
            page([
                makeMessage({
                    reactions: [
                        {
                            emoji: "👍",
                            reactedBy: { id: "user-2", username: "kim", name: "", avatar: null },
                        },
                    ],
                }),
            ]),
        ];
        const delta: ReactionDelta = {
            userId: "user-2",
            username: "kim",
            messageId: "msg-1",
            reaction: "👍",
            action: "removed",
        };
        const next = applyReactionDelta(pages, delta);
        expect(next?.[0].messages[0].reactions).toEqual([]);
    });
});

describe("updateConversationLastMessage", () => {
    const conversation = {
        id: "conv-1",
        workspaceId: "ws-1",
        type: "DM" as const,
        idempotencyKey: "key",
        displayName: "kim",
        avatar: "",
        groupName: undefined,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        lastMessage: { content: "old", sentAt: "2026-01-01T00:00:00.000Z" },
    };

    it("updates the conversation preview with plain text of the new message", () => {
        const cache = { conversations: [conversation] };
        const next = updateConversationLastMessage(cache, "conv-1", makeMessage());
        expect(next?.conversations[0].lastMessage.content).toBe("hello");
        expect(next?.conversations[0].lastMessage.sentAt).toBe("2026-09-09T10:00:00.000Z");
    });

    it("ignores tombstone (deleted) messages", () => {
        const cache = { conversations: [conversation] };
        const tombstone = makeMessage({ deletedAt: "2026-09-09T11:00:00.000Z" });
        const next = updateConversationLastMessage(cache, "conv-1", tombstone);
        expect(next?.conversations[0].lastMessage.content).toBe("old");
    });

    it("does not touch other conversations", () => {
        const other = { ...conversation, id: "conv-2" };
        const cache = { conversations: [conversation, other] };
        const next = updateConversationLastMessage(cache, "conv-1", makeMessage());
        expect(next?.conversations[1].lastMessage.content).toBe("old");
    });
});

describe("extractPlainText", () => {
    it("extracts text from editor.js blocks", () => {
        expect(extractPlainText(makeMessage().content)).toBe("hello");
    });

    it("joins multiple blocks", () => {
        expect(
            extractPlainText(
                JSON.stringify([
                    { type: "paragraph", data: { text: "one" } },
                    { type: "code", data: { code: "two" } },
                ]),
            ),
        ).toBe("one two");
    });

    it("returns raw content for invalid json", () => {
        expect(extractPlainText("not json")).toBe("not json");
    });
});