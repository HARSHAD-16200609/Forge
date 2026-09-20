import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search, Send, Users, X } from "lucide-react";
import { messageService } from "../message.service";
import { useWorkspace } from "@/features/Workspaces/hooks/useWorkspaces";
import { PresenceAvatar } from "@/components/ui/presence-avatar";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";
import useAuth from "@/features/auth/hooks/useAuth";

interface NewConversationModalProps {
    open: boolean;
    workspaceId: string;
    onClose: () => void;
}

export function NewConversationModal({ open, workspaceId, onClose }: NewConversationModalProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const setSelectedConversation = useUIStore((s) => s.setSelectedConversation);
    const setActiveSection = useUIStore((s) => s.setActiveSection);

    const workspace = useWorkspace(workspaceId);
    const members = useMemo(() => workspace.data?.members ?? [], [workspace.data]);

    const { user } = useAuth();
    const selfId = user?.id;

    const [query, setQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [groupName, setGroupName] = useState("");
    const [error, setError] = useState<string | null>(null);

    const selectedMembers = useMemo(
        () =>
            members.filter(
                (m) => selectedIds.includes(m.user.id),
            ),
        [members, selectedIds],
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const pool = members.filter(
            (m) => m.user.id !== selfId && !selectedIds.includes(m.user.id),
        );
        if (!q) return pool;
        return pool.filter((m) => m.user.username.toLowerCase().includes(q));
    }, [members, selectedIds, query, selfId]);

    const isGDM = selectedIds.length >= 2;
    const canSubmit = selectedIds.length > 0 && (!isGDM || groupName.trim().length >= 3);

    const createConversation = useMutation({
        mutationFn: async () => {
            if (selectedIds.length === 0) {
                throw new Error("Select at least one person to start a conversation.");
            }

            if (isGDM && groupName.trim().length < 3) {
                throw new Error("Give the group a name (at least 3 characters).");
            }

            const idempotencyKey = crypto.randomUUID();

            if (isGDM) {
                return await messageService.createGDM({
                    workspaceId,
                    name: groupName.trim(),
                    memberIds: selectedIds,
                    idempotencyKey,
                });
            }

            return await messageService.createDM({
                workspaceId,
                receiverId: selectedIds[0]!,
                idempotencyKey,
            });
        },
        onSuccess: (conversation) => {
            queryClient.invalidateQueries({ queryKey: ["dms", workspaceId] });
            setSelectedConversation(conversation.id, conversation.type === "GDM" ? "GDM" : "DM");
            setActiveSection("dms");
            onClose();
            navigate("/app/dms");
        },
        onError: (err) => {
            setError(err instanceof Error ? err.message : "Could not start the conversation.");
        },
    });

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 backdrop-blur-sm sm:items-center"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-background shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h2 className="text-[15px] font-semibold">
                        {isGDM ? "Start a group message" : "Start a conversation"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    {isGDM && (
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand/15 font-bold text-brand">
                                {groupName.trim()
                                    ? groupName
                                          .trim()
                                          .split(/\s+/)
                                          .map((w) => w[0])
                                          .join("")
                                          .slice(0, 2)
                                          .toUpperCase()
                                    : "G"}
                            </div>
                            <div className="min-w-0 flex-1">
                                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                    Group name
                                </label>
                                <input
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="e.g. Design buddies"
                                    className="h-9 w-full rounded-lg border border-border bg-transparent px-3 text-sm outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/15"
                                />
                            </div>
                        </div>
                    )}

                    {selectedMembers.length > 0 && (
                        <div className="mb-3">
                            <p className="mb-2 text-xs font-medium text-muted-foreground">
                                Selected ({selectedMembers.length})
                                {isGDM && " — pick as many as you like"}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {selectedMembers.map((m) => (
                                    <button
                                        key={m.user.id}
                                        type="button"
                                        onClick={() =>
                                            setSelectedIds((ids) =>
                                                ids.filter((id) => id !== m.user.id),
                                            )
                                        }
                                        title={`Remove ${m.user.username}`}
                                        className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 py-1 pr-2 pl-1 text-[12px] font-medium text-brand-foreground transition-colors hover:bg-brand/20"
                                    >
                                        <PresenceAvatar
                                            name={m.user.username}
                                            avatarUrl={m.user.avatar}
                                            size={"sm"}
                                        />
                                        {m.user.username}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Find people"
                            className="h-9 w-full rounded-lg border border-border bg-transparent pr-3 pl-9 text-sm outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/15"
                        />
                    </div>

                    <p className="mt-2 px-1 text-xs leading-5 text-muted-foreground">
                        Pick one person for a direct message, or select several to start a group —
                        keep adding people until the group is right.
                    </p>

                    <div className="mt-3 space-y-0.5">
                        {filtered.map((m) => (
                            <button
                                key={m.user.id}
                                type="button"
                                onClick={() => setSelectedIds((ids) => [...ids, m.user.id])}
                                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted"
                            >
                                <PresenceAvatar
                                    name={m.user.username}
                                    avatarUrl={m.user.avatar}
                                    size="sm"
                                />
                                <span className="min-w-0 flex-1 truncate text-sm">
                                    {m.user.username}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {m.user.username}
                                </span>
                            </button>
                        ))}

                        {filtered.length === 0 && (
                            <p className="flex items-center justify-center gap-2 px-2 py-4 text-center text-[13px] text-muted-foreground">
                                <Users className="size-4" />
                                {selfId
                                    ? "No one else found."
                                    : "Couldn't load members yet."}
                            </p>
                        )}
                    </div>
                </div>

                <div className="border-t border-border p-3">
                    {error && (
                        <p className="mb-2 text-[13px] text-destructive">{error}</p>
                    )}
                    {isGDM && !createConversation.isPending && (
                        <p className="mb-2 text-xs text-muted-foreground">
                            {groupName.trim().length < 3
                                ? "Group name needs at least 3 characters."
                                : `This group will include ${selectedIds.length + 1} people total.`}
                        </p>
                    )}
                    <button
                        type="button"
                        disabled={!canSubmit || createConversation.isPending}
                        onClick={() => createConversation.mutate()}
                        className={cn(
                            "flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-brand-foreground transition-colors",
                            "hover:bg-brand/90 disabled:pointer-events-none disabled:opacity-50",
                        )}
                    >
                        {createConversation.isPending ? (
                            <span className="size-4 animate-spin rounded-full border-2 border-brand-foreground/30 border-t-brand-foreground" />
                        ) : isGDM ? (
                            <>
                                <Send className="size-4" />
                                Create group
                            </>
                        ) : (
                            <>
                                <Send className="size-4" />
                                Start conversation
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}