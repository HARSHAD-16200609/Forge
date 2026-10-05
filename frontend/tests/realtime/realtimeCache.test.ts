import { describe, expect, it } from "vitest";
import { createPendingMessageBuffer, ensureMessage, upsertMessage } from "@/realtime/realtimeCache";
import type { Message, paginatedMessages } from "@/features/Messages/types";

function makeMessage(id: string, sentAt: string): Message {
    return {
        id,
        content: "[]",
        sentAt,
        editedAt: null,
        deletedAt: null,
        parentMsgId: null,
        entity: { type: "channel", id: "ch-1" },
        sender: { id: "u-1", username: "a", name: "A", avatar: null },
        uploads: [],
        reactions: [],
        replies: [],
    };
}

function makePage(messageIds: string[]): paginatedMessages {
    return {
        messages: messageIds.map((id, i) => makeMessage(id, `2026-09-09T10:0${i}:00.000Z`)),
        hasMore: true,
    };
}

function idsOf(pages: paginatedMessages[] | undefined): string[] {
    return pages?.flatMap((page) => page.messages.map((m) => m.id)) ?? [];
}

describe("upsertMessage", () => {
    it("appends a new message only to the first (newest) page", () => {
        const pages = [makePage(["m1", "m2"]), makePage(["m3", "m4"])];
        const fresh = makeMessage("m5", "2026-09-09T10:05:00.000Z");

        const result = upsertMessage(pages, fresh);

        expect(idsOf(result)).toEqual(["m1", "m2", "m5", "m3", "m4"]);
        expect(idsOf(result).filter((id) => id === "m5")).toHaveLength(1);
        expect(result?.[0].messages).toHaveLength(3);
        expect(result?.[1].messages).toHaveLength(2);
    });

    it("replaces an existing message in place without touching other pages", () => {
        const pages = [makePage(["m1", "m2"]), makePage(["m3", "m4"])];
        const updated = { ...makeMessage("m3", "2026-09-09T10:03:00.000Z"), content: "[edited]" };

        const result = upsertMessage(pages, updated);

        expect(idsOf(result)).toEqual(["m1", "m2", "m3", "m4"]);
        const hit = result?.[1].messages.find((m) => m.id === "m3");
        expect(hit?.content).toBe("[edited]");
        expect(result?.[0].messages).toHaveLength(2);
    });

    it("keeps a single copy when the same fresh message frame arrives again", () => {
        const pages = [makePage(["m1", "m2"]), makePage(["m3"])];
        const incoming = makeMessage("m4", "2026-09-09T10:04:00.000Z");

        const once = upsertMessage(pages, incoming);
        const twice = upsertMessage(once, incoming);

        expect(idsOf(twice).filter((id) => id === "m4")).toHaveLength(1);
    });

    it("returns undefined when pages is undefined", () => {
        expect(
            upsertMessage(undefined, makeMessage("m1", "2026-09-09T10:00:00.000Z")),
        ).toBeUndefined();
    });

    it("returns the pages unchanged when there are no pages", () => {
        const result = upsertMessage([], makeMessage("m1", "2026-09-09T10:00:00.000Z"));
        expect(result).toEqual([]);
    });
});

describe("ensureMessage", () => {
    it("seeds the first page for a channel that resolved with no messages", () => {
        const fresh = makeMessage("m1", "2026-09-09T10:00:00.000Z");

        const result = ensureMessage([], fresh);

        expect(idsOf(result)).toEqual(["m1"]);
        expect(result).toHaveLength(1);
        expect(result[0].hasMore).toBe(false);
    });

    it("appends to the newest page when pages already exist", () => {
        const pages = [makePage(["m1", "m2"]), makePage(["m3"])];
        const fresh = makeMessage("m4", "2026-09-09T10:04:00.000Z");

        const result = ensureMessage(pages, fresh);

        expect(idsOf(result)).toEqual(["m1", "m2", "m4", "m3"]);
    });

    it("replaces an existing message rather than duplicating it", () => {
        const pages = [makePage(["m1", "m2"])];
        const edited = { ...makeMessage("m1", "2026-09-09T10:00:00.000Z"), content: "[edited]" };

        const result = ensureMessage(pages, edited);

        expect(idsOf(result)).toEqual(["m1", "m2"]);
        expect(result[0].messages[0].content).toBe("[edited]");
    });
});

describe("createPendingMessageBuffer", () => {
    it("stores and returns messages in insertion order", () => {
        const buffer = createPendingMessageBuffer();
        const first = makeMessage("m1", "2026-09-09T10:00:00.000Z");
        const second = makeMessage("m2", "2026-09-09T10:01:00.000Z");

        buffer.push("k", first);
        buffer.push("k", second);

        expect(buffer.size("k")).toBe(2);
        expect(buffer.take("k").map((m) => m.id)).toEqual(["m1", "m2"]);
    });

    it("keeps entries for different keys separate", () => {
        const buffer = createPendingMessageBuffer();
        buffer.push("a", makeMessage("m1", "2026-09-09T10:00:00.000Z"));

        expect(buffer.size("a")).toBe(1);
        expect(buffer.size("b")).toBe(0);
        expect(buffer.take("b")).toEqual([]);
        expect(buffer.size("a")).toBe(1);
    });

    it("ignores a duplicate message id for the same key", () => {
        const buffer = createPendingMessageBuffer();
        const message = makeMessage("m1", "2026-09-09T10:00:00.000Z");

        buffer.push("k", message);
        buffer.push("k", message);

        expect(buffer.size("k")).toBe(1);
    });

    it("empties the key on take", () => {
        const buffer = createPendingMessageBuffer();
        buffer.push("k", makeMessage("m1", "2026-09-09T10:00:00.000Z"));

        buffer.take("k");

        expect(buffer.size("k")).toBe(0);
    });

    it("caps buffered messages per key", () => {
        const buffer = createPendingMessageBuffer();
        for (let i = 0; i < 150; i += 1) {
            buffer.push("k", makeMessage(`m${i}`, "2026-09-09T10:00:00.000Z"));
        }

        expect(buffer.size("k")).toBe(100);
    });

    it("clears every key", () => {
        const buffer = createPendingMessageBuffer();
        buffer.push("a", makeMessage("m1", "2026-09-09T10:00:00.000Z"));
        buffer.push("b", makeMessage("m2", "2026-09-09T10:00:00.000Z"));

        buffer.clear();

        expect(buffer.size("a")).toBe(0);
        expect(buffer.size("b")).toBe(0);
    });
});
