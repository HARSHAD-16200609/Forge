import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { UserPlus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MessageSkeleton } from "@/features/Messages/components/MessageSkeleton";
import { PresenceAvatar } from "@/components/ui/presence-avatar";
import { Button } from "@/components/ui/button";
import useAuth from "@/features/auth/hooks/useAuth";
import { usePresenceStore } from "@/realtime/presenceStore";
import { cn } from "@/lib/utils";
import type { ConversationDetail } from "@/features/Messages/types";

const listVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
};

export function ConvoMembers({
    detail,
    title,
    type,
    workspaceId,
}: {
    detail?: ConversationDetail;
    title: string;
    type: "DM" | "GDM";
    workspaceId?: string;
    onClose: () => void;
}) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const reduce = useReducedMotion();
    const isOnline = usePresenceStore((state) => state.isOnline);
    const members = detail?.members ?? [];

    return (
        <div className="flex w-full flex-col p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                        <Users className="size-5" />
                    </span>
                    <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-foreground">
                            {type === "GDM" ? "Group details" : "Details"}
                        </h2>
                        <p className="truncate text-xs text-muted-foreground">{title}</p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
                    <Users className="size-3.5" />
                    <span className="text-xs">
                        {members.length} {members.length === 1 ? "member" : "members"}
                    </span>
                </div>
            </div>

            <div className="my-4 h-px bg-border" />

            <div className="max-h-64 overflow-y-auto pr-1">
                {!detail ? (
                    <MessageSkeleton rows={4} />
                ) : (
                    <motion.ul
                        className="space-y-1"
                        variants={listVariants}
                        initial={reduce ? false : "hidden"}
                        animate="visible"
                    >
                        <AnimatePresence initial={false}>
                            {members.map((member) => {
                                const online = workspaceId
                                    ? isOnline(workspaceId, member.user.id)
                                    : false;
                                const isSelf = user?.id === member.user.id;
                                return (
                                    <motion.li
                                        key={member.user.id}
                                        layout
                                        variants={itemVariants}
                                        className="flex items-center gap-3 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-muted/60"
                                    >
                                        <PresenceAvatar
                                            name={member.user.username}
                                            avatarUrl={member.user.avatar}
                                            size="md"
                                            workspaceId={workspaceId}
                                            userId={member.user.id}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-foreground">
                                                {member.user.username}
                                            </p>
                                            <p
                                                className={cn(
                                                    "truncate text-xs",
                                                    online
                                                        ? "text-emerald-600 dark:text-emerald-400"
                                                        : "text-muted-foreground",
                                                )}
                                            >
                                                {online ? "Online" : "Offline"}
                                            </p>
                                        </div>
                                        <span
                                            className={cn(
                                                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                                isSelf
                                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                                    : "bg-brand-soft text-brand",
                                            )}
                                        >
                                            {isSelf ? "You" : type === "GDM" ? "Group" : "Member"}
                                        </span>
                                    </motion.li>
                                );
                            })}
                        </AnimatePresence>
                    </motion.ul>
                )}
            </div>

            <div className="mt-4 border-t border-border pt-4">
                <Button onClick={() => navigate("/app/invites")}>
                    <UserPlus className="size-4" />
                    Add people
                </Button>
            </div>
        </div>
    );
}