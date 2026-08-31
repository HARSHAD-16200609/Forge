import { cn } from "@/lib/utils";
import {
    Bell,
    Hash,
    Info,
    Mic,
    Paperclip,
    Plus,
    Search,
    Send,
    Smile,
    Star,
    Users,
} from "lucide-react";
import { useState } from "react";

const messages = [
    {
        id: 1,
        name: "Jane Cooper",
        initials: "JC",
        color: "bg-violet-500",
        time: "9:12 AM",
        text: "Good morning WorkSphere! 🎉 Welcome to the general channel — this is where we share announcements, ask questions, and hang out.",
    },
    {
        id: 2,
        name: "Mike Johnson",
        initials: "MJ",
        color: "bg-emerald-500",
        time: "9:15 AM",
        text: "Hey everyone! Just pushed the latest build to staging. Would love some eyes on the new onboarding flow.",
    },
    {
        id: 3,
        name: "Sarah Chen",
        initials: "SC",
        color: "bg-sky-500",
        time: "9:18 AM",
        text: "On it! The onboarding flow looks great so far. Let me drop a few notes in design-review.",
    },
    {
        id: 4,
        name: "Tom Lee",
        initials: "TL",
        color: "bg-amber-500",
        time: "9:22 AM",
        text: "Thanks all. Standup at 10:00 — recording it for anyone who can't make it.",
    },
];

export function ChannelHome() {
    const [isFavourite, setFavourite] = useState(false)
    return (
        <div className="flex h-full flex-col bg-background">
            {/* Header */}
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
                <div className="flex min-w-0 items-center gap-2">
                    <div className="min-w-0">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                className="shrink-0 rounded-sm p-0.5 text-muted-foreground hover:bg-sidebar-accent hover:text-amber-500 "
                                onClick={() => setFavourite((prev) => !prev)}
                            >
                                <Star className={cn(
                                    "size-5 transition-colors",
                                    isFavourite ? "text-amber-500" : "text-muted-foreground"
                                )} fill={isFavourite ? "currentColor" : "none"}
                                    strokeWidth={isFavourite ? 0 : 2} />
                            </button>

                            <div className="flex min-w-0 items-center gap-1">
                                <Hash className="size-5 shrink-0 text-muted-foreground " />

                                <span className="truncate text-[15px] font-bold leading-tight ">
                                    general
                                </span>
                            </div>
                        </div>

                       
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    <button
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Members"
                    >
                        <Users className="size-[18px]" />
                    </button>
                    <button
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Search"
                    >
                        <Search className="size-[18px]" />
                    </button>
                    <button
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Bell"
                    >
                        <Bell className="size-[18px]" />
                    </button>
                    <button
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Details"
                    >
                        <Info className="size-[18px]" />
                    </button>
                </div>
            </header>

            {/* Messages area */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
                {/* Channel intro banner */}
                <div className="mb-6">


                 
                </div>

                {/* Date divider */}
                <div className="mb-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Today
                    </span>
                    <div className="h-px flex-1 bg-border" />
                </div>

                {/* Messages */}
                <div className="space-y-6">
                    {messages.map((m) => (
                        <div key={m.id} className="group flex gap-3">
                            <div
                                className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white ${m.color}`}
                            >
                                {m.initials}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-sm font-bold">{m.name}</span>
                                    <span className="text-xs text-muted-foreground">{m.time}</span>
                                </div>
                                <p className="mt-0.5 text-[15px] leading-6">{m.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Composer */}
            <div className="shrink-0 px-4 pb-4">
                <div className="rounded-lg border border-border bg-background shadow-sm">
                    <div className="flex items-center gap-1 px-2 pt-2">
                        <button
                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
                            aria-label="Plus"
                            type="button"
                        >
                            <Plus className="size-4" />
                        </button>
                        <div className="min-w-0 flex-1">
                            <textarea
                                placeholder="Message #general"
                                rows={4}
                                className="w-full resize-none bg-transparent px-1 py-1 text-[15px] leading-5 outline-none placeholder:text-muted-foreground/70"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 border-t border-border/60 px-2 py-1.5">
                        <button
                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
                            aria-label="Attach"
                            type="button"
                        >
                            <Paperclip className="size-4" />
                        </button>
                        <button
                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
                            aria-label="Emoji"
                            type="button"
                        >
                            <Smile className="size-4" />
                        </button>
                        <button
                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
                            aria-label="Voice"
                            type="button"
                        >
                            <Mic className="size-4" />
                        </button>
                        <button
                            className="ml-auto flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
                            aria-label="Send"
                            type="button"
                        >
                            <Send className="size-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
