import type { Message } from "../types";

export function repliesOf(messages: Message[], parentId: string): Message[] {
    return messages
        .filter((m) => m.parentMsgId === parentId)
        .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
}

export function lastReplyOf(messages: Message[], parentId: string): Message | null {
    const replies = messages.filter((m) => m.parentMsgId === parentId && !m.deletedAt);
    if (replies.length === 0) return null;
    return replies.reduce((latest, reply) =>
        new Date(reply.sentAt).getTime() > new Date(latest.sentAt).getTime() ? reply : latest,
    );
}

export function topLevelMessages(messages: Message[]): Message[] {
    return messages
        .filter((m) => !m.parentMsgId)
        .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
}