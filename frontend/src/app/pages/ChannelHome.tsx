import { MessageComposer } from "@/features/Messages/components/MessageComposer";
import { useMessages } from "@/features/Messages/hooks/useMessages";
import { useWorkspace } from "@/features/Workspaces/hooks/useWorkspaces";
import { useWorkspaceStore } from "@/features/Workspaces/store/workspaceStore";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import type { AxiosError } from "axios";
import {
    Bell,
    Hash,
    Info,
    Search,
    Star,
    Users,
} from "lucide-react";
import { useState } from "react";

export function ChannelHome() {
    const [isFavourite, setFavourite] = useState(false);
    const { selectedWorkspaceId } = useWorkspaceStore();
    const { selectedChannelId } = useUIStore();
    const WorkspaceDetails = useWorkspace(selectedWorkspaceId ?? "");
    const activeChannel = WorkspaceDetails.data?.channels.find((channel) => channel.id === selectedChannelId)
    const { data, isPending, isError, error } = useMessages({
        workspaceId: selectedWorkspaceId ?? "",
        channelId: selectedChannelId ?? "",
        limit: 30,
    });

    const Messages = data?.pages.flatMap((m) => m.messages);


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
        return <div>Loading messages...</div>;
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
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
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
                                            {message.sentAt}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-[15px] leading-6 break-words">
                                        {message.content}
                                    </p>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            {/* Composer */}
            <div className="shrink-0 px-4 pb-4">
                <MessageComposer channelName={activeChannel?.channelName.split(' ').join('-')} />
            </div>
        </div>
    );
}
