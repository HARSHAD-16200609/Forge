import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePresenceStore } from "@/realtime/presenceStore";
import { UserAvatar } from "@/components/ui/user-avatar";

const sizeClasses = {
    sm: "size-6 text-[11px]",
    md: "size-8 text-xs",
    lg: "size-10 text-sm",
} as const;

type PresenceAvatarProps = {
    name?: string;
    avatarUrl?: string | null;
    size?: keyof typeof sizeClasses;
    className?: string;
    workspaceId?: string | null;
    userId?: string;
    dot?: "auto" | "show" | "hidden";
};

export function PresenceAvatar({
    name,
    avatarUrl,
    size = "md",
    className,
    workspaceId,
    userId,
    dot = "auto",
}: PresenceAvatarProps) {
    const reduce = useReducedMotion();

    const online = usePresenceStore((state) =>
        dot === "auto" && workspaceId && userId
            ? state.isOnline(workspaceId, userId)
            : false,
    );
    const showDot = dot === "show" || (dot === "auto" && online);

    const dotClass =
        size === "sm"
            ? "size-2 ring-1"
            : size === "lg"
              ? "size-3 ring-2"
              : "size-2.5 ring-2";

    return (
        <span
            className={cn(
                "relative flex shrink-0 items-center justify-center",
                sizeClasses[size],
                className,
            )}
        >
            <UserAvatar
                id={userId ?? null}
                name={name}
                username={name}
                avatarUrl={avatarUrl}
                avatarSeed={null}
                size={size}
                shape="circle"
            />

            {showDot && (
                <motion.span
                    aria-hidden="true"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={reduce ? { scale: 1, opacity: 1 } : { scale: [0, 1.15, 1], opacity: 1 }}
                    transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                    className={cn(
                        "absolute -right-0.5 -bottom-0.5 rounded-full bg-emerald-500 ring-background",
                        dotClass,
                    )}
                />
            )}
        </span>
    );
}