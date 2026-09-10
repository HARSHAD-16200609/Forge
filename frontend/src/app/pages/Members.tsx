import { useMemo, useState } from "react";
import { Crown, Search, UserPlus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { PageEmptyState } from "@/components/ui/page-empty-state";
import { PresenceAvatar } from "@/components/ui/presence-avatar";
import { Swirling } from "@/components/ui/Swirling";
import { useWorkspace, useWorkspaces } from "@/features/Workspaces/hooks/useWorkspaces";
import { useWorkspaceStore } from "@/features/Workspaces/store/workspaceStore";
import { cn } from "@/lib/utils";

export function Members() {
    const Workspaces = useWorkspaces();
    const { selectedWorkspaceId } = useWorkspaceStore();
    const [query, setQuery] = useState("");

    const activeWorkspaceId =
        selectedWorkspaceId ?? Workspaces?.data?.[0]?.workspace?.id ?? null;

    const { data: details, isPending, isError } = useWorkspace(activeWorkspaceId ?? "");

    const members = details?.members ?? [];

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return members;
        return members.filter((m) => m.user.username.toLowerCase().includes(q));
    }, [members, query]);

    const onlineCount = useMemo(
        () => members.filter((m) => m.user.username).length,
        [members],
    );

    if (isPending) {
        return (
            <div className="flex h-full items-center justify-center">
                <Swirling className="size-10 text-brand" />
            </div>
        );
    }

    if (isError || !activeWorkspaceId) {
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
                description={`Everyone in ${details?.workspaceName ?? "your workspace"} · ${members.length} ${members.length === 1 ? "member" : "members"}`}
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
                            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 transition-colors hover:border-border"
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
                                    {user.avatar ? "Member" : "Member"}
                                </p>
                            </div>
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
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}