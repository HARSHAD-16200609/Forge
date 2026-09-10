import { motion, useReducedMotion } from "framer-motion";
import { Bell, Hash, Plus, Search, Send, Smile, ThumbsUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const channels = ["general", "design", "engineering", "launch", "random"];

const messages = [
    {
        author: "Mira",
        color: "bg-violet-500",
        time: "9:41",
        text: "Shipped the new composer — rich blocks are live in #engineering.",
        reactions: [
            { emoji: "🎉", count: 3 },
            { emoji: "❤️", count: 1 },
        ],
    },
    {
        author: "Devon",
        color: "bg-emerald-500",
        time: "9:43",
        text: "Nice. Presence updates over WebSocket feel instant now.",
    },
    {
        author: "Priya",
        color: "bg-amber-500",
        time: "9:46",
        text: "Threads keep the side-conversation attached to the message. Exactly what we wanted.",
        reactions: [{ emoji: "👍", count: 5 }],
    },
];

function PresenceDot({ className }: { className?: string }) {
    const reduce = useReducedMotion();
    return (
        <span
            className={cn("relative flex size-2 shrink-0", className)}
            aria-hidden="true"
        >
            <motion.span
                className="absolute inline-flex size-full rounded-full bg-emerald-500"
                initial={{ opacity: 0.55 }}
                animate={reduce ? { opacity: 0.55 } : { opacity: [0.55, 1, 0.55] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
    );
}

function TypingDots() {
    const reduce = useReducedMotion();
    if (reduce) {
        return (
            <span className="flex items-center gap-1 px-1 text-xs text-muted-foreground">
                Mira is typing
            </span>
        );
    }
    return (
        <span className="flex items-center gap-1 px-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
                <motion.span
                    key={i}
                    className="size-1 rounded-full bg-muted-foreground/70"
                    animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </span>
    );
}

function MessageRow({
    author,
    color,
    time,
    text,
    reactions,
}: (typeof messages)[number]) {
    return (
        <div className="group flex gap-2.5">
            <div
                className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white",
                    color,
                )}
            >
                {author.charAt(0)}
            </div>
            <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-bold">{author}</span>
                    <span className="text-[10px] text-muted-foreground">{time}</span>
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    {text}
                </p>
                {reactions && reactions.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                        {reactions.map((reaction) => (
                            <span
                                key={reaction.emoji}
                                className="flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] ring-1 ring-border"
                            >
                                <span>{reaction.emoji}</span>
                                <span className="font-medium text-muted-foreground">
                                    {reaction.count}
                                </span>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export function ProductPreview({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "overflow-hidden rounded-2xl border bg-background shadow-2xl shadow-zinc-950/10 ring-1 ring-border dark:shadow-zinc-950/50",
                className,
            )}
        >
            <div className="flex items-center gap-3 border-b px-4 py-2.5">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                    <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="size-2.5 rounded-full bg-[#febc2e]" />
                    <span className="size-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="mx-auto flex items-center gap-1.5 rounded-md bg-muted px-3 py-1 text-[10px] text-muted-foreground">
                    <svg
                        viewBox="0 0 24 24"
                        className="size-2.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                    >
                        <rect x="3" y="11" width="18" height="10" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    forge.app/app/dev
                </div>
                <span className="w-8" aria-hidden="true" />
            </div>

            <div className="flex h-[22rem] sm:h-[24rem]">
                <div className="flex w-36 shrink-0 flex-col border-r bg-sidebar">
                    <div className="flex items-center justify-between border-b px-3 py-2.5">
                        <div className="flex size-6 items-center justify-center rounded-md bg-brand text-[10px] font-bold text-brand-foreground">
                            F
                        </div>
                        <ChevronGlyph />
                    </div>
                    <div className="space-y-0.5 px-2 py-2.5">
                        <p className="px-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Workspace
                        </p>
                        <div className="flex items-center justify-between rounded-md bg-muted px-1.5 py-1 text-[10px] font-medium">
                            <span className="truncate">Forge Team</span>
                            <Plus className="size-2.5 text-muted-foreground" />
                        </div>
                        <p className="pt-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Channels
                        </p>
                        {channels.map((channel) => (
                            <button
                                key={channel}
                                type="button"
                                className={cn(
                                    "flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-[10px]",
                                    channel === "general"
                                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                                        : "text-muted-foreground",
                                )}
                            >
                                <Hash className="size-2.5 shrink-0" />
                                <span className="truncate">{channel}</span>
                            </button>
                        ))}
                        <div className="flex items-center gap-1.5 px-1.5 py-1 text-[10px] text-muted-foreground">
                            <Users className="size-2.5 shrink-0" />
                            <span>direct messages</span>
                        </div>
                    </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                            <Hash className="size-3 text-muted-foreground" />
                            <span className="truncate text-xs font-bold">general</span>
                            <PresenceDot className="ml-1" />
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                            <Search className="size-2.5" />
                            <Bell className="size-2.5" />
                            <Users className="size-2.5" />
                        </div>
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden px-3 py-2.5">
                        {messages.map((message) => (
                            <MessageRow key={message.text} {...message} />
                        ))}
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <TypingDots />
                        </div>
                    </div>

                    <div className="border-t p-2.5">
                        <div className="flex items-center gap-1.5 rounded-lg border bg-background px-2 py-1.5">
                            <Plus className="size-3 text-muted-foreground" />
                            <span className="flex-1 text-[11px] text-muted-foreground">
                                Share an update...
                            </span>
                            <Smile className="size-3 text-muted-foreground" />
                            <ThumbsUp className="size-3 text-muted-foreground" />
                            <Send className="size-3 text-muted-foreground" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ChevronGlyph() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="size-3 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
}