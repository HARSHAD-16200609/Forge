import { MessageComposer } from "@/features/Messages/components/MessageComposer";
import { MessageBubble } from "@/features/Messages/components/MessageBubble";
import { MessageSkeleton } from "@/features/Messages/components/MessageSkeleton";
import { TypingIndicator } from "@/features/Messages/components/TypingIndicator";
import { useMessages } from "@/features/Messages/hooks/useMessages";
import { useSendMessage } from "@/features/Messages/hooks/useSendMessage";
import { useSendReply } from "@/features/Messages/hooks/useSendReply";
import { useEditMessage } from "@/features/Messages/hooks/useEditMessage";
import { useDeleteMessage } from "@/features/Messages/hooks/useDeleteMessage";
import { useReact } from "@/features/Messages/hooks/useReact";
import { useWorkspace } from "@/features/Workspaces/hooks/useWorkspaces";
import { useWorkspaceStore } from "@/features/Workspaces/store/workspaceStore";
import { cn } from "@/lib/utils";
import { useComposerStore } from "@/stores/composerStore";
import { useUIStore } from "@/stores/uiStore";
import type { AxiosError } from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, Hash, Info, Search, Star, Users, X } from "lucide-react";
import { Conversations } from "./Conversations";
import { APP_EASE, FadeIn } from "@/components/ui/app-motion";
import type { Message } from "@/features/Messages/types";

export function ChannelHome() {
    const activeSection = useUIStore((s) => s.activeSection);
    const selectedConversationId = useUIStore((s) => s.selectedConversationId);

    if (activeSection === "dms") {
        return <Conversations />;
    }

    if (activeSection === "home" && selectedConversationId) {
        return <Conversations />;
    }

    return <ChannelHomeInner />;
}

function ChannelHomeInner() {
    const [isFavourite, setFavourite] = useState(false);
    const reduce = useReducedMotion();
    const clearDraft = useComposerStore((state) => state.clearDraft);
    const { selectedWorkspaceId } = useWorkspaceStore();
    const { selectedChannelId, setSelectedChannelId } = useUIStore();
    const WorkspaceDetails = useWorkspace(selectedWorkspaceId ?? "");
    const activeChannel = WorkspaceDetails.data?.channels.find(
        (channel) => channel.id === selectedChannelId,
    );

    useEffect(() => {
        const channels = WorkspaceDetails.data?.channels;
        if (selectedChannelId || !channels || channels.length === 0) return;

        const general =
            channels.find((c) => c.channelName.toLowerCase() === "general") ?? channels[0];
        setSelectedChannelId(general.id);
    }, [WorkspaceDetails.data, selectedChannelId, setSelectedChannelId]);
    const { data, isPending, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useMessages({
            workspaceId: selectedWorkspaceId ?? "",
            channelId: selectedChannelId ?? "",
            limit: 30,
        });
    const sendMessage = useSendMessage(selectedWorkspaceId ?? "", selectedChannelId ?? "");
    const sendReply = useSendReply(
        selectedWorkspaceId ?? "",
        selectedChannelId ?? "",
        "channel",
    );
    const editMessage = useEditMessage("channel", selectedWorkspaceId ?? "", selectedChannelId ?? "");
    const deleteMessage = useDeleteMessage("channel", selectedWorkspaceId ?? "", selectedChannelId ?? "");
    const react = useReact("channel", selectedWorkspaceId ?? "", selectedChannelId ?? "");
    const scrollRef = useRef<HTMLDivElement>(null);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);

    const Messages = useMemo(() => {
        const all = data?.pages.flatMap((page) => page.messages) ?? [];
        return [...all].sort(
            (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
        );
    }, [data]);

    const flattened = useMemo(() => {
        const topLevel = Messages.filter((m) => !m.parentMsgId);
        const repliesByParent = new Map<string, Message[]>();
        for (const m of Messages) {
            if (m.parentMsgId) {
                const list = repliesByParent.get(m.parentMsgId) ?? [];
                list.push(m);
                repliesByParent.set(m.parentMsgId, list);
            }
        }
        const out: Message[] = [];
        for (const parent of topLevel) {
            out.push(parent);
            const children = repliesByParent.get(parent.id) ?? [];
            children.sort(
                (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
            );
            out.push(...children);
        }
        return out;
    }, [Messages]);

    useEffect(() => {
        if (sendMessage.isSuccess) {
            clearDraft(selectedChannelId ?? "");
        }
    }, [sendMessage.isSuccess, selectedChannelId, clearDraft]);

    const nearBottomRef = useRef(true);

    useEffect(() => {
        nearBottomRef.current = true;
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [selectedChannelId]);

    const [animateGate, setAnimateGate] = useState<{ id: string | null; fresh: boolean }>({
        id: selectedChannelId ?? null,
        fresh: false,
    });

    if ((selectedChannelId ?? null) !== animateGate.id) {
        setAnimateGate({ id: selectedChannelId ?? null, fresh: false });
    }

    if (
        animateGate.id === (selectedChannelId ?? null) &&
        !animateGate.fresh &&
        flattened.length > 0
    ) {
        setAnimateGate({ id: animateGate.id, fresh: true });
    }

    const isFresh = animateGate.id === (selectedChannelId ?? null) && animateGate.fresh;

    useEffect(() => {
        const el = scrollRef.current;
        if (el && hasNextPage && !isFetchingNextPage && el.scrollHeight <= el.clientHeight + 120) {
            void fetchNextPage();
        }
    }, [data, hasNextPage, isFetchingNextPage, fetchNextPage]);

    useEffect(() => {
        const el = scrollRef.current;
        if (el && nearBottomRef.current) {
            el.scrollTop = el.scrollHeight;
        }
    }, [flattened.length]);

    function handleScroll() {
        const el = scrollRef.current;
        if (!el) return;
        nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        if (hasNextPage && !isFetchingNextPage && nearBottomRef.current) {
            void fetchNextPage();
        }
    }

    const closeEdit = () => {
        if (editingMessage) clearDraft(editingMessage.id);
        setEditingMessage(null);
    };

    if (!selectedChannelId) {
        return (
            <div className="flex h-full items-center justify-center bg-background">
                <div className="text-sm text-muted-foreground">
                    Select a channel to view messages
                </div>
            </div>
        );
    }

    if (isPending) {
        return <MessageSkeleton rows={6} />;
    }

    if (isError) {
        const axiosError = error as AxiosError<{
            message: string;
        }>;

        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-sm text-destructive">
                    {axiosError.response?.data.message ?? "Failed to load messages"}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col bg-background">
            {/* Header */}
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
                <div className="flex min-w-0 items-center gap-2">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                            <button
                                type="button"
                                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-amber-500 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                                onClick={() => setFavourite((prev) => !prev)}
                                aria-label={isFavourite ? "Remove from favourites" : "Add to favourites"}
                            >
                                <Star
                                    className={cn(
                                        "size-[18px] transition-colors",
                                        isFavourite ? "text-amber-500" : "text-muted-foreground",
                                    )}
                                    fill={isFavourite ? "currentColor" : "none"}
                                    strokeWidth={isFavourite ? 0 : 2}
                                />
                            </button>

                            <div className="flex min-w-0 items-center gap-1.5">
                                <span className="bg-brand/10 flex size-6 shrink-0 items-center justify-center rounded-md text-brand">
                                    <Hash className="size-3.5" />
                                </span>
                                <span className="truncate text-[15px] font-bold leading-tight">
                                    {activeChannel && activeChannel.channelName}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-0.5">
                    <button
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                        aria-label="Members"
                    >
                        <Users className="size-[18px]" />
                    </button>
                    <button
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                        aria-label="Search"
                    >
                        <Search className="size-[18px]" />
                    </button>
                    <button
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                        aria-label="Notifications"
                    >
                        <Bell className="size-[18px]" />
                    </button>
                    <button
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                        aria-label="Details"
                    >
                        <Info className="size-[18px]" />
                    </button>
                </div>
            </header>

            {/* Messages area */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="min-h-0 flex-1 overflow-y-auto px-4 py-6"
            >
                {/* Channel intro banner */}
                <div className="mb-6"></div>

                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={selectedChannelId}
                        initial={reduce ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduce ? undefined : { opacity: 0, y: -6 }}
                        transition={{ duration: 0.16, ease: APP_EASE }}
                    >
                        {/* Date divider */}
                        <div className="mb-4 flex items-center gap-3">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Today
                            </span>
                            <div className="h-px flex-1 bg-border" />
                        </div>

                        {flattened.length === 0 && (
                            <div className="py-10 text-center text-sm text-muted-foreground">
                                No messages in #{activeChannel?.channelName ?? "channel"} yet.
                                Start the conversation!
                            </div>
                        )}

                        {/* Messages */}
                        <div className="space-y-6">
                            {flattened.map((message) =>
                                message.parentMsgId ? (
                                    <div
                                        key={message.id}
                                        className="ml-12 border-l-2 border-border pl-3"
                                    >
                                        <FadeIn
                                            active={isFresh && !isFetchingNextPage}
                                            y={0}
                                            duration={0.12}
                                        >
                                            <MessageBubble
                                                message={message}
                                                onReply={(m) => setReplyingTo(m)}
                                                onEdit={setEditingMessage}
                                                onDelete={(m) => {
                                                    if (
                                                        window.confirm("Delete this message?")
                                                    ) {
                                                        deleteMessage.mutate({ messageId: m.id });
                                                    }
                                                }}
                                                onReact={(m, emoji) =>
                                                    react.mutate({
                                                        messageId: m.id,
                                                        reaction: emoji,
                                                    })
                                                }
                                            />
                                        </FadeIn>
                                    </div>
                                ) : (
                                    <FadeIn
                                        key={message.id}
                                        active={isFresh && !isFetchingNextPage}
                                        y={0}
                                        duration={0.12}
                                    >
                                        <MessageBubble
                                            message={message}
                                            onReply={(m) => setReplyingTo(m)}
                                            onEdit={setEditingMessage}
                                            onDelete={(m) => {
                                                if (window.confirm("Delete this message?")) {
                                                    deleteMessage.mutate({ messageId: m.id });
                                                }
                                            }}
                                            onReact={(m, emoji) =>
                                                react.mutate({ messageId: m.id, reaction: emoji })
                                            }
                                        />
                                    </FadeIn>
                                ),
                            )}

                            {isFetchingNextPage && <MessageSkeleton rows={2} />}

                            {!hasNextPage && Messages && Messages.length > 0 && (
                                <div className="py-4 text-center text-xs text-muted-foreground">
                                    You&apos;re all caught up
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Composer */}
            <div className="shrink-0 px-4 pb-4">
                <TypingIndicator entityId={selectedChannelId} workspaceId={selectedWorkspaceId} />
                <MessageComposer
                    key={selectedChannelId}
                    channelId={selectedChannelId}
                    channelName={activeChannel?.channelName ?? "new-channel"}
                    disabled={sendMessage.isPending || sendReply.isPending}
                    typingTarget={
                        selectedWorkspaceId
                            ? {
                                  workspaceId: selectedWorkspaceId,
                                  entityId: selectedChannelId,
                                  entityType: "channel",
                              }
                            : undefined
                    }
                    replyTo={
                        replyingTo
                            ? { id: replyingTo.id, sender: replyingTo.sender.username }
                            : null
                    }
                    onCancelReply={() => setReplyingTo(null)}
                    onSend={(content, files, replyToId) => {
                        if (replyToId) {
                            return sendReply.mutateAsync(
                                { messageId: replyToId, content, files },
                                { onSuccess: () => setReplyingTo(null) },
                            );
                        }
                        return sendMessage.mutateAsync({ content, files });
                    }}
                />
            </div>

            {editingMessage && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center">
                    <div className="w-full max-w-2xl rounded-lg border border-border bg-background p-4 shadow-lg">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-semibold">Edit message</span>
                            <button
                                type="button"
                                aria-label="Close edit"
                                onClick={closeEdit}
                                className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                        <MessageComposer
                            key={`edit-${editingMessage.id}`}
                            channelId={editingMessage.id}
                            placeholder="Edit your message"
                            initialContent={editingMessage.content}
                            disabled={editMessage.isPending}
                            onSend={(content) =>
                                editMessage
                                    .mutateAsync({
                                        messageId: editingMessage.id,
                                        content,
                                    })
                                    .then(closeEdit)
                            }
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
