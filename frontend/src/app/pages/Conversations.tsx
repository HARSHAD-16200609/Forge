import { MessageComposer } from "@/features/Messages/components/MessageComposer";
import { MessageBubble } from "@/features/Messages/components/MessageBubble";
import { MessageSkeleton } from "@/features/Messages/components/MessageSkeleton";
import { ConvoMembers } from "@/features/Messages/components/ConvoMembers";
import { EmptyConversation } from "@/features/Messages/components/EmptyConversation";
import { TypingIndicator } from "@/features/Messages/components/TypingIndicator";
import { ThreadPanel } from "@/features/Messages/components/ThreadPanel";
import { useConversationMessages } from "@/features/Messages/hooks/useConversationMessages";
import { useSendConversationMessage } from "@/features/Messages/hooks/useSendConversationMessage";
import { useSendReply } from "@/features/Messages/hooks/useSendReply";
import { useEditMessage } from "@/features/Messages/hooks/useEditMessage";
import { useDeleteMessage } from "@/features/Messages/hooks/useDeleteMessage";
import { useReact } from "@/features/Messages/hooks/useReact";
import { useDm } from "@/features/Messages/hooks/useDms";
import { useWorkspaceStore } from "@/features/Workspaces/store/workspaceStore";
import { useUIStore } from "@/stores/uiStore";
import { useThreadStore } from "@/stores/threadStore";
import { lastReplyOf, repliesOf } from "@/features/Messages/utils/threads";
import { getApiError } from "@/lib/errorMessage";
import {
    ConversationNotFound,
    WorkspaceAccessDenied,
} from "@/components/access/AccessDeniedScreens";
import { ErrorScreen } from "@/components/access/ErrorScreen";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AccessManagerCard } from "@/components/ui/health-stat-card";
import type { Member } from "@/components/ui/health-stat-card";
import { cn } from "@/lib/utils";
import { ArrowLeft, Bell, Search, ShieldCheck, TriangleAlert, Users, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { APP_EASE, FadeIn } from "@/components/ui/app-motion";
import type { Message } from "@/features/Messages/types";
import type { ConversationDetail } from "@/features/Messages/types";
import { MessageDateDivider } from "@/features/Messages/components/MessageDateDivider";
import { getDayKey, getMessageDayLabel } from "@/features/Messages/utils/format";
import { usePresenceStore } from "@/realtime/presenceStore";

function resolveMembers(detail?: ConversationDetail): Member[] {
    return (detail?.members ?? []).map((m) => ({
        id: m.user.id,
        name: m.user.username,
        avatar: m.user.avatar ?? undefined,
        role: "Viewer",
    }));
}

function GroupMembersCard({
    detail,
    workspaceId,
    headerName,
}: {
    detail?: ConversationDetail;
    workspaceId?: string;
    headerName: string;
}) {
    const isOnline = usePresenceStore((state) => state.isOnline);

    const [local, setLocal] = useState<Member[] | null>(null);

    const members: Member[] = local ?? resolveMembers(detail);

    const onlineUserIds = members
        .filter((m) => workspaceId && isOnline(workspaceId, m.id))
        .map((m) => m.id);

    const handleInvite = (email: string, role: "Viewer" | "Editor") => {
        const next: Member = {
            id: (members.length + 1).toString(),
            name: email.split("@")[0] || email,
            email,
            avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,
            role,
        };
        setLocal([...members, next]);
    };

    const handleRoleChange = (id: string, newRole: "Viewer" | "Editor") => {
        setLocal((prev) =>
            (prev ?? members).map((m) => (m.id === id ? { ...m, role: newRole } : m)),
        );
    };

    return (
        <AccessManagerCard
            title="Group members"
            description="Who can view and send in this group chat."
            folderName={headerName}
            members={members}
            onlineUserIds={onlineUserIds}
            onInvite={handleInvite}
            onRoleChange={handleRoleChange}
            folderIcon={<ShieldCheck className="h-6 w-6 text-primary" />}
        />
    );
}

export function Conversations({ showBack = false }: { showBack?: boolean }) {
    const navigate = useNavigate();
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

    const sendReply = useSendReply(
        selectedWorkspaceId ?? "",
        selectedConversationId ?? "",
        "conversation",
    );

    const editMessage = useEditMessage(
        "conversation",
        selectedWorkspaceId ?? "",
        selectedConversationId ?? "",
    );
    const deleteMessage = useDeleteMessage(
        "conversation",
        selectedWorkspaceId ?? "",
        selectedConversationId ?? "",
    );
    const react = useReact("conversation", selectedWorkspaceId ?? "", selectedConversationId ?? "");

    const { parent: activeThread, setThread, clearThread } = useThreadStore();
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);

    const convoMembers = useMemo(
        () =>
            (detail?.members ?? []).map((member) => ({
                id: member.user.id,
                username: member.user.username,
                avatar: member.user.avatar,
            })),
        [detail],
    );

    const Messages = useMemo(() => {
        const all = data?.pages.flatMap((page) => page.messages) ?? [];
        const unique = [...new Map(all.map((m) => [m.id, m])).values()];
        return [...unique].sort(
            (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
        );
    }, [data]);

    const topLevel = useMemo(() => Messages.filter((m) => !m.parentMsgId), [Messages]);

    useEffect(() => {
        clearThread();
    }, [selectedConversationId, clearThread]);

    const backendSaysEmpty = getApiError(error).message === "No Messages Found";
    const isEmpty = !isPending && (backendSaysEmpty || (Messages?.length ?? 0) === 0);

    const prevOldestIdRef = useRef<string | null>(null);
    const didAutoScrollRef = useRef(false);
    const reduce = useReducedMotion();
    const [animateGate, setAnimateGate] = useState<{ id: string | null; fresh: boolean }>({
        id: selectedConversationId ?? null,
        fresh: false,
    });

    if ((selectedConversationId ?? null) !== animateGate.id) {
        setAnimateGate({ id: selectedConversationId ?? null, fresh: false });
    }

    if (
        animateGate.id === (selectedConversationId ?? null) &&
        !animateGate.fresh &&
        Messages.length > 0
    ) {
        setAnimateGate({ id: animateGate.id, fresh: true });
    }

    const isFresh = animateGate.id === (selectedConversationId ?? null) && animateGate.fresh;

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

    if (isError && !backendSaysEmpty) {
        const { status, message } = getApiError(error);
        if (status === 403) return <WorkspaceAccessDenied />;
        if (status === 404) return <ConversationNotFound />;
        return (
            <ErrorScreen
                statusCode={status !== undefined ? String(status) : undefined}
                scope="ERROR"
                icon={<TriangleAlert className="size-6" />}
                title="Couldn't load this conversation"
                highlight="conversation"
                description={message}
            />
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
                                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
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
                                <span className="flex size-6 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
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
                    <Popover open={showMembers} onOpenChange={setShowMembers}>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                                aria-label="Members"
                            >
                                <Users className="size-[18px]" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            align="end"
                            sideOffset={6}
                            className={cn(
                                "rounded-2xl border-brand/15 p-0 shadow-xl shadow-brand/10",
                                selectedConversationType === "GDM" ? "w-[24rem]" : "w-[22rem]",
                            )}
                        >
                            {selectedConversationType === "GDM" ? (
                                <GroupMembersCard
                                    key={selectedConversationId}
                                    detail={detail}
                                    workspaceId={selectedWorkspaceId ?? undefined}
                                    headerName={headerName}
                                />
                            ) : (
                                <ConvoMembers
                                    detail={detail}
                                    title={headerName}
                                    type={selectedConversationType ?? "DM"}
                                    workspaceId={selectedWorkspaceId ?? ""}
                                    onClose={() => setShowMembers(false)}
                                />
                            )}
                        </PopoverContent>
                    </Popover>
                    <button
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                        aria-label="Search"
                    >
                        <Search className="size-[18px]" />
                    </button>
                    <button
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                        aria-label="Bell"
                        onClick={() => navigate("/app/notifications")}
                    >
                        <Bell className="size-[18px]" />
                    </button>
                </div>
            </header>

            <div className="flex min-h-0 flex-1">
                <div className="flex min-w-0 flex-1 flex-col">
                    <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="min-h-0 flex-1 overflow-y-auto px-4 py-6"
                    >
                        {isPending && <MessageSkeleton rows={6} />}

                        {isEmpty && (
                            <EmptyConversation
                                detail={detail}
                                type={selectedConversationType}
                                name={headerName}
                            />
                        )}

                        {Messages && Messages.length > 0 && (
                            <>
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.div
                                        key={selectedConversationId}
                                        initial={reduce ? false : { opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={reduce ? undefined : { opacity: 0, y: -6 }}
                                        transition={{ duration: 0.16, ease: APP_EASE }}
                                    >
                                        <div className="space-y-6">
                                            {topLevel.map((message, index) => {
                                                const prev = topLevel[index - 1];
                                                const divider =
                                                    index === 0 ||
                                                    getDayKey(prev.sentAt) !==
                                                        getDayKey(message.sentAt);
                                                const threadReplies = repliesOf(
                                                    Messages,
                                                    message.id,
                                                );
                                                const lastReply = lastReplyOf(Messages, message.id);

                                                return (
                                                    <Fragment key={message.id}>
                                                        {divider && (
                                                            <MessageDateDivider
                                                                label={getMessageDayLabel(
                                                                    message.sentAt,
                                                                )}
                                                            />
                                                        )}
                                                        <FadeIn
                                                            active={isFresh && !isFetchingNextPage}
                                                            y={0}
                                                            duration={0.12}
                                                        >
                                                            <MessageBubble
                                                                message={message}
                                                                workspaceId={
                                                                    selectedWorkspaceId ?? undefined
                                                                }
                                                                onReply={(m) => setReplyingTo(m)}
                                                                onOpenThread={(m) => setThread(m)}
                                                                onEdit={setEditingMessage}
                                                                onDelete={(m) => {
                                                                    if (
                                                                        window.confirm(
                                                                            "Delete this message?",
                                                                        )
                                                                    ) {
                                                                        deleteMessage.mutate({
                                                                            messageId: m.id,
                                                                        });
                                                                    }
                                                                }}
                                                                onReact={(m, emoji) =>
                                                                    react.mutate({
                                                                        messageId: m.id,
                                                                        reaction: emoji,
                                                                    })
                                                                }
                                                                threadSummary={
                                                                    lastReply
                                                                        ? {
                                                                              replyCount:
                                                                                  threadReplies.length,
                                                                              lastReplyAt:
                                                                                  lastReply.sentAt,
                                                                          }
                                                                        : null
                                                                }
                                                            />
                                                        </FadeIn>
                                                    </Fragment>
                                                );
                                            })}

                                            {isFetchingNextPage && <MessageSkeleton rows={2} />}

                                            {!hasNextPage && Messages && Messages.length > 0 && (
                                                <div className="py-4 text-center text-xs text-muted-foreground">
                                                    You&apos;re all caught up
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </>
                        )}
                    </div>

                    <div className="shrink-0 px-4 pb-4">
                        <TypingIndicator
                            entityId={selectedConversationId ?? ""}
                            workspaceId={selectedWorkspaceId}
                        />
                        <MessageComposer
                            key={selectedConversationId}
                            channelId={selectedConversationId ?? ""}
                            channelName={headerName}
                            placeholder={`Message ${headerName}`}
                            disabled={sendMessage.isPending || sendReply.isPending}
                            typingTarget={
                                selectedWorkspaceId
                                    ? {
                                          workspaceId: selectedWorkspaceId,
                                          entityId: selectedConversationId ?? "",
                                          entityType: "conversation",
                                      }
                                    : undefined
                            }
                            replyTo={
                                replyingTo
                                    ? { id: replyingTo.id, sender: replyingTo.sender.username }
                                    : null
                            }
                            onCancelReply={() => setReplyingTo(null)}
                            members={convoMembers}
                            onSend={(content, files, replyToId, mentions) => {
                                if (replyToId) {
                                    return sendReply.mutateAsync(
                                        { messageId: replyToId, content, files, mentions },
                                        { onSuccess: () => setReplyingTo(null) },
                                    );
                                }
                                return sendMessage.mutateAsync({ content, files, mentions });
                            }}
                        />
                    </div>
                </div>

                <AnimatePresence initial={false}>
                    {activeThread && (
                        <ThreadPanel
                            parent={Messages.find((m) => m.id === activeThread.id) ?? activeThread}
                            replies={repliesOf(Messages, activeThread.id)}
                            workspaceId={selectedWorkspaceId ?? ""}
                            entityId={selectedConversationId ?? ""}
                            entityType="conversation"
                            channelName={headerName}
                            members={convoMembers}
                            onEdit={setEditingMessage}
                            onDelete={(m) => {
                                if (window.confirm("Delete this message?")) {
                                    deleteMessage.mutate({ messageId: m.id });
                                }
                            }}
                            onReact={(m, emoji) =>
                                react.mutate({ messageId: m.id, reaction: emoji })
                            }
                            onClose={clearThread}
                        />
                    )}
                </AnimatePresence>
            </div>

            {editingMessage && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center">
                    <div className="w-full max-w-2xl rounded-lg border border-border bg-background p-4 shadow-lg">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-semibold">Edit message</span>
                            <button
                                type="button"
                                aria-label="Close edit"
                                onClick={() => setEditingMessage(null)}
                                className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                        <MessageComposer
                            key={`edit-${editingMessage.id}`}
                            channelId={editingMessage.id}
                            channelName="edit-message"
                            initialContent={editingMessage.content}
                            disabled={editMessage.isPending}
                            onSend={(content) =>
                                editMessage
                                    .mutateAsync({
                                        messageId: editingMessage.id,
                                        content,
                                    })
                                    .then(() => setEditingMessage(null))
                            }
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
