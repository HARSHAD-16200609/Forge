import { useMemo, useState } from "react";
import {
    Crown,
    Hash,
    Link2,
    Loader2,
    MessageSquare,
    MoreHorizontal,
    Search,
    UserPlus,
    Users,
    X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { PageEmptyState } from "@/components/ui/page-empty-state";
import { PresenceAvatar } from "@/components/ui/presence-avatar";
import { Swirling } from "@/components/ui/Swirling";
import { useWorkspace, useWorkspaces } from "@/features/Workspaces/hooks/useWorkspaces";
import { useWorkspaceStore } from "@/features/Workspaces/store/workspaceStore";
import { messageService } from "@/features/Messages/message.service";
import { invitationService } from "@/features/Invitations/invitation.service";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";
import { getApiError } from "@/lib/errorMessage";
import useAuth from "@/features/auth/hooks/useAuth";

interface InviteTarget {
    id: string;
    username: string;
}

export function Members() {
    const Workspaces = useWorkspaces();
    const { selectedWorkspaceId } = useWorkspaceStore();
    const [query, setQuery] = useState("");
    const [dmError, setDmError] = useState<string | null>(null);
    const [menuFor, setMenuFor] = useState<string | null>(null);
    const [inviteTarget, setInviteTarget] = useState<InviteTarget | null>(null);
    const [inviteNotice, setInviteNotice] = useState<{ kind: "error" | "success"; text: string } | null>(null);

    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const setSelectedConversation = useUIStore((s) => s.setSelectedConversation);
    const setActiveSection = useUIStore((s) => s.setActiveSection);

    const { user: self } = useAuth();
    const selfId = self?.id;

    const activeWorkspaceId =
        selectedWorkspaceId ?? Workspaces?.data?.[0]?.workspace?.id ?? null;

    const details = useWorkspace(activeWorkspaceId ?? "");
    const members = useMemo(() => details.data?.members ?? [], [details.data]);
    const privateChannels = useMemo(
        () => (details.data?.channels ?? []).filter((c) => c.visibility === "PRIVATE"),
        [details.data],
    );

    const openDm = useMutation({
        mutationFn: (receiverId: string) =>
            messageService.createDM({
                workspaceId: activeWorkspaceId ?? "",
                receiverId,
                idempotencyKey: crypto.randomUUID(),
            }),
        onSuccess: (conversation) => {
            setDmError(null);
            queryClient.invalidateQueries({ queryKey: ["dms", activeWorkspaceId] });
            setSelectedConversation(conversation.id, "DM");
            setActiveSection("dms");
            navigate("/app/dms");
        },
        onError: (err) => {
            setDmError(getApiError(err).message);
        },
    });

    const sendInvite = useMutation({
        mutationFn: ({ channelId, receiverId }: { channelId: string; receiverId: string }) =>
            invitationService.createChannelInvite({
                workspaceId: activeWorkspaceId ?? "",
                channelId,
                receiverId,
            }),
        onSuccess: () => {
            setInviteNotice({ kind: "success", text: `Invite sent to ${inviteTarget?.username ?? "member"}.` });
            setInviteTarget(null);
            setMenuFor(null);
        },
        onError: (err) => {
            setInviteNotice({ kind: "error", text: `Couldn't send invite: ${getApiError(err).message}` });
        },
    });

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return members;
        return members.filter((m) => m.user.username.toLowerCase().includes(q));
    }, [members, query]);

    if (details.isPending) {
        return (
            <div className="flex h-full items-center justify-center">
                <Swirling className="size-10 text-brand" />
            </div>
        );
    }

    if (details.isError || !activeWorkspaceId) {
        return (
            <div className="flex h-full items-center justify-center px-6">
                <div className="text-sm text-destructive">Failed to load members.</div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6">
            <PageHeader
                title="Members"
                description={`Everyone in ${details.data?.workspaceName ?? "your workspace"} · ${members.length} ${members.length === 1 ? "member" : "members"}`}
                action={
                    <Link
                        to="/app/invites"
                        className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-3.5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
                    >
                        <UserPlus className="size-4" />
                        Invite
                    </Link>
                }
            />

            <label className="relative mb-5 block w-full max-w-sm">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search members…"
                    className="h-9 w-full rounded-lg border border-border/70 bg-muted/40 pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-brand/40 focus:bg-background focus:ring-2 focus:ring-brand/15"
                />
            </label>

            {dmError && (
                <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">
                    Couldn't start a conversation: {dmError}
                </div>
            )}

            {inviteNotice && (
                <div
                    className={cn(
                        "mb-5 rounded-lg border px-3 py-2 text-[13px]",
                        inviteNotice.kind === "success"
                            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                            : "border-destructive/30 bg-destructive/5 text-destructive",
                    )}
                >
                    {inviteNotice.text}
                </div>
            )}

            {members.length === 0 ? (
                <PageEmptyState
                    icon={<Users className="size-5" />}
                    title="No members yet"
                    description="Invite people to your workspace so teammates show up here."
                    action={
                        <Link
                            to="/app/invites"
                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-3.5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
                        >
                            <UserPlus className="size-4" />
                            Invite people
                        </Link>
                    }
                />
            ) : filtered.length === 0 ? (
                <PageEmptyState
                    icon={<Search className="size-5" />}
                    title={`No results for “${query}”`}
                    description="Try a different name or clear your search."
                />
            ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map(({ role, user }) => (
                        <div
                            key={user.id}
                            className="relative flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 transition-colors hover:border-border"
                        >
                            <PresenceAvatar
                                name={user.username}
                                avatarUrl={user.avatar}
                                size="md"
                                workspaceId={activeWorkspaceId}
                                userId={user.id}
                            />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-foreground">
                                    {user.username}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {user.timezone ?? "Timezone not set"}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                                <span
                                    className={cn(
                                        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                                        role === "OWNER"
                                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                            : "bg-muted text-muted-foreground",
                                    )}
                                >
                                    {role === "OWNER" && <Crown className="size-3" />}
                                    {role === "OWNER" ? "Owner" : "Member"}
                                </span>
                                <div className="relative">
                                    <button
                                        type="button"
                                        aria-label={`Actions for ${user.username}`}
                                        title={`Actions for ${user.username}`}
                                        onClick={() =>
                                            setMenuFor((current) => (current === user.id ? null : user.id))
                                        }
                                        className={cn(
                                            "flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-brand/10 hover:text-brand",
                                            menuFor === user.id && "bg-brand/10 text-brand",
                                        )}
                                    >
                                        <MoreHorizontal className="size-4" />
                                    </button>

                                    {menuFor === user.id && (
                                        <>
                                            <button
                                                type="button"
                                                aria-label="Close member actions"
                                                tabIndex={-1}
                                                onClick={() => setMenuFor(null)}
                                                className="fixed inset-0 z-20 cursor-default"
                                            />
                                            <div className="absolute top-full right-0 z-30 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-xl">
                                                <button
                                                    type="button"
                                                    disabled={openDm.isPending}
                                                    onClick={() => {
                                                        setMenuFor(null);
                                                        openDm.mutate(user.id);
                                                    }}
                                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                                                >
                                                    <MessageSquare className="size-4 text-muted-foreground" />
                                                    Message
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setMenuFor(null);
                                                        setInviteNotice(null);
                                                        setInviteTarget({ id: user.id, username: user.username });
                                                    }}
                                                    disabled={user.id === selfId}
                                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                                                >
                                                    <Link2 className="size-4 text-muted-foreground" />
                                                    Invite to channel
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {inviteTarget && (
                <ChannelInviteModal
                    target={inviteTarget}
                    channels={privateChannels}
                    isPending={sendInvite.isPending}
                    error={sendInvite.isError ? getApiError(sendInvite.error).message : null}
                    onClose={() => {
                        if (!sendInvite.isPending) setInviteTarget(null);
                    }}
                    onSelect={(channelId) => sendInvite.mutate({ channelId, receiverId: inviteTarget.id })}
                />
            )}
        </div>
    );
}

function ChannelInviteModal({
    target,
    channels,
    isPending,
    error,
    onClose,
    onSelect,
}: {
    target: InviteTarget;
    channels: { id: string; channelName: string }[];
    isPending: boolean;
    error: string | null;
    onClose: () => void;
    onSelect: (channelId: string) => void;
}) {
    const [q, setQ] = useState("");

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        if (!needle) return channels;
        return channels.filter((c) => c.channelName.toLowerCase().includes(needle));
    }, [channels, q]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 backdrop-blur-sm sm:items-center"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !isPending) onClose();
            }}
        >
            <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-background shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div className="min-w-0">
                        <h2 className="text-[15px] font-semibold">Invite to a channel</h2>
                        <p className="truncate text-xs text-muted-foreground">
                            Choose a private channel for @{target.username}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    <label className="relative mb-3 block">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            autoFocus
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Find a private channel"
                            className="h-9 w-full rounded-lg border border-border bg-transparent pr-3 pl-9 text-sm outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/15"
                        />
                    </label>

                    {channels.length === 0 ? (
                        <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-6 text-center">
                            <p className="text-sm font-medium text-foreground">No private channels</p>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                There are no private channels to invite {target.username} to. Public
                                channels don't need invitations.
                            </p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <p className="px-2 py-4 text-center text-[13px] text-muted-foreground">
                            No private channels match “{q}”.
                        </p>
                    ) : (
                        <div className="space-y-0.5">
                            {filtered.map((channel) => (
                                <button
                                    key={channel.id}
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => onSelect(channel.id)}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                                >
                                    <Hash className="size-4 shrink-0 text-muted-foreground" />
                                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                        {channel.channelName}
                                    </span>
                                    {isPending && (
                                        <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t border-border p-3">
                    {error && <p className="mb-2 text-[13px] text-destructive">{error}</p>}
                    <p className="text-xs leading-5 text-muted-foreground">
                        {target.username} will get an invitation they can accept from{" "}
                        <span className="font-medium text-foreground">Notifications</span>.
                    </p>
                </div>
            </div>
        </div>
    );
}