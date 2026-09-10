import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTypingStore } from "@/realtime/typingStore";
import { useWorkspace } from "@/features/Workspaces/hooks/useWorkspaces";
import { APP_EASE } from "@/components/ui/app-motion";

const dotVariants = {
    hidden: { opacity: 0.35, y: 0 },
    visible: (i: number) => ({
        opacity: 1,
        y: [0, -2, 0],
        transition: {
            y: {
                duration: 0.8,
                repeat: Infinity,
                ease: APP_EASE,
                delay: i * 0.12,
            },
            opacity: {
                duration: 0.25,
                ease: APP_EASE,
            },
        },
    }),
};

function TypingDots({ reduce }: { reduce: boolean }) {
    return (
        <span
            aria-hidden="true"
            className="pointer-events-none flex h-[18px] w-8 items-center justify-center gap-0.5 rounded-md border border-border bg-background text-brand shadow-sm"
        >
            {[0, 1, 2].map((i) =>
                reduce ? (
                    <span key={i} className="size-1.5 rounded-full bg-brand/50" />
                ) : (
                    <motion.span
                        key={i}
                        custom={i}
                        variants={dotVariants}
                        initial="hidden"
                        animate="visible"
                        className="size-1.5 rounded-full bg-brand"
                    />
                ),
            )}
        </span>
    );
}

export function TypingIndicator({
    entityId,
    workspaceId,
}: {
    entityId: string;
    workspaceId?: string | null;
}) {
    const typing = useTypingStore((state) => state.typing[entityId]);
    const reduce = useReducedMotion();
    const workspace = useWorkspace(workspaceId ?? "");

    const typerIds = useMemo(() => Object.keys(typing ?? {}), [typing]);
    const names = useMemo(() => Object.values(typing ?? {}), [typing]);

    if (names.length === 0) return null;

    const firstTyper = workspace.data?.members?.find((m) => m.user.id === typerIds[0])?.user;
    const label =
        names.length === 1 ? `${names[0]} is typing` : `${names.length} people are typing`;

    return (
        <div className="flex items-center gap-2 px-4 pb-1.5 text-xs text-muted-foreground">
            {names.length === 1 ? (
                <span className="relative flex shrink-0 items-center">
                    {firstTyper?.avatar ? (
                        <img
                            src={firstTyper.avatar}
                            alt={firstTyper.username}
                            className="size-7 rounded-full object-cover"
                        />
                    ) : (
                        <span className="flex size-7 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
                            {names[0].charAt(0).toUpperCase()}
                        </span>
                    )}
                    <span className="absolute -right-1.5 -bottom-1">
                        <TypingDots reduce={reduce} />
                    </span>
                </span>
            ) : (
                <TypingDots reduce={reduce} />
            )}
            <span>{label}…</span>
        </div>
    );
}