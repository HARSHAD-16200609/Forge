import { Link } from "react-router-dom";
import { ArrowRight } from "@carbon/icons-react";
import { useReveal } from "./useReveal";

export function FinalCta() {
    const ref = useReveal<HTMLDivElement>();

    return (
        <section className="border-b border-border">
            <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
                <div ref={ref} data-reveal className="max-w-2xl">
                    <p className="landing-mono mb-6">Next</p>
                    <h2 className="landing-serif text-[clamp(1.75rem,3.2vw,2.75rem)] tracking-[-0.02em]">
                        Open a workspace and find out whether it fits
                    </h2>
                    <p className="mt-5 text-[1.0625rem] leading-[1.6] text-muted-foreground">
                        It takes an email address and a name. If it turns out your team thinks in
                        threads and channels, you will know within a day, and if not you have lost a
                        day.
                    </p>

                    <div className="mt-10 flex flex-wrap items-center gap-3">
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
