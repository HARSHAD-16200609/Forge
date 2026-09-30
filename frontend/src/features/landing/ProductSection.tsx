import { ProductVideo } from "./ProductVideo";
import { useReveal } from "./useReveal";

export function ProductSection() {
    const headingRef = useReveal<HTMLDivElement>();
    const mediaRef = useReveal<HTMLDivElement>();

    return (
        <section id="product" className="border-b border-border">
            <div className="mx-auto max-w-5xl px-6 py-24 sm:py-28">
                <div ref={headingRef} data-reveal className="max-w-2xl">
                    <p className="landing-mono mb-6">A recording</p>
                    <h2 className="landing-serif text-[clamp(1.75rem,3.2vw,2.75rem)] tracking-[-0.02em]">
                        Fifteen seconds in a real workspace
                    </h2>
                    <p className="mt-5 text-[1.0625rem] leading-[1.6] text-muted-foreground">
                        Recorded from the running app with a signed-in account. Scroll back through
                        a channel, open a thread, read the replies. Nothing in the frame is a
                        mockup, and the people in it are not stock.
                    </p>
                </div>

                <div ref={mediaRef} data-reveal className="mt-12">
                    <ProductVideo />
                </div>
            </div>
        </section>
    );
}
