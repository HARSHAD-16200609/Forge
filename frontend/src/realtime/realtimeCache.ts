import type {
    Conversations,
    Message,
    MessageReaction,
    paginatedMessages,
    ReactionDelta,
} from "@/features/Messages/types";

export function upsertMessage(
    pages: paginatedMessages[] | undefined,
    message: Message,
): paginatedMessages[] | undefined {
    if (!pages) return pages;

    const found = pages.findIndex((page) => page.messages.some((m) => m.id === message.id));
    if (found !== -1) {
        const page = pages[found];
        const index = page.messages.findIndex((m) => m.id === message.id);
        const messages = page.messages.slice();
        messages[index] = message;
        const next = pages.slice();
        next[found] = { ...page, messages };
        return next;
    }

    if (pages.length === 0) return pages;

    const newest = pages[0];
    return [{ ...newest, messages: [...newest.messages, message] }, ...pages.slice(1)];
}

/**
 * `upsertMessage` cannot append to an empty page array, which is exactly the state of a freshly
 * loaded channel that has no messages yet — i.e. the "first message in a channel" case. This seeds
 * the first page when one is needed and otherwise defers to `upsertMessage`.
 */
export function ensureMessage(
    pages: paginatedMessages[],
    message: Message,
): paginatedMessages[] {
    if (pages.length === 0) {
        return [{ messages: [message], hasMore: false }];
    }

    return upsertMessage(pages, message) ?? pages;
}

export interface PendingMessageBuffer {
    push(key: string, message: Message): void;
    take(key: string): Message[];
    size(key: string): number;
    clear(): void;
}

const MAX_PENDING_PER_KEY = 100;

/**
 * Holds realtime message frames that arrive before their query has any cached page. Without this
 * the frame is dropped on the floor (see `upsertMessage`'s `if (!pages) return pages` guard) and the
 * message never renders until a manual refetch.
 */
export function createPendingMessageBuffer(): PendingMessageBuffer {
    const store = new Map<string, Message[]>();

    return {
        push(key, message) {
            const list = store.get(key);
            if (!list) {
                store.set(key, [message]);
                return;
            }
            if (list.some((existing) => existing.id === message.id)) return;
            if (list.length >= MAX_PENDING_PER_KEY) return;
            list.push(message);
        },
        take(key) {
            const list = store.get(key);
            if (!list) return [];
            store.delete(key);
            return list;
        },
        size(key) {
            return store.get(key)?.length ?? 0;
        },
        clear() {
            store.clear();
        },
    };
}

function reactionKey(reaction: MessageReaction): string {
    return `${reaction.emoji}:${reaction.reactedBy.id}`;
}

function applyReactionDeltaToPage(
    page: paginatedMessages,
    delta: ReactionDelta,
): paginatedMessages {
    const messages = page.messages.map((message) => {
        if (message.id !== delta.messageId) return message;

        const keyOf = (reaction: MessageReaction, user: string) => `${reaction.emoji}:${user}`;
        const targetKey = keyOf({ emoji: delta.reaction } as MessageReaction, delta.userId);

        let reactions = message.reactions.slice();

        if (delta.action === "removed") {
            const remaining = reactions.filter((r) => reactionKey(r) !== targetKey);
            if (remaining.length === reactions.length) return message;
            reactions = remaining;
        } else {
            if (reactions.some((r) => reactionKey(r) === targetKey)) {
                return message;
            }
            reactions = [
                ...reactions,
                {
                    emoji: delta.reaction,
                    reactedBy: {
                        id: delta.userId,
                        username: delta.username,
                        name: "",
                        avatar: null,
                    },
                },
            ];
        }

        return { ...message, reactions };
    });

    return { ...page, messages };
}

export function applyReactionDelta(
    pages: paginatedMessages[] | undefined,
    delta: ReactionDelta,
): paginatedMessages[] | undefined {
    if (!pages) return pages;
    return pages.map((page) => applyReactionDeltaToPage(page, delta));
}

function extractPlainText(content: string): string {
    try {
        const parsed: unknown = JSON.parse(content);
        if (Array.isArray(parsed)) {
            return parsed
                .map((block) => {
                    const text =
                        block && typeof block === "object" && "data" in block
                            ? ((block as { data?: unknown }).data as unknown)
                            : undefined;
                    if (text && typeof text === "object") {
                        return Object.values(text as Record<string, unknown>)
                            .filter((value): value is string => typeof value === "string")
                            .join(" ");
                    }
                    return "";
                })
                .filter(Boolean)
                .join(" ");
        }
    } catch {
        /* fall through to raw content */
    }
    return content;
}

export function updateConversationLastMessage(
    cache: Conversations | undefined,
    conversationId: string,
    message: Message,
): Conversations | undefined {
    if (!cache || message.deletedAt) return cache;

    return {
        ...cache,
        conversations: cache.conversations.map((conversation) =>
            conversation.id === conversationId
                ? {
                      ...conversation,
                      lastMessage: {
                          content: extractPlainText(message.content),
                          sentAt: message.sentAt,
                      },
                  }
                : conversation,
        ),
    };
}

export { extractPlainText };
