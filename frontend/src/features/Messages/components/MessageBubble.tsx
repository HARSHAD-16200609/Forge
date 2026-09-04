import { MessageAttachments } from "./MessageAttachments";
import { BlocksRenderer } from "./BlocksRenderer";
import { formatMessageTime } from "../utils/format";
import type { Message } from "../types";

interface MessageBubbleProps {
    message: Message;
    isReply?: boolean;
    onReply?: (message: Message) => void;
}

export function MessageBubble({ message, isReply = false, onReply }: MessageBubbleProps) {
    return (
        <div className="group flex gap-3">
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white">
                {message.sender.avatar ? (
                    <img
                        src={message.sender.avatar}
                        alt={message.sender.username}
                        className="size-10 rounded-lg object-cover"
                    />
                ) : (
                    <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500">
                        {message.sender.username.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold">{message.sender.username}</span>
                        <span className="text-xs text-muted-foreground">
                            {formatMessageTime(message.sentAt)}
                        </span>
                    </div>
                    {onReply && (
                        <span className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                                type="button"
                                onClick={() => onReply(message)}
                                className="rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                Reply
                            </button>
                        </span>
                    )}
                </div>

                {isReply && message.parentMsg && (
                    <div className="mb-1 mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="font-medium">↩ Replying to</span>
                        <span className="font-semibold text-foreground">
                            @{message.parentMsg.sender.username}
                        </span>
                    </div>
                )}

                <BlocksRenderer blocksJson={message.content} />
                <MessageAttachments uploads={message.uploads} />
            </div>
        </div>
    );
}
