import { motion, useReducedMotion } from "framer-motion";
import { MessageSquare, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { APP_EASE } from "@/components/ui/app-motion";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { TypingIndicator } from "./TypingIndicator";
import { useSendReply } from "@/features/Messages/hooks/useSendReply";
import { useUIStore } from "@/stores/uiStore";
import type { Message, WsMessageEntityType } from "@/features/Messages/types";
import type { MentionMember } from "@/features/Messages/utils/mentions";

interface ThreadPanelProps {
    parent: Message;
    replies: Message[];
    workspaceId: string;
    entityId: string;
    entityType: WsMessageEntityType;
    channelName?: string;
    members?: MentionMember[];
    onEdit?: (message: Message) => void;
    onDelete?: (message: Message) => void;
    onReact?: (message: Message, emoji: string) => void;
    onClose: () => void;
}

export function ThreadPanel({
    parent,
    replies,
    workspaceId,
    entityId,
    entityType,
    channelName,
    members,
    onEdit,
    onDelete,
    onReact,
    onClose,
}: ThreadPanelProps) {
    const reduce = useReducedMotion();
    const sendReply = useSendReply(workspaceId, entityId, entityType);
    const [pending, setPending] = useState(false);
    const threadWidth = useUIStore((s) => s.threadWidth);
    const setThreadWidth = useUIStore((s) => s.setThreadWidth);
    const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

    const onPointerDown = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            event.preventDefault();
            event.stopPropagation();
            dragRef.current = { startX: event.clientX, startWidth: threadWidth };
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
        },
        [threadWidth],
    );

    const onPointerMove = useCallback(
        (event: PointerEvent) => {
            const drag = dragRef.current;
            if (!drag) return;
            const delta = drag.startX - event.clientX;
            setThreadWidth(drag.startWidth + delta);
        },
        [setThreadWidth],
    );

    const stopDragging = useCallback(() => {
        dragRef.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
    }, []);

    useEffect(() => {
        if (!dragRef.current) return;
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", stopDragging);
        return () => {
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", stopDragging);
        };
    }, [onPointerMove, stopDragging]);

    return (
        <motion.div
            initial={reduce ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: 24 }}
            transition={{ duration: 0.18, ease: APP_EASE }}
            className="relative flex h-full shrink-0 flex-col border-l border-border bg-background"
            style={{ width: threadWidth }}
        >
            <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize thread panel"
                onPointerDown={onPointerDown}
                className="absolute -left-1.5 top-0 h-full w-3 cursor-col-resize"
            />
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
                <div className="flex items-center gap-2">
                    <MessageSquare className="size-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Thread</span>
                    {replies.length > 0 && (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                            {replies.length}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    aria-label="Close thread"
                    onClick={onClose}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                    <X className="size-4" />
                </button>
            </div>

            {channelName && (
                <div className="border-b border-border px-4 py-1.5 text-xs text-muted-foreground">
                    in #{channelName}
                </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <div className="border-l-2 border-brand/25 pb-2 pl-3">
                    <MessageBubble message={parent} hideActions workspaceId={workspaceId} />
                </div>

                <div className="mt-2 space-y-5">
                    {replies.length === 0 && (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                            No replies yet — start the thread.
                        </p>
                    )}
                    {replies.map((reply) => (
                        <MessageBubble
                            key={reply.id}
                            message={reply}
                            workspaceId={workspaceId}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onReact={onReact}
                        />
                    ))}
                </div>
            </div>

            <div className="shrink-0 px-4 pb-4">
                <TypingIndicator entityId={entityId} workspaceId={workspaceId} />
                <MessageComposer
                    key={parent.id}
                    channelId={parent.id}
                    placeholder={`Reply to ${parent.sender.username}`}
                    disabled={sendReply.isPending || pending}
                    typingTarget={{ workspaceId, entityId, entityType }}
                    members={members}
                    onSend={async (content, files, _replyToId, mentions) => {
                        setPending(true);
                        try {
                            await sendReply.mutateAsync({
                                messageId: parent.id,
                                content,
                                files,
                                mentions,
                            });
                        } finally {
                            setPending(false);
                        }
                    }}
                />
            </div>
        </motion.div>
    );
}
