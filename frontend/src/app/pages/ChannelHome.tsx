import { MessageComposer } from "@/features/Messages/components/MessageComposer";
import { BlocksRenderer } from "@/features/Messages/components/BlocksRenderer";
import { MessageAttachments } from "@/features/Messages/components/MessageAttachments";
import { MessageSkeleton } from "@/features/Messages/components/MessageSkeleton";
import { formatMessageTime } from "@/features/Messages/utils/format";
import { useMessages } from "@/features/Messages/hooks/useMessages";
import { useSendMessage } from "@/features/Messages/hooks/useSendMessage";
import { useWorkspace } from "@/features/Workspaces/hooks/useWorkspaces";
import { useWorkspaceStore } from "@/features/Workspaces/store/workspaceStore";
import { cn } from "@/lib/utils";
import { useComposerStore } from "@/stores/composerStore";
import { useUIStore } from "@/stores/uiStore";
import type { AxiosError } from "axios";
import { Bell, Hash, Info, Search, Star, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Conversations } from "./Conversations";

export function ChannelHome() {
    const activeSection = useUIStore((s) => s.activeSection);
    const selectedConversationId = useUIStore((s) => s.selectedConversationId);

    if (activeSection === "dms") {
        return <Conversations />;
    }

    if (activeSection === "home" && selectedConversationId) {
        return <Conversations  />;
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
    const scrollRef = useRef<HTMLDivElement>(null);

    const Messages = data?.pages.flatMap((m) => m.messages);

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
                    {Messages &&
                        Messages.map((message) => (
                            <div key={message.id} className="group flex gap-3">
                                <div
                                    className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white `}
                                >
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
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-bold">
                                            {message.sender.username}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatMessageTime(message.sentAt)}
                                        </span>
                                    </div>
                                    <BlocksRenderer blocksJson={message.content} />
                                    <MessageAttachments uploads={message.uploads} />
                                </div>
                            </div>
                        ))}

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
                    key={`${selectedChannelId}-${sendMessage.isSuccess ? "reset" : "draft"}`}
                    channelId={selectedChannelId}
                    channelName={activeChannel?.channelName ?? "new-channel"}
                    disabled={sendMessage.isPending}
                    onSend={(content, files) => {
                        sendMessage.mutate({ content, files });
                    }}
                />
            </div>
        </div>
    );
}
