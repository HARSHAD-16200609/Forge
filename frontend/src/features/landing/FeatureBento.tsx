import type { ReactNode } from "react";
import { FileText, Hash, MessageSquare, Plus, Radio, Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal, RevealItem, RevealStagger } from "./Reveal";

const presenceColors = ["bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-sky-500", "bg-fuchsia-500"];
const presenceNames = ["Mira", "Devon", "Priya", "Andre", "Sofia", "Kai"];

function FeatureCard({
    icon: Icon,
    title,
    description,
    visual,
    className,
}: {
    icon: typeof Hash;
    title: string;
    description: string;
    visual?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "flex h-full flex-col gap-4 rounded-2xl border bg-card p-6",
                className,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                    <Icon className="size-4" aria-hidden="true" />
                </span>
            </div>
            <div>
                <h3 className="text-base font-semibold tracking-tight">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {description}
                </p>
            </div>
            {visual ? (
                <div className="mt-auto">{visual}</div>
            ) : (
                <div className="mt-auto" aria-hidden="true" />
            )}
        </div>
    );
}

function ChannelsVisual() {
    const rows = [
        { name: "Mira", color: "bg-violet-500", text: "npm run build is green again ✅", time: "9:41" },
        { name: "Devon", color: "bg-emerald-500", text: "Channels make it easy to follow launch", time: "9:44" },
        { name: "Priya", color: "bg-amber-500", text: "Agreed. Topic-first beats inbox threads", time: "9:47" },
    ];
    return (
        <div className="rounded-xl border bg-muted/40 p-3 space-y-2.5">
            {rows.map((row) => (
                <div key={row.text} className="flex items-start gap-2">
                    <span
                        className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white",
                            row.color,
                        )}
                    >
                        {row.name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-[11px] font-bold">{row.name}</span>
                            <span className="text-[9px] text-muted-foreground">{row.time}</span>
                        </div>
                        <p className="truncate text-[10px] text-muted-foreground">{row.text}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ThreadsVisual() {
    return (
        <div className="rounded-xl border bg-muted/40 p-3">
            <div className="flex items-start gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-sky-500 text-[9px] font-bold text-white">
                    A
                </span>
                <div className="min-w-0">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-[11px] font-bold">Andre</span>
                        <span className="text-[9px] text-muted-foreground">9:50</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                        Timeline for the beta is set for Friday.
                    </p>
                    <div className="mt-1.5 flex items-center gap-0.5 text-[9px] font-medium text-brand">
                        <span>2 replies</span>
                    </div>
                </div>
            </div>
            <div className="ml-3.5 mt-1.5 space-y-1 border-l-2 pl-3">
                {["bg-violet-500", "bg-amber-500"].map((color, i) => (
                    <div key={color} className="flex items-center gap-1.5">
                        <span className={cn("flex size-4 shrink-0 items-center justify-center rounded text-[8px] font-bold text-white", color)}>
                            {i === 0 ? "M" : "P"}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                            {i === 0 ? "Shipping notes in the doc 👍" : "Fortessa review first."}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RichMessagesVisual() {
    return (
        <div className="rounded-xl border bg-muted/40 p-3 text-[10px]">
            <p className="text-xs font-semibold">Ship notes</p>
            <p className="mt-1 text-muted-foreground">
                Composer supports headings, quotes, and lists — no markdown guessing.
            </p>
            <div className="mt-2 flex items-center gap-1.5">
                <span className="rounded bg-background px-2 py-1 font-mono text-[9px] ring-1 ring-border">
                    npm run build
                </span>
                <span className="text-muted-foreground">→ green</span>
            </div>
        </div>
    );
}

function ReactionsVisual() {
    return (
        <div className="rounded-xl border bg-muted/40 p-3">
            <p className="truncate text-[10px] text-muted-foreground">
                Reactions keep acknowledgment fast.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {["🎉", "👍", "❤️"].map((emoji, i) => (
                    <span
                        key={emoji}
                        className={cn(
                            "flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] ring-1",
                            i === 1 ? "bg-primary/10 ring-primary/30" : "bg-background ring-border",
                        )}
                    >
                        <span>{emoji}</span>
                        <span className="font-medium text-muted-foreground">{i + 1}</span>
                    </span>
                ))}
                <span className="flex size-5 items-center justify-center rounded-full ring-1 ring-border text-muted-foreground">
                    <Plus className="size-2.5" />
                </span>
            </div>
        </div>
    );
}

function PresenceVisual() {
    return (
        <div className="rounded-xl border bg-muted/40 p-3">
            <div className="flex flex-wrap items-center gap-2.5">
                {presenceColors.map((color, i) => (
                    <span key={color} className="relative" title={presenceNames[i]}>
                        <span
                            className={cn(
                                "flex size-7 items-center justify-center rounded-lg text-[10px] font-bold text-white",
                                color,
                            )}
                        >
                            {presenceNames[i].charAt(0)}
                        </span>
                        <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card bg-emerald-500" />
                    </span>
                ))}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">6 online right now</p>
        </div>
    );
}

function WorkspacesVisual() {
    return (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-brand/20 bg-background/70 p-4">
            <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-brand-foreground">
                    F
                </span>
                <div>
                    <p className="text-sm font-semibold">Forge Team</p>
                    <p className="text-xs text-muted-foreground">12 channels · 21 members</p>
                </div>
                <span className="ml-1 hidden items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 sm:inline-flex">
                    6 online
                </span>
            </div>
            <button
                type="button"
                className="hidden items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground sm:inline-flex"
            >
                <Plus className="size-3.5" />
                New workspace
            </button>
        </div>
    );
}

export function FeatureBento() {
    return (
        <section id="features" className="mx-auto max-w-7xl px-6 pb-28 pt-24">
            <Reveal className="max-w-2xl">
                <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl lg:leading-[1.05]">
                    Everything a fast team needs, in one app.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                    Forge keeps conversations organized and moving, so the work never has to wait
                    for a status update.
                </p>
            </Reveal>

            <RevealStagger className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6" stagger={0.07}>
                <RevealItem className="lg:col-span-3">
                    <FeatureCard
                        icon={Hash}
                        title="Channels"
                        description="Organize conversations by topic so decisions live where the work is."
                        visual={<ChannelsVisual />}
                        className="h-full"
                    />
                </RevealItem>
                <RevealItem className="lg:col-span-3">
                    <FeatureCard
                        icon={MessageSquare}
                        title="Threads"
                        description="Attach side conversations to the message they're about — no more parallel inboxes."
                        visual={<ThreadsVisual />}
                        className="h-full"
                    />
                </RevealItem>
                <RevealItem className="lg:col-span-2">
                    <FeatureCard
                        icon={FileText}
                        title="Rich messages"
                        description="Format replies with headings, quotes, lists, and inline code."
                        visual={<RichMessagesVisual />}
                        className="h-full"
                    />
                </RevealItem>
                <RevealItem className="lg:col-span-2">
                    <FeatureCard
                        icon={Smile}
                        title="Reactions"
                        description="A quick 👍 keeps acknowledgments fast and threads short."
                        visual={<ReactionsVisual />}
                        className="h-full"
                    />
                </RevealItem>
                <RevealItem className="lg:col-span-2">
                    <FeatureCard
                        icon={Radio}
                        title="Live presence"
                        description="See who's online across every workspace, in real time."
                        visual={<PresenceVisual />}
                        className="h-full"
                    />
                </RevealItem>
                <RevealItem className="md:col-span-2 lg:col-span-6">
                    <FeatureCard
                        icon={Hash}
                        title="Workspaces"
                        description="Keep work and projects separated — one account, many rooms."
                        visual={<WorkspacesVisual />}
                        className="h-full border-brand/20 bg-brand-soft/50"
                    />
                </RevealItem>
            </RevealStagger>
        </section>
    );
}