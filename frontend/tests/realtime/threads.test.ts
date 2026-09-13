import { describe, expect, it } from "vitest";
import { lastReplyOf, repliesOf, topLevelMessages } from "@/features/Messages/utils/threads";
import type { Message } from "@/features/Messages/types";

function makeMessage(id: string, parentMsgId: string | null, sentAt: string, deletedAt: string | null = null): Message {
    return {
        id,
        content: "[]",
        sentAt,
        editedAt: null,
        deletedAt,
        parentMsgId,
        entity: { type: "channel", id: "ch-1" },
        sender: { id: "u-1", username: "a", name: "A", avatar: null },
        uploads: [],
        reactions: [],
        replies: [],
    };
}

describe("repliesOf", () => {
    it("returns replies for a parent sorted ascending by sentAt", () => {
        const messages = [
            makeMessage("p", null, "2026-09-09T10:00:00.000Z"),
            makeMessage("r2", "p", "2026-09-09T10:02:00.000Z"),
            makeMessage("r1", "p", "2026-09-09T10:01:00.000Z"),
            makeMessage("other", "x", "2026-09-09T10:03:00.000Z"),
        ];
        expect(repliesOf(messages, "p").map((m) => m.id)).toEqual(["r1", "r2"]);
    });

    it("returns an empty array when there are no replies", () => {
        expect(repliesOf([makeMessage("p", null, "2026-09-09T10:00:00.000Z")], "p")).toEqual([]);
    });
});

describe("lastReplyOf", () => {
    it("returns the most recent non-deleted reply", () => {
        const messages = [
            makeMessage("r1", "p", "2026-09-09T10:01:00.000Z"),
            makeMessage("r2", "p", "2026-09-09T10:03:00.000Z"),
            makeMessage("r3", "p", "2026-09-09T10:02:00.000Z", "2026-09-09T11:00:00.000Z"),
        ];
        expect(lastReplyOf(messages, "p")?.id).toBe("r2");
    });

    it("returns null when only deleted replies exist", () => {
        const messages = [
            makeMessage("r1", "p", "2026-09-09T10:01:00.000Z", "2026-09-09T11:00:00.000Z"),
        ];
        expect(lastReplyOf(messages, "p")).toBeNull();
    });
});

describe("topLevelMessages", () => {
    it("drops replies and sorts top-level messages ascending", () => {
        const messages = [
            makeMessage("r", "p", "2026-09-09T10:01:00.000Z"),
            makeMessage("p2", null, "2026-09-09T10:02:00.000Z"),
            makeMessage("p1", null, "2026-09-09T10:00:00.000Z"),
        ];
        expect(topLevelMessages(messages).map((m) => m.id)).toEqual(["p1", "p2"]);
    });
});