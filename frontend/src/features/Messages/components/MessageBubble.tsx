import { useMemo, useState } from "react";
import { MessageAttachments } from "./MessageAttachments";
import { BlocksRenderer } from "./BlocksRenderer";
import { formatMessageTime } from "../utils/format";
import useAuth from "@/features/auth/hooks/useAuth";
import type { Message, MessageSender } from "../types";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🎉", "✅"];

interface MessageBubbleProps {
    message: Message;
    onReply?: (message: Message) => void;
    onEdit?: (message: Message) => void;
    onDelete?: (message: Message) => void;
    onReact?: (message: Message, emoji: string) => void;
}

function initialsOf(sender: MessageSender): string {
    const value = sender.name || sender.username;
    return value.charAt(0).toUpperCase();
}

export function MessageBubble({
    message,
    onReply,
    onEdit,
    onDelete,
    onReact,
}: MessageBubbleProps) {
    const currentUser = useAuth().user;
    const [showActions, setShowActions] = useState(false);

    const isMine = currentUser?.id === message.sender.id;
    const isDeleted = message.deletedAt !== null;
    const isEdited = message.editedAt !== null && !isDeleted;

    const groupedReactions = useMemo(() => {
        const map = new Map<string, { emoji: string; users: MessageSender[] }>();
        for (const reaction of message.reactions) {
            const existing = map.get(reaction.emoji) ?? { emoji: reaction.emoji, users: [] };
            existing.users.push(reaction.reactedBy);
            map.set(reaction.emoji, existing);
        }
        return Array.from(map.values());
    }, [message.reactions]);

    if (isDeleted) {
        return (
            <div className="group flex gap-3">
                <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground/60">
                    {initialsOf(message.sender)}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-muted-foreground/70">
                            {message.sender.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {formatMessageTime(message.sentAt)}
                        </span>
                    </div>
                    <p className="text-sm italic text-muted-foreground/80">
                        This message was deleted.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="group flex gap-3"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white">
                {message.sender.avatar ? (
                    <img
                        src={message.sender.avatar}
                        alt={message.sender.username}
                        className="size-10 rounded-lg object-cover"
                    />
                ) : (
                    <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500">
                        {initialsOf(message.sender)}
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <div className="flex min-w-0 items-baseline gap-2">
                        <span className="truncate text-sm font-bold">{message.sender.username}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                            {formatMessageTime(message.sentAt)}
                        </span>
                        {isEdited && (
                            <span
                                className="shrink-0 text-xs text-muted-foreground"
                                title="This message was edited"
                            >
                                (edited)
                            </span>
                        )}
                    </div>

                    {showActions && (
                        <span className="ml-auto flex shrink-0 items-center gap-0.5 rounded-md bg-background px-1.5 py-0.5 shadow-sm ring-1 ring-border">
                            {onReact &&
                                QUICK_REACTIONS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        aria-label={`React ${emoji}`}
                                        onClick={() => onReact(message, emoji)}
                                        className="rounded px-1 py-0.5 text-sm transition-colors hover:bg-muted"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            {isMine && onEdit && (
                                <button
                                    type="button"
                                    onClick={() => onEdit(message)}
                                    className="rounded px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    Edit
                                </button>
                            )}
                            {isMine && onDelete && (
                                <button
                                    type="button"
                                    onClick={() => onDelete(message)}
                                    className="rounded px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                >
                                    Delete
                                </button>
                            )}
                            {onReply && (
                                <button
                                    type="button"
                                    onClick={() => onReply(message)}
                                    className="rounded px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    Reply
                                </button>
                            )}
                        </span>
                    )}
                </div>

                <BlocksRenderer blocksJson={message.content} />
                <MessageAttachments uploads={message.uploads} />

                {groupedReactions.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {groupedReactions.map(({ emoji, users }) => {
                            const myReacted = users.some((user) => user.id === currentUser?.id);
                            return (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => onReact?.(message, emoji)}
                                    title={users.map((user) => user.username).join(", ")}
                                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1 transition-colors ${
                                        myReacted
                                            ? "bg-primary/10 ring-primary/30"
                                            : "bg-muted ring-border hover:bg-accent"
                                    }`}
                                >
                                    <span>{emoji}</span>
                                    <span className="font-medium text-muted-foreground">
                                        {users.length}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}