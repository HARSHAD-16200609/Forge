import { useMemo, useState } from "react";
import { AtSign, Bell, CheckCheck, Inbox, Link2, Loader2, Check, X } from "lucide-react";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { PageEmptyState } from "@/components/ui/page-empty-state";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/features/Workspaces/hooks/useWorkspaces";
import { useDms } from "@/features/Messages/hooks/useDms";
import { useUIStore } from "@/stores/uiStore";
import { notificationsService } from "@/features/Notifications/notifications.service";
import { invitationService } from "@/features/Invitations/invitation.service";
import type {
    AppNotification,
    MentionMetadata,
    NotificationFilter,
} from "@/features/Notifications/notifications.service";

type TabId = "unread" | "mentions" | "activity" | "invites";

const tabs: {
    id: TabId;
    label: string;
    icon: typeof AtSign;
    filter: NotificationFilter;
}[] = [
    { id: "unread", label: "Unread", icon: Inbox, filter: "unread" },
    { id: "mentions", label: "Mentions", icon: AtSign, filter: "mentions" },
    { id: "activity", label: "Activity", icon: Bell, filter: "activity" },
    { id: "invites", label: "Invites", icon: Link2, filter: "invites" },
];

interface InviteMetadata {
    kind: "channel";
    workspaceId: string;
    channelId?: string;
    inviteId?: string;
}

function timeAgo(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

function useTargetName(metadata: MentionMetadata | null): string | undefined {
    const workspaceId = metadata?.workspaceId ?? "";
    const { data: workspace } = useWorkspace(workspaceId);
    const { data: dms } = useDms(workspaceId);

    return useMemo(() => {
        if (!metadata) return undefined;
        if (metadata.kind === "channel" && metadata.channelId) {
            return workspace?.channels.find((c) => c.id === metadata.channelId)?.channelName;
        }
        if (metadata.kind === "conversation" && metadata.conversationId) {
            return dms?.conversations.find((c) => c.id === metadata.conversationId)?.displayName;
        }
        return undefined;
    }, [metadata, workspace, dms]);
}

function NotificationRow({
    notification,
    onOpen,
    highlight,
    action,
    busy,
}: {
    notification: AppNotification;
    onOpen: (notification: AppNotification) => void;
    highlight: boolean;
    action: (notification: AppNotification, action: "accept" | "reject") => void;
    busy: boolean;
}) {
    const metadata = (notification.metadata ?? null) as MentionMetadata | null;
    const targetName = useTargetName(metadata);
    const actor = notification.actor;
    const snippet = metadata?.snippet;

    const inviteInfo = (notification.metadata ?? null) as InviteMetadata | null;
    const isChannelInvite = notification.type === "CHANNEL_INVITE";
    const canRespond =
        isChannelInvite && !!(inviteInfo?.inviteId && inviteInfo?.workspaceId);

    const label =
        notification.type === "MENTION"
            ? metadata?.kind === "channel" && targetName
                ? `${actor?.username ?? "Someone"} mentioned you in #${targetName}`
                : metadata?.kind === "conversation" && targetName
                  ? `${actor?.username ?? "Someone"} mentioned you in ${targetName}`
                  : `${actor?.username ?? "Someone"} mentioned you`
            : notification.type === "REACTION"
              ? `${actor?.username ?? "Someone"} reacted to your message`
              : notification.type === "REPLY"
                ? `${actor?.username ?? "Someone"} replied to your message`
                : notification.type === "DIRECT_MESSAGE"
                  ? `${actor?.username ?? "Someone"} sent you a message`
                  : notification.type === "CHANNEL_INVITE"
                    ? targetName
                        ? `${actor?.username ?? "Someone"} invited you to #${targetName}`
                        : `${actor?.username ?? "Someone"} invited you to a channel`
                    : notification.type === "WORKSPACE_INVITE"
                      ? "You received a workspace invitation"
                      : "New notification";

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onOpen(notification)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(notification);
                }
            }}
            className={cn(
                "flex w-full cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-card p-3 text-left transition-colors hover:bg-accent/60",
                highlight && !notification.read && "ring-1 ring-brand/30",
            )}
        >
            {actor?.avatar ? (
                <img
                    src={actor.avatar}
                    alt={actor.username}
                    className="size-10 shrink-0 rounded-lg object-cover"
                />
            ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-sm font-bold text-brand">
                    {(actor?.name || actor?.username || "?").charAt(0).toUpperCase()}
                </div>
            )}

            <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                    <p
                        className={cn(
                            "truncate text-sm",
                            notification.read ? "text-foreground" : "font-semibold text-foreground",
                        )}
                    >
                        {label}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                        {timeAgo(notification.createdAt)}
                    </span>
                </div>

                {snippet && (
                    <p className="mt-0.5 line-clamp-2 text-[13px] text-muted-foreground">{snippet}</p>
                )}

                {canRespond && (
                    <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => action(notification, "accept")}
                            className="inline-flex h-7 items-center gap-1 rounded-lg bg-brand px-2.5 text-[12px] font-semibold text-brand-foreground transition-colors hover:bg-brand/90 disabled:pointer-events-none disabled:opacity-50"
                        >
                            {busy ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Check className="size-3.5" />
                            )}
                            Accept
                        </button>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => action(notification, "reject")}
                            className="inline-flex h-7 items-center gap-1 rounded-lg border border-border px-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                        >
                            <X className="size-3.5" />
                            Decline
                        </button>
                    </div>
                )}

                {!notification.read && (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                        <span className="size-1.5 rounded-full bg-brand" />
                        New
                    </span>
                )}
            </div>
        </div>
    );
}

export function Notifications() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const setSelectedChannelId = useUIStore((s) => s.setSelectedChannelId);
    const setSelectedConversation = useUIStore((s) => s.setSelectedConversation);
    const setActiveSection = useUIStore((s) => s.setActiveSection);

    const [tab, setTab] = useState<TabId>("unread");
    const [actingOn, setActingOn] = useState<string | null>(null);

    const filter: NotificationFilter = tabs.find((t) => t.id === tab)?.filter ?? "unread";

    const {
        data,
        isPending,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["notifications", tab],
        queryFn: ({ pageParam }) =>
            notificationsService.list({ filter, cursor: pageParam, limit: 20 }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    });

    const items = useMemo(
        () =>
            (data?.pages.flatMap((page) => page.items) ?? []).filter(
                (n): n is AppNotification => !!n && typeof n.id === "string",
            ),
        [data],
    );

    const markRead = useMutation({
        mutationFn: (id: string) => notificationsService.markRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
        },
    });

    const markAllRead = useMutation({
        mutationFn: () => notificationsService.markAllRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
        },
    });

    const respondToInvite = useMutation({
        mutationFn: ({
            action,
            workspaceId,
            inviteId,
        }: {
            action: "accept" | "reject";
            workspaceId: string;
            inviteId: string;
            notificationId: string;
        }) =>
            action === "accept"
                ? invitationService.acceptChannelInvite(workspaceId, inviteId)
                : invitationService.rejectChannelInvite(workspaceId, inviteId),
        onMutate: (_vars) => {
            setActingOn((current) => current ?? _vars.notificationId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
            queryClient.invalidateQueries({ queryKey: ["workspace"] });
            queryClient.invalidateQueries({ queryKey: ["dms"] });
        },
        onSettled: () => setActingOn(null),
    });

    function respondToInviteAction(notification: AppNotification, action: "accept" | "reject") {
        const info = (notification.metadata ?? null) as InviteMetadata | null;
        if (!info?.inviteId || !info?.workspaceId) return;

        if (!notification.read) {
            markRead.mutate(notification.id);
        }

        respondToInvite.mutate({
            action,
            workspaceId: info.workspaceId,
            inviteId: info.inviteId,
            notificationId: notification.id,
        });
    }

    function openNotification(notification: AppNotification) {
        if (!notification.read) {
            markRead.mutate(notification.id);
        }

        const metadata = (notification.metadata ?? null) as MentionMetadata | null;
        if (metadata?.kind === "channel" && metadata.channelId) {
            setSelectedChannelId(metadata.channelId);
            navigate("/app");
            return;
        }
        if (metadata?.kind === "conversation" && metadata.conversationId) {
            setActiveSection("dms");
            setSelectedConversation(metadata.conversationId, "DM");
            navigate("/app");
        }
    }

    const isEmpty = !isPending && !isError && items.length === 0;

    return (
        <div className="h-full overflow-y-auto p-6">
            <PageHeader
                title="Notifications"
                description="Everything you've been tagged in and all the noise you've turned on."
            />

            <div className="mb-5 flex flex-wrap gap-1 rounded-xl border border-border/60 bg-card p-1">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        className={cn(
                            "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                            tab === id
                                ? "bg-brand/10 text-brand"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        <Icon className="size-4" />
                        {label}
                    </button>
                ))}
            </div>

            {items.length > 0 && tab !== "invites" && (
                <div className="mb-4 flex justify-end">
                    <button
                        type="button"
                        onClick={() => markAllRead.mutate()}
                        disabled={markAllRead.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                    >
                        {markAllRead.isPending ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <CheckCheck className="size-3.5" />
                        )}
                        Mark all as read
                    </button>
                </div>
            )}

            {isPending && (
                <div className="flex h-40 items-center justify-center text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" />
                </div>
            )}

            {isError && (
                <div className="flex h-40 items-center justify-center text-sm text-destructive">
                    Failed to Load Notifications
                </div>
            )}

            {isEmpty && (
                <PageEmptyState
                    icon={
                        tab === "mentions" ? (
                            <AtSign className="size-5" />
                        ) : tab === "invites" ? (
                            <Link2 className="size-5" />
                        ) : tab === "activity" ? (
                            <Bell className="size-5" />
                        ) : (
                            <Inbox className="size-5" />
                        )
                    }
                    title={
                        tab === "unread"
                            ? "You're all caught up"
                            : tab === "mentions"
                              ? "No mentions yet"
                              : tab === "invites"
                                ? "No invites"
                                : "No activity yet"
                    }
                    description={
                        tab === "unread"
                            ? "When you're mentioned or an invite arrives, it'll show up here."
                            : tab === "mentions"
                              ? "When someone @mentions you in a channel or conversation, it'll show up here."
                              : tab === "invites"
                                ? "Workspace and channel invitations will appear here."
                                : "Reactions, replies and other activity will appear here."
                    }
                />
            )}

            {items.length > 0 && (
                <div className="space-y-2">
                    {items.map((notification) => (
                        <NotificationRow
                            key={notification.id}
                            notification={notification}
                            onOpen={openNotification}
                            highlight={tab === "unread"}
                            action={respondToInviteAction}
                            busy={actingOn === notification.id}
                        />
                    ))}

                    {hasNextPage && (
                        <div className="flex justify-center pt-2">
                            <button
                                type="button"
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                            >
                                {isFetchingNextPage && (
                                    <Loader2 className="size-3.5 animate-spin" />
                                )}
                                Load more
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}