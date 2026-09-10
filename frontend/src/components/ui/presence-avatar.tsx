import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePresenceStore } from "@/realtime/presenceStore";

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

    const initials = (name ?? "")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");

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
            {avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt={name ?? "avatar"}
                    className="size-full rounded-full object-cover"
                />
            ) : (
                <span className="flex size-full items-center justify-center rounded-full bg-brand-soft font-semibold text-brand">
                    {initials || "?"}
                </span>
            )}

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