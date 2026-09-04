import { MessageSkeleton } from "@/features/Messages/components/MessageSkeleton";
import { cn } from "@/lib/utils";
import { Users, X } from "lucide-react";
import type { ConversationDetail } from "@/features/Messages/types";

function MemberAvatar({ username, avatar }: { username: string; avatar?: string | null }) {
    const initial = username.charAt(0).toUpperCase();
    return (
        <span className="relative flex size-8 shrink-0 items-center justify-center overflow-visible rounded-full">
            {avatar ? (
                <img src={avatar} alt={username} className="size-8 rounded-full object-cover" />
            ) : (
                <span className="flex size-8 items-center justify-center rounded-full bg-violet-500/20 text-xs font-semibold text-violet-600">
                    {initial || <Users className="size-3.5" />}
                </span>
            )}
        </span>
    );
}

export function ConvoMembers({
    detail,
    title,
    type,
    onClose,
}: {
    detail?: ConversationDetail;
    title: string;
    type: "DM" | "GDM";
    onClose: () => void;
}) {
    const members = detail?.members ?? [];

    return (
        <div className="flex h-full w-72 shrink-0 flex-col border-l border-border bg-background">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
                <div className="flex items-center gap-2">
                    <Users className="size-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">
                        {type === "GDM" ? "Members" : "Details"}
                    </span>
                </div>
                <button
                    type="button"
                    aria-label="Close details"
                    onClick={onClose}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                    <X className="size-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-3">
                <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {type === "GDM" ? title : title} · {members.length}
                </div>

                {!detail && (
                    <div className="px-2">
                        <MessageSkeleton rows={4} />
                    </div>
                )}

                {members.map(({ user }, i) => (
                    <div
                        key={user.id}
                        className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-sidebar-accent"
                    >
                        <MemberAvatar username={user.username} avatar={user.avatar} />
                        <span className="min-w-0 flex-1 truncate text-sm text-sidebar-foreground/90">
                            {user.username}
                        </span>
                        {i === 0 && (
                            <span
                                className={cn(
                                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                                    type === "GDM"
                                        ? "bg-emerald-500/15 text-emerald-600"
                                        : "bg-violet-500/15 text-violet-600",
                                )}
                            >
                                {type === "GDM" ? "Group" : "You"}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
