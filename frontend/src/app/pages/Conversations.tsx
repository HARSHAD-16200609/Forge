import { MessageComposer } from "@/features/Messages/components/MessageComposer";
import { BlocksRenderer } from "@/features/Messages/components/BlocksRenderer";
import { MessageAttachments } from "@/features/Messages/components/MessageAttachments";
import { MessageSkeleton } from "@/features/Messages/components/MessageSkeleton";
import { ConvoMembers } from "@/features/Messages/components/ConvoMembers";
import { EmptyConversation } from "@/features/Messages/components/EmptyConversation";
import { formatMessageTime } from "@/features/Messages/utils/format";
import { useConversationMessages } from "@/features/Messages/hooks/useConversationMessages";
import { useSendConversationMessage } from "@/features/Messages/hooks/useSendConversationMessage";
import { useDm } from "@/features/Messages/hooks/useDms";
import { useWorkspaceStore } from "@/features/Workspaces/store/workspaceStore";
import { useUIStore } from "@/stores/uiStore";
import type { AxiosError } from "axios";
import { ArrowLeft, Bell, Search, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export function Conversations({ showBack = false }: { showBack?: boolean }) {
    const selectedConversationId = useUIStore((s) => s.selectedConversationId);
    const selectedConversationType = useUIStore((s) => s.selectedConversationType);
    const clearSelectedConversation = useUIStore((s) => s.clearSelectedConversation);
    const { selectedWorkspaceId } = useWorkspaceStore();

    const [showMembers, setShowMembers] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    const { data: detail } = useDm({
        workspaceId: selectedWorkspaceId ?? "",
        conversationId: selectedConversationId ?? "",
        enabled: !!selectedConversationId,
    });

    const { data, isPending, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useConversationMessages({
            workspaceId: selectedWorkspaceId ?? "",
            conversationId: selectedConversationId ?? "",
            limit: 30,
        });

    const sendMessage = useSendConversationMessage(
        selectedWorkspaceId ?? "",
        selectedConversationId ?? "",
    );

    const Messages = useMemo(() => {
        const all = data?.pages.flatMap((page) => page.messages) ?? [];
        return [...all].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
    }, [data]);

    const backendSaysEmpty =
        (error as AxiosError<{ message: string }>)?.response?.data.message === "No Messages Found";
    const isEmpty = !isPending && (backendSaysEmpty || (Messages?.length ?? 0) === 0);

    const prevOldestIdRef = useRef<string | null>(null);
    const didAutoScrollRef = useRef(false);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el || !Messages?.length) return;

        const oldest = Messages[0];
        const isHistoryLoad =
            prevOldestIdRef.current !== null && oldest.id !== prevOldestIdRef.current;
        prevOldestIdRef.current = oldest.id;

        if (isHistoryLoad) {
            return;
        }

        if (!didAutoScrollRef.current) {
            didAutoScrollRef.current = true;
            el.scrollTop = el.scrollHeight;
            return;
        }

        if (prevOldestIdRef.current === oldest.id) {
            el.scrollTop = el.scrollHeight;
        }
    }, [Messages]);

    useEffect(() => {
        prevOldestIdRef.current = null;
        didAutoScrollRef.current = false;
    }, [selectedConversationId]);

    function handleScroll() {
        const el = scrollRef.current;
        if (!el || !hasNextPage || isFetchingNextPage) return;
        if (el.scrollTop < 120) {
            void fetchNextPage();
        }
    }

    if (!selectedConversationId) {
        return (
            <div className="flex h-full items-center justify-center bg-background">
                <div className="text-sm text-muted-foreground">
                    Select a conversation to view messages
                </div>
            </div>
        );
    }

    const headerName =
        selectedConversationType === "GDM"
            ? (detail?.groupName ?? detail?.displayName ?? "Group")
            : (detail?.displayName ?? detail?.groupName ?? "Direct message");

    const peerMember =
        selectedConversationType === "DM"
            ? detail?.members?.find((m) => m.user.username === detail?.displayName)
            : undefined;

    return (
        <div className="flex h-full flex-col bg-background">
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
                <div className="flex min-w-0 items-center gap-2">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            {showBack && (
                                <button
                                    type="button"
                                    aria-label="Back to home"
                                    onClick={clearSelectedConversation}
                                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    <ArrowLeft className="size-4" />
                                </button>
                            )}

                            {selectedConversationType === "GDM" ? (
                                <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/20">
                                    <Users className="size-3.5 text-emerald-500" />
                                </span>
                            ) : peerMember?.user.avatar ? (
                                <img
                                    src={peerMember.user.avatar}
                                    alt={peerMember.user.username}
                                    className="size-6 rounded-full object-cover"
                                />
                            ) : (
                                <span className="flex size-6 items-center justify-center rounded-full bg-violet-500/20 text-xs font-semibold text-violet-600">
                                    {headerName.charAt(0).toUpperCase()}
                                </span>
                            )}

                            <button
                                type="button"
                                onClick={() => setShowMembers((prev) => !prev)}
                                className="group/mini flex cursor-pointer items-center gap-2 rounded-md py-0.5 pr-1 pl-0"
                            >
                                <span className="truncate text-[15px] font-bold leading-tight">
                                    {headerName}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    <button
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Members"
                        onClick={() => setShowMembers((prev) => !prev)}
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
                </div>
            </header>

            <div className="flex min-h-0 flex-1">
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="min-h-0 flex-1 overflow-y-auto px-4 py-6"
                >
                    {isPending && <MessageSkeleton rows={6} />}

                    {isError && !backendSaysEmpty && (
                        <div className="text-sm text-destructive">
                            {(error as AxiosError<{ message: string }>)?.response?.data.message ??
                                "Failed to load conversation"}
                        </div>
                    )}

                    {isEmpty && (
                        <EmptyConversation
                            detail={detail}
                            type={selectedConversationType}
                            name={headerName}
                        />
                    )}

                    {Messages && Messages.length > 0 && (
                        <>
                            <div className="mb-4 flex items-center gap-3">
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Today
                                </span>
                                <div className="h-px flex-1 bg-border" />
                            </div>

                            <div className="space-y-6">
                                {Messages.map((message) => (
                                    <div key={message.id} className="group flex gap-3">
                                        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-500 text-sm font-bold text-white">
                                            {message.sender?.avatar ? (
                                                <img
                                                    src={message.sender.avatar}
                                                    alt={message.sender?.username ?? "user"}
                                                    className="size-10 rounded-lg object-cover"
                                                />
                                            ) : (
                                                (message.sender?.username ?? "?")
                                                    .charAt(0)
                                                    .toUpperCase()
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-sm font-bold">
                                                    {message.sender?.username}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatMessageTime(message.sentAt)}
                                                </span>
                                            </div>
                                            <BlocksRenderer blocksJson={message.content} />
                                            {message.uploads && message.uploads.length > 0 && (
                                                <MessageAttachments uploads={message.uploads} />
                                            )}
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
                        </>
                    )}
                </div>

                {showMembers && (
                    <ConvoMembers
                        detail={detail}
                        title={headerName}
                        type={selectedConversationType ?? "DM"}
                        onClose={() => setShowMembers(false)}
                    />
                )}
            </div>

            <div className="shrink-0 px-4 pb-4">
                <MessageComposer
                    key={`${selectedConversationId}-${sendMessage.isSuccess ? "reset" : "draft"}`}
                    channelId={selectedConversationId ?? ""}
                    channelName={headerName}
                    placeholder={`Message ${headerName}`}
                    disabled={sendMessage.isPending}
                    onSend={(content, files) => {
                        sendMessage.mutate({ content, files });
                    }}
                />
            </div>
        </div>
    );
}
