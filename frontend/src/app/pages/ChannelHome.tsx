import { MessageComposer } from "@/features/Messages/components/MessageComposer";
import { MessageBubble } from "@/features/Messages/components/MessageBubble";
import { MessageSkeleton } from "@/features/Messages/components/MessageSkeleton";
import { useMessages } from "@/features/Messages/hooks/useMessages";
import { useSendMessage } from "@/features/Messages/hooks/useSendMessage";
import { useSendReply } from "@/features/Messages/hooks/useSendReply";
import { useWorkspace } from "@/features/Workspaces/hooks/useWorkspaces";
import { useWorkspaceStore } from "@/features/Workspaces/store/workspaceStore";
import { cn } from "@/lib/utils";
import { useComposerStore } from "@/stores/composerStore";
import { useUIStore } from "@/stores/uiStore";
import type { AxiosError } from "axios";
import { Bell, Hash, Info, Search, Star, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Conversations } from "./Conversations";
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
        { workspaceId: selectedWorkspaceId ?? "", channelId: selectedChannelId ?? "" },
        ["messages", selectedChannelId ?? ""],
    );
    const scrollRef = useRef<HTMLDivElement>(null);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);

    const Messages = data?.pages.flatMap((m) => m.messages);

    const topLevelMessages = Messages?.filter((m) => !m.parentMsgId) ?? [];
    const repliesByParent = new Map<string, Message[]>();
    Messages?.forEach((m) => {
        if (m.parentMsgId) {
            const list = repliesByParent.get(m.parentMsgId) ?? [];
            list.push(m);
            repliesByParent.set(m.parentMsgId, list);
        }
    });
    const flattened: Message[] = [];
    topLevelMessages.forEach((m) => {
        flattened.push(m);
        (repliesByParent.get(m.id) ?? []).forEach((r) => flattened.push(r));
    });

    useEffect(() => {
        if (sendMessage.isSuccess) {
            clearDraft(selectedChannelId ?? "");
        }
    }, [sendMessage.isSuccess, selectedChannelId, clearDraft]);

    useEffect(() => {
        const el = scrollRef.current;
        if (el && hasNextPage && !isFetchingNextPage && el.scrollHeight <= el.clientHeight + 120) {
            void fetchNextPage();
        }
    }, [data, hasNextPage, isFetchingNextPage, fetchNextPage]);

    function handleScroll() {
        const el = scrollRef.current;
        if (!el || !hasNextPage || isFetchingNextPage) return;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
            void fetchNextPage();
        }
    }

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
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                className="shrink-0 rounded-sm p-0.5 text-muted-foreground hover:bg-sidebar-accent hover:text-amber-500 "
                                onClick={() => setFavourite((prev) => !prev)}
                            >
                                <Star
                                    className={cn(
                                        "size-5 transition-colors",
                                        isFavourite ? "text-amber-500" : "text-muted-foreground",
                                    )}
                                    fill={isFavourite ? "currentColor" : "none"}
                                    strokeWidth={isFavourite ? 0 : 2}
                                />
                            </button>

                            <div className="flex min-w-0 items-center gap-1">
                                <Hash className="size-5 shrink-0 text-muted-foreground " />

                                <span className="truncate text-[15px] font-bold leading-tight ">
                                    {activeChannel && activeChannel.channelName}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    <button
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Members"
                    >
                        <Users className="size-[18px]" />
                    </button>
                    <button
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Search"
                    >
                        <Search className="size-[18px]" />
                    </button>
                    <button
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Bell"
                    >
                        <Bell className="size-[18px]" />
                    </button>
                    <button
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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

                {/* Date divider */}
                <div className="mb-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Today
                    </span>
                    <div className="h-px flex-1 bg-border" />
                </div>

                {/* Messages */}
                <div className="space-y-6">
                    {flattened.map((message) =>
                        message.parentMsgId ? (
                            <div key={message.id} className="ml-12 border-l-2 border-border pl-3">
                                <MessageBubble
                                    message={message}
                                    isReply
                                    onReply={(m) => setReplyingTo(m)}
                                />
                            </div>
                        ) : (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                onReply={(m) => setReplyingTo(m)}
                            />
                        ),
                    )}

                    {isFetchingNextPage && <MessageSkeleton rows={2} />}

                    {!hasNextPage && Messages && Messages.length > 0 && (
                        <div className="py-4 text-center text-xs text-muted-foreground">
                            You&apos;re all caught up
                        </div>
                    )}
                </div>
            </div>

            {/* Composer */}
            <div className="shrink-0 px-4 pb-4">
                <MessageComposer
                    key={selectedChannelId}
                    channelId={selectedChannelId}
                    channelName={activeChannel?.channelName ?? "new-channel"}
                    disabled={sendMessage.isPending || sendReply.isPending}
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
        </div>
    );
}
