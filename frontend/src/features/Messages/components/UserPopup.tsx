import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AtSign, Clock, MessageSquare } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useWorkspace } from "@/features/Workspaces/hooks/useWorkspaces";
import { usePresenceStore } from "@/realtime/presenceStore";
import { useUIStore } from "@/stores/uiStore";
import { useDms } from "@/features/Messages/hooks/useDms";
import { cn } from "@/lib/utils";

interface UserPopupProps {
    userId: string;
    workspaceId?: string;
    children: ReactNode;
}

export function UserPopup({ userId, workspaceId, children }: UserPopupProps) {
    const navigate = useNavigate();
    const { data: workspace } = useWorkspace(workspaceId ?? "");
    const { data: dms } = useDms(workspaceId ?? "");
    const setActiveSection = useUIStore((s) => s.setActiveSection);
    const setSelectedConversation = useUIStore((s) => s.setSelectedConversation);
    const clearSelectedConversation = useUIStore((s) => s.clearSelectedConversation);
    const online = usePresenceStore((s) =>
        workspaceId ? s.isOnline(workspaceId, userId) : false,
    );

    const member = workspace?.members?.find((m) => m.user.id === userId);
    if (!member) {
        return <>{children}</>;
    }

    const user = member.user;
    const displayName = user.username;
    const roleLabel = member.role === "OWNER" ? "Owner" : "Member";

    function openConversation() {
        const existing = dms?.conversations.find((conversation) => conversation.receiverId === userId);
        setActiveSection("dms");
        if (existing) {
            setSelectedConversation(existing.id, "DM");
        } else {
            clearSelectedConversation();
        }
        navigate("/app");
    }

    return (
        <Popover>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start" side="top">
                <div className="rounded-t-lg bg-gradient-to-b from-brand/15 to-transparent p-4">
                    <div className="flex items-start gap-3">
                        {user.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.username}
                                className="size-14 shrink-0 rounded-xl object-cover"
                            />
                        ) : (
                            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand text-lg font-bold text-brand-foreground">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-bold">{displayName}</p>
                            <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                                <AtSign className="size-3" />
                                {user.username}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                                    {roleLabel}
                                </span>
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                                        online
                                            ? "bg-emerald-500/10 text-emerald-600"
                                            : "bg-muted text-muted-foreground",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "size-1.5 rounded-full",
                                            online ? "bg-emerald-500" : "bg-muted-foreground/50",
                                        )}
                                    />
                                    {online ? "Active now" : "Offline"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 px-4 py-3 text-sm">
                    {user.timezone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="size-3.5" />
                            <span className="capitalize">{user.timezone}</span>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={openConversation}
                    className="flex w-full items-center justify-center gap-2 border-t border-border px-4 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-brand/10 focus-visible:outline-none"
                >
                    <MessageSquare className="size-4" />
                    Message
                </button>
            </PopoverContent>
        </Popover>
    );
}