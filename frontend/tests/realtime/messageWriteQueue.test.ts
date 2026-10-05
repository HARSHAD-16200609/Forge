import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { createMessageWriteQueue, readCachedPages } from "@/realtime/messageWriteQueue";
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

function envelope(pages: paginatedMessages[]) {
    return { pages, pageParams: [undefined] };
}

function makeClient(): QueryClient {
    return new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
}

function idsOf(queryClient: QueryClient, queryKey: readonly unknown[]): string[] {
    const pages = readCachedPages(queryClient.getQueryData(queryKey));
    return pages?.flatMap((page) => page.messages.map((m) => m.id)) ?? [];
}

const KEY = ["messages", "w-1", "ch-1"] as const;

describe("messageWriteQueue", () => {
    it("keeps a message written while a stale refetch is in flight", async () => {
        const queryClient = makeClient();
        const queue = createMessageWriteQueue();

        // Channel already has history cached, and a refetch is outstanding.
        queryClient.setQueryData(KEY, envelope([makePage(["m1", "m2"])]));

        let deliverStale: ((value: unknown) => void) | undefined;
        const staleResponse = new Promise((resolve) => {
            deliverStale = resolve;
        });
        const refetch = queryClient.fetchQuery({
            queryKey: KEY,
            queryFn: () => staleResponse,
        });

        // The ack lands while the refetch is still in flight.
        const fresh = makeMessage("m-fresh", "2026-09-09T10:05:00.000Z");
        queue.write(queryClient, KEY, fresh);
        await queue.settle();

        expect(idsOf(queryClient, KEY)).toContain("m-fresh");

        // The stale snapshot — taken before the ack — must not clobber it.
        deliverStale?.(envelope([makePage(["m1"])]));
        await refetch.catch(() => undefined);
        await queue.settle();

        expect(idsOf(queryClient, KEY)).toEqual(["m1", "m2", "m-fresh"]);
    });

    it("buffers a frame that arrives before the query has any cached page", async () => {
        const queryClient = makeClient();
        const queue = createMessageWriteQueue();
        const fresh = makeMessage("m-buffered", "2026-09-09T10:05:00.000Z");

        queue.write(queryClient, KEY, fresh);
        await queue.settle();

        expect(queue.pendingCount(KEY)).toBe(1);
        expect(queryClient.getQueryData(KEY)).toBeUndefined();
    });

    it("replays buffered frames once the page lands", async () => {
        const queryClient = makeClient();
        const queue = createMessageWriteQueue();
        const fresh = makeMessage("m-buffered", "2026-09-09T10:05:00.000Z");

        queue.write(queryClient, KEY, fresh);
        await queue.settle();

        // The history fetch finally resolves, without the message.
        queryClient.setQueryData(KEY, envelope([makePage(["m1", "m2"])]));
        queue.drain(queryClient, KEY);
        await queue.settle();

        expect(idsOf(queryClient, KEY)).toEqual(["m1", "m2", "m-buffered"]);
        expect(queue.pendingCount(KEY)).toBe(0);
    });

    it("writes into an empty channel that has resolved with no pages", async () => {
        const queryClient = makeClient();
        const queue = createMessageWriteQueue();
        const fresh = makeMessage("m-first", "2026-09-09T10:05:00.000Z");

        queryClient.setQueryData(KEY, envelope([]));
        queue.write(queryClient, KEY, fresh);
        await queue.settle();

        expect(idsOf(queryClient, KEY)).toEqual(["m-first"]);
        expect(queue.pendingCount(KEY)).toBe(0);
    });

    it("preserves frame order across a serialized batch", async () => {
        const queryClient = makeClient();
        const queue = createMessageWriteQueue();
        queryClient.setQueryData(KEY, envelope([makePage(["m1"])]));

        const second = makeMessage("m-2", "2026-09-09T10:06:00.000Z");
        const third = makeMessage("m-3", "2026-09-09T10:07:00.000Z");
        queue.write(queryClient, KEY, second);
        queue.write(queryClient, KEY, third);
        await queue.settle();

        expect(idsOf(queryClient, KEY)).toEqual(["m1", "m-2", "m-3"]);
    });

    it("does not buffer the same message twice", async () => {
        const queryClient = makeClient();
        const queue = createMessageWriteQueue();
        const fresh = makeMessage("m-dup", "2026-09-09T10:05:00.000Z");

        queue.write(queryClient, KEY, fresh);
        queue.write(queryClient, KEY, fresh);
        await queue.settle();

        expect(queue.pendingCount(KEY)).toBe(1);
    });

    it("replays buffered frames for a channel that was empty when they arrived", async () => {
        const queryClient = makeClient();
        const queue = createMessageWriteQueue();
        const fresh = makeMessage("m-first", "2026-09-09T10:05:00.000Z");

        // No cache at all when the ack arrives -> buffered.
        queue.write(queryClient, KEY, fresh);
        await queue.settle();

        // The fetch resolves to an empty channel, then the drain runs.
        queryClient.setQueryData(KEY, envelope([]));
        queue.drain(queryClient, KEY);
        await queue.settle();

        expect(idsOf(queryClient, KEY)).toEqual(["m-first"]);
    });

    it("clears buffered frames on demand", async () => {
        const queryClient = makeClient();
        const queue = createMessageWriteQueue();

        queue.write(queryClient, KEY, makeMessage("m1", "2026-09-09T10:00:00.000Z"));
        await queue.settle();
        expect(queue.pendingCount(KEY)).toBe(1);

        queue.clearPending();
        expect(queue.pendingCount(KEY)).toBe(0);
    });
});

describe("readCachedPages", () => {
    it("returns undefined when there is no cache", () => {
        expect(readCachedPages(undefined)).toBeUndefined();
    });

    it("returns undefined for a malformed cache shape", () => {
        expect(readCachedPages({ nope: true })).toBeUndefined();
    });

    it("distinguishes resolved-but-empty pages from a missing cache", () => {
        expect(readCachedPages(envelope([]))).toEqual([]);
    });
});

/**
 * Mirrors the drain wiring in `RealtimeProvider`: a `getQueryCache().subscribe` listener that calls
 * `queue.drain` on any `messages` / `conversation-messages` update. The unit tests above call
 * `drain` by hand; this proves the subscription actually fires for a brand-new channel whose ack
 * arrives before its first page exists.
 */
describe("cache subscription wiring", () => {
    function attachDrain(queryClient: QueryClient, queue: ReturnType<typeof createMessageWriteQueue>) {
        return queryClient.getQueryCache().subscribe((event) => {
            if (event.type !== "updated") return;
            const queryKey = event.query.queryKey;
            if (queryKey[0] !== "messages" && queryKey[0] !== "conversation-messages") return;
            queue.drain(queryClient, queryKey);
        });
    }

    it("replays an ack that arrived before a brand-new channel finished its first fetch", async () => {
        const queryClient = makeClient();
        const queue = createMessageWriteQueue();
        const detach = attachDrain(queryClient, queue);
        const fresh = makeMessage("m-first", "2026-09-09T10:05:00.000Z");

        let deliverPage: ((value: unknown) => void) | undefined;
        const pendingPage = new Promise((resolve) => {
            deliverPage = resolve;
        });

        // A newly created channel: the query has never resolved before.
        const inFlight = queryClient.fetchQuery({ queryKey: KEY, queryFn: () => pendingPage });

        // The ack lands while that first fetch is still open.
        queue.write(queryClient, KEY, fresh);
        await queue.settle();
        expect(queue.pendingCount(KEY)).toBe(1);

        // The empty channel finally resolves -> 'updated' -> the subscription drains the buffer.
        deliverPage?.(envelope([{ messages: [], hasMore: false }]));
        await inFlight;
        await queue.settle();

        expect(idsOf(queryClient, KEY)).toEqual(["m-first"]);
        expect(queue.pendingCount(KEY)).toBe(0);
        detach();
    });

    it("drains when the query resolves to an empty channel", async () => {
        const queryClient = makeClient();
        const queue = createMessageWriteQueue();
        const detach = attachDrain(queryClient, queue);
        const fresh = makeMessage("m-first", "2026-09-09T10:05:00.000Z");

        queue.write(queryClient, KEY, fresh);
        await queue.settle();

        queryClient.setQueryData(KEY, envelope([{ messages: [], hasMore: false }]));
        await queue.settle();

        expect(idsOf(queryClient, KEY)).toEqual(["m-first"]);
        detach();
    });

    it("does not loop when the drain itself triggers another update", async () => {
        const queryClient = makeClient();
        const queue = createMessageWriteQueue();
        const detach = attachDrain(queryClient, queue);

        queue.write(queryClient, KEY, makeMessage("m1", "2026-09-09T10:00:00.000Z"));
        await queue.settle();
        queryClient.setQueryData(KEY, envelope([{ messages: [], hasMore: false }]));
        await queue.settle();

        expect(idsOf(queryClient, KEY)).toEqual(["m1"]);
        expect(queue.pendingCount(KEY)).toBe(0);
        detach();
    });
});