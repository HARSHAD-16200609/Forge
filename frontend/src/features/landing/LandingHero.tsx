import { Link } from "react-router-dom";
import { ArrowRight } from "@carbon/icons-react";

/**
 * Typographic hero, no media.
 *
 * The first decision worth defending: there is no video, image or product mock
 * up here. A video in the hero becomes the Largest Contentful Paint candidate,
 * and LCP is the metric that decides how fast the page feels. A recording of
 * the product lives one section further down, in `ProductVideo`, and it is
 * framed as a recording rather than smuggled in as atmosphere.
 *
 * The heading also carries the only large type on the page. Everything below
 * steps down, so this is the single place the serif is allowed to be loud.
 */
export function LandingHero() {
    return (
        <section className="border-b border-border">
            <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32 lg:py-40">
                <div className="max-w-3xl">
                    <p className="landing-mono mb-8">For teams that talk a lot</p>

                    <h1 className="landing-serif text-[clamp(2rem,5.5vw,4.75rem)] leading-[1.04] tracking-[-0.03em]">
                        Everything your team says, in one place.
                    </h1>

                    <p className="mt-8 max-w-xl text-[1.0625rem] leading-[1.6] text-muted-foreground sm:text-lg">
                        Forge gives you channels for everything: projects, support, design review,
                        and the argument about naming things. Replies stay attached to the message
                        that started them, so a decision is never buried six scrolls down.
                    </p>

                    <div className="mt-12 flex flex-wrap items-center gap-3">
                        <Link to="/auth/register" className="landing-cta">
                            Create a workspace
                            <ArrowRight size={16} />
                        </Link>
                        <Link to="/auth/login" className="landing-cta-secondary">
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
