import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { Message, paginatedMessages } from "@/features/Messages/types";
import { createPendingMessageBuffer, ensureMessage, type PendingMessageBuffer } from "./realtimeCache";

export type MessageQueryKey = readonly unknown[];

export function queryKeyId(queryKey: MessageQueryKey): string {
    return JSON.stringify(queryKey);
}

/**
 * Reads the cached page array out of an `InfiniteData` envelope. Returns `undefined` when the query
 * has no usable cache yet (never fetched, or still the placeholder shape) — that is the signal to
 * buffer the frame instead of writing it.
 *
 * Note the deliberate difference between "no pages" (`undefined`) and "empty pages" (`[]`): an empty
 * array means the query resolved and the channel genuinely has no messages, so it is safe to write
 * into directly. `undefined` means a fetch is still outstanding and its snapshot could clobber us.
 */
export function readCachedPages(data: unknown): paginatedMessages[] | undefined {
    const infinite = data as InfiniteData<paginatedMessages> | undefined;
    if (!infinite || !Array.isArray(infinite.pages)) return undefined;
    return infinite.pages;
}

export interface MessageWriteQueue {
    write(queryClient: QueryClient, queryKey: MessageQueryKey, message: Message): void;
    drain(queryClient: QueryClient, queryKey: MessageQueryKey): void;
    pendingCount(queryKey: MessageQueryKey): number;
    clearPending(): void;
    settle(): Promise<void>;
}

/**
 * Applies realtime message frames to the TanStack cache without letting an in-flight history refetch
 * overwrite them.
 *
 * The bug this exists to prevent: on every socket open and channel switch `handleConnected`
 * invalidates the message query, which refetches even though `staleTime` is 60s. `socket.ts` issues
 * that refetch *before* flushing the queued outgoing message, so the refetch's snapshot provably
 * predates the new message. The WebSocket ack then arrives first, appends the message, and the
 * refetch commits its whole `data` object — silently discarding it. The draft was already cleared by
 * a fire-and-forget mutation, so the failure looked like the message was never sent at all.
 *
 * Two rules prevent that:
 *  1. Cached pages present -> cancel the in-flight fetch first, so its stale snapshot is discarded
 *     instead of overwriting the write. `cancelQueries` reverts to the pre-fetch state, so the
 *     already-cached messages survive the cancellation.
 *  2. No cached pages -> buffer the frame and replay it once the fetch lands. Cancelling here would
 *     revert a data-less query to `pending` with nothing left to restart it, so we deliberately do
 *     not cancel and instead let the fetch finish.
 *
 * Writes are serialized through a promise chain because frames arrive in order and each write awaits
 * a cancellation; without it two concurrent writes could interleave.
 */
export function createMessageWriteQueue(): MessageWriteQueue {
    const pending: PendingMessageBuffer = createPendingMessageBuffer();
    let chain: Promise<void> = Promise.resolve();

    function run(task: () => Promise<void>): void {
        chain = chain.then(task).catch((error: unknown) => {
            console.warn("[realtime] message write failed", error);
        });
    }

    function applyToCache(
        queryClient: QueryClient,
        queryKey: MessageQueryKey,
        message: Message,
    ): void {
        queryClient.setQueryData(queryKey, (data) => {
            const infinite = data as InfiniteData<paginatedMessages> | undefined;
            if (!infinite || !Array.isArray(infinite.pages)) return data;
            return { ...infinite, pages: ensureMessage(infinite.pages, message) };
        });
    }

    async function commit(
        queryClient: QueryClient,
        queryKey: MessageQueryKey,
        messages: Message[],
    ): Promise<void> {
        await queryClient.cancelQueries({ queryKey });
        for (const message of messages) {
            applyToCache(queryClient, queryKey, message);
        }
    }

    return {
        write(queryClient, queryKey, message) {
            const key = queryKeyId(queryKey);

            run(async () => {
                if (readCachedPages(queryClient.getQueryData(queryKey)) === undefined) {
                    pending.push(key, message);
                    return;
                }

                await commit(queryClient, queryKey, [message]);
            });
        },

        drain(queryClient, queryKey) {
            const key = queryKeyId(queryKey);
            const messages = pending.take(key);
            if (messages.length === 0) return;

            run(() => commit(queryClient, queryKey, messages));
        },

        pendingCount(queryKey) {
            return pending.size(queryKeyId(queryKey));
        },

        clearPending() {
            pending.clear();
        },

        settle() {
            return chain;
        },
    };
}