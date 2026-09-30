import { Archive, Search, Tag, Time } from "@carbon/icons-react";
import { cn } from "@/lib/utils";
import { revealIndex, useRevealGroup } from "./useReveal";

/**
 * Carbon rather than Lucide. The old bento imported twelve Lucide glyphs, whose
 * hairline strokes disappear at the 18px these render at. Carbon is already a
 * dependency here, its grid is consistent across the set, and its bold weights
 * hold up small. Nothing new was installed to make that happen.
 */
type CarbonIcon = React.ComponentType<{ size?: number; className?: string }>;

type Feature = {
    title: string;
    body: string;
    icon: CarbonIcon;
    /** Pastel tints only, and only to say "this one is a category". */
    tint: string;
    ink: string;
};

const features: Feature[] = [
    {
        title: "Channels that hold their shape",
        body: "Every channel carries a topic and a member list, so it is obvious what belongs in it and who is watching. When a project ends, archive the channel instead of scrolling past it for the next four years.",
        icon: Archive,
        tint: "bg-[var(--pastel-blue)]",
        ink: "text-[var(--pastel-blue-ink)]",
    },
    {
        title: "Threads that stay attached",
        body: "Replies open beside the message that started them rather than replacing the channel behind them. Close the panel and the conversation is exactly where you left it, with the context that made it readable still attached.",
        icon: Tag,
        tint: "bg-[var(--pastel-yellow)]",
        ink: "text-[var(--pastel-yellow-ink)]",
    },
    {
        title: "Search that reads whole words",
        body: "Full-text search across channels and threads, with hits grouped by where they were said. Mention someone and they receive one notification, not nine, and the unread count they see is the one that matters.",
        icon: Search,
        tint: "bg-[var(--pastel-green)]",
        ink: "text-[var(--pastel-green-ink)]",
    },
    {
        title: "Stamps in the reader's own timezone",
        body: "Timestamps render in each reader's own zone, so a 6am message in Bengaluru does not read as midnight to somebody in Lisbon. Nobody has to do arithmetic to work out whether a reply is late.",
        icon: Time,
        tint: "bg-[var(--pastel-red)]",
        ink: "text-[var(--pastel-red-ink)]",
    },
];

/**
 * Asymmetric on purpose. A four-up grid of equal squares reads as a pricing
 * table; giving the first card two rows and the fourth a single column makes the
 * eye enter somewhere specific.
 */
export function FeatureBento() {
    // The cards carry `data-reveal`, not this container, so it needs the group
    // hook: a single observer that reveals every card as the grid enters.
    const ref = useRevealGroup<HTMLDivElement>();

    return (
        <section id="features" className="border-b border-border">
            <div className="mx-auto max-w-5xl px-6 py-24 sm:py-28">
                <div className="max-w-2xl">
                    <p className="landing-mono mb-6">What it does</p>
                    <h2 className="landing-serif text-[clamp(1.75rem,3.2vw,2.75rem)] tracking-[-0.02em]">
                        Four things it takes seriously
                    </h2>
                </div>

                <div ref={ref} className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <article
                                key={feature.title}
                                data-reveal
                                style={revealIndex(index)}
                                className={cn(
                                    "landing-card p-6 sm:p-8",
                                    // Two rows for the first card, one each for
                                    // the rest: the row maths stays exact at
                                    // three columns and the grid never leaves a
                                    // hole on the second line.
                                    index === 0
                                        ? "lg:col-span-1 lg:row-span-2"
                                        : index === 1
                                          ? "lg:col-span-2"
                                          : "lg:col-span-1",
                                )}
                            >
                                <span
                                    className={cn(
                                        "mb-6 flex size-10 items-center justify-center rounded-[10px]",
                                        feature.tint,
                                    )}
                                >
                                    <Icon size={20} className={feature.ink} />
                                </span>

                                <h3 className="text-[0.9375rem] font-medium tracking-[-0.01em]">
                                    {feature.title}
                                </h3>
                                <p className="mt-3 text-sm leading-[1.6] text-muted-foreground">
                                    {feature.body}
                                </p>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
