const capabilities = [
    "Channels",
    "Threads",
    "Direct messages",
    "Mentions",
    "Full-text search",
    "Unread tracking",
    "Block editor",
    "Timezone-aware stamps",
];

/**
 * A static index, not a marquee.
 *
 * The previous version duplicated the list and translated it forever at
 * constant speed. That is a motion effect with no information in it: the same
 * eight words pass the reader three times, none of them newly readable, and a
 * moving element in the middle of the page is the first thing to become
 * irritating on a long read. A quiet row does the same job and can be read at a
 * glance, which a moving one never can.
 */
export function CapabilityStrip() {
    return (
        <section className="border-b border-border">
            <div className="mx-auto max-w-5xl px-6 py-8">
                <h2 className="landing-mono mb-5">It covers</h2>
                <ul className="flex flex-wrap items-center gap-x-9 gap-y-3">
                    {capabilities.map((item) => (
                        <li key={item} className="text-sm text-muted-foreground">
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
