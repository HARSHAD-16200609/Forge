import { describe, expect, it } from "vitest";
import { upsertMessage } from "@/realtime/realtimeCache";
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
