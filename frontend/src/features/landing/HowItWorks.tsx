import { revealIndex, useReveal, useRevealGroup } from "./useReveal";

const steps = [
    {
        title: "Create a workspace",
        body: "One per team, named after the team. Invite people by email address and they arrive in the right channels with the history already there.",
    },
    {
        title: "Open the channels you will actually use",
        body: "One per project, plus the two you will need regardless: a general channel for anything without a home, and a random channel for everything that does not deserve one.",
    },
    {
        title: "Move the work across",
        body: "Threads carry the decisions, the channel carries the current state of the work. Link to a document rather than pasting all of it into a message, so the conversation stays readable a year later.",
    },
    {
        title: "Leave, and catch up properly",
        body: "Unread counts, mentions and search mean a week away does not turn into an hour of scrolling. You can find the one thing you missed and read the rest in summary.",
    },
];

/**
 * A real ordered list, so the sequence survives being read aloud, copied, or
 * scraped. A stack of divs with numbers drawn inside them is a picture of a
 * list rather than a list, and the numbering is the only thing here that
 * carries meaning from the markup.
 */
export function HowItWorks() {
    const headingRef = useReveal<HTMLDivElement>();
    // Each step also carries `data-reveal`, so the list needs the group hook or
    // the steps stay at zero opacity behind a revealed list.
    const listRef = useRevealGroup<HTMLOListElement>();

    return (
        <section id="how-it-works" className="border-b border-border">
            <div className="mx-auto max-w-5xl px-6 py-24 sm:py-28">
                <div ref={headingRef} data-reveal className="max-w-2xl">
                    <p className="landing-mono mb-6">Getting started</p>
                    <h2 className="landing-serif text-[clamp(1.75rem,3.2vw,2.75rem)] tracking-[-0.02em]">
                        Getting a team in
                    </h2>
                </div>

                <ol
                    ref={listRef}
                    data-reveal
                    className="mt-14 divide-y divide-border border-t border-border"
                >
                    {steps.map((step, index) => (
                        <li
                            key={step.title}
                            data-reveal
                            style={revealIndex(index)}
                            className="grid gap-2 py-8 sm:grid-cols-[4rem_1fr] sm:gap-8"
                        >
                            <span className="landing-mono pt-1 tabular-nums">
                                {String(index + 1).padStart(2, "0")}
                            </span>
                            <div>
                                <h3 className="text-[0.9375rem] font-medium tracking-[-0.01em]">
                                    {step.title}
                                </h3>
                                <p className="mt-2 max-w-2xl text-sm leading-[1.6] text-muted-foreground">
                                    {step.body}
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
