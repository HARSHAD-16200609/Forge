import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./Reveal";

export function FinalCta() {
    return (
        <section className="relative overflow-clip">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklch,var(--brand),transparent_88%),transparent)]"
            />
            <div className="mx-auto max-w-4xl px-6 py-28 text-center">
                <Reveal className="flex flex-col items-center">
                    <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl lg:leading-[1.05]">
                        Put your whole team on one page.
                    </h2>
                    <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                        Create a workspace in under a minute. No credit card, no setup ritual.
                    </p>
                    <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                        <Button
                            asChild
                            size="lg"
                            className="h-11 gap-2 px-7 bg-brand text-brand-foreground transition-transform duration-200 hover:scale-[1.03] hover:bg-brand/90 active:scale-[0.98] motion-reduce:transform-none"
                        >
                            <Link to="/auth/register">
                                <span>Get started free</span>
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                        <Button
                            asChild
                            size="lg"
                            variant="ghost"
                            className="h-11 px-6 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] motion-reduce:transform-none"
                        >
                            <Link to="/auth/login">
                                <span>Log in</span>
                            </Link>
                        </Button>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}