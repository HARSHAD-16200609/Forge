import { CornerDownRight, Plus, Smile, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

const reply = [
    { name: "Mira", color: "bg-violet-500", text: "Reopened the workspace switcher for the holdout ✌️" },
    { name: "Devon", color: "bg-emerald-500", text: "Merge when checks go green.", reactions: ["❤️"] },
];

export function ProductShowcase() {
    return (
        <section id="product" className="relative overflow-hidden border-y bg-muted/30">
            <div
                aria-hidden="true"
                className="aurora-showcase pointer-events-none absolute left-[-15%] top-1/2 -z-10 size-[36rem] -translate-y-1/2 rounded-full"
            />
            <div className="mx-auto max-w-7xl px-6 py-28">
                <Reveal className="max-w-2xl">
                    <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl lg:leading-[1.05]">
                        A reply becomes a thread. The context stays put.
                    </h2>
                    <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                        Reply to a message and it fans out into a focused thread, complete with
                        reactions, rich formatting, and an editor that never loses your draft.
                    </p>
                </Reveal>

                <Reveal delay={0.1} className="mt-12">
                    <div className="overflow-hidden rounded-2xl border bg-background shadow-xl shadow-zinc-950/5 ring-1 ring-border">
                        <div className="grid lg:grid-cols-[1fr_300px]">
                            <div className="space-y-4 p-6 sm:p-10">
                                <div className="flex items-start gap-3">
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-500 text-sm font-bold text-white">
                                        M
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-sm font-bold">Mira</span>
                                            <span className="text-xs text-muted-foreground">9:41 AM</span>
                                        </div>
                                        <p className="mt-1 text-sm leading-relaxed text-foreground">
                                            The demo flow is ready for review — happy to walk
                                            anyone through it before Friday.
                                        </p>
                                        <div className="mt-3 flex items-center gap-1.5">
                                            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs ring-1 ring-border">
                                                <span>🎉</span>
                                                <span className="font-medium text-muted-foreground">3</span>
                                            </span>
                                            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs ring-1 ring-primary/30">
                                                <span>👍</span>
                                                <span className="font-medium text-muted-foreground">5</span>
                                            </span>
                                            <button
                                                type="button"
                                                className="flex size-6 items-center justify-center rounded-full ring-1 ring-border text-muted-foreground transition-colors duration-150 hover:text-foreground"
                                                aria-label="Add reaction"
                                            >
                                                <Plus className="size-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="pl-8 sm:pl-11">
                                    <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                        <CornerDownRight className="size-3.5" />
                                        <span>3 replies</span>
                                    </div>
                                    <div className="space-y-3 border-l-2 border-border pl-4">
                                        {reply.map((row) => (
                                            <div key={row.name} className="flex items-start gap-2.5">
                                                <span
                                                    className={cn(
                                                        "flex size-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white",
                                                        row.color,
                                                    )}
                                                >
                                                    {row.name.charAt(0)}
                                                </span>
                                                <div className="min-w-0">
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className="text-xs font-bold">{row.name}</span>
                                                        <span className="text-[11px] text-muted-foreground">9:46 AM</span>
                                                    </div>
                                                    <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                                                        {row.text}
                                                    </p>
                                                    {row.reactions && (
                                                        <div className="mt-1.5 flex gap-1">
                                                            {row.reactions.map((emoji) => (
                                                                <span
                                                                    key={emoji}
                                                                    className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs ring-1 ring-border"
                                                                >
                                                                    <span>{emoji}</span>
                                                                    <span className="font-medium text-muted-foreground">2</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="hidden border-l bg-muted/20 p-6 lg:flex lg:flex-col lg:justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Thread · general
                                    </p>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                        Replies stay attached to their message, so context never
                                        drifts into another channel.
                                    </p>
                                </div>
                                <div className="rounded-xl border bg-background p-3">
                                    <div className="flex items-center gap-1.5">
                                        <Plus className="size-3 text-muted-foreground" />
                                        <span className="flex-1 text-xs text-muted-foreground">
                                            Share your thoughts...
                                        </span>
                                        <Smile className="size-3 text-muted-foreground" />
                                        <ThumbsUp className="size-3 text-muted-foreground" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}