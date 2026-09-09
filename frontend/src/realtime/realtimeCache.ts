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

    return pages.map((page) => {
        const index = page.messages.findIndex((m) => m.id === message.id);
        if (index === -1) {
            return { ...page, messages: [...page.messages, message] };
        }
        const messages = page.messages.slice();
        messages[index] = message;
        return { ...page, messages };
    });
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

        const keyOf = (reaction: MessageReaction, user: string) =>
            `${reaction.emoji}:${user}`;
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