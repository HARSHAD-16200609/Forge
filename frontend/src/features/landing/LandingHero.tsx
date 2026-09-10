import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { DotPattern } from "@/components/ui/dot-pattern";
import { ProductPreview } from "./product-preview";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const entranceVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: EASE_OUT },
    },
};

export function LandingHero() {
    const reduce = useReducedMotion();
    const previewRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: previewRef,
        offset: ["start end", "end start"],
    });
    const parallaxY = useTransform(scrollYProgress, [0, 1], [48, -48]);

    return (
        <section className="relative isolate overflow-clip">
            <DotPattern
                width={26}
                height={26}
                cx={1}
                cy={1}
                cr={1}
                className="fill-muted"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute right-[-20%] top-[-20%] -z-10 size-[42rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--brand),transparent_82%),transparent)] opacity-60"
            />

            <div className="mx-auto grid min-h-svh max-w-7xl items-center gap-12 px-6 pb-20 pt-32 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-28 lg:pt-36">
                <div className="max-w-xl">
                    <motion.div
                        initial={reduce ? false : { opacity: 0, y: 20 }}
                        animate={reduce ? undefined : { opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: EASE_OUT }}
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                            Forge · Team communication
                        </p>
                    </motion.div>

                    <motion.div
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.09, delayChildren: 0.25 } },
                        }}
                        initial={reduce ? false : "hidden"}
                        animate={reduce ? undefined : "visible"}
                    >
                        <motion.h1
                            variants={entranceVariants}
                            className="mt-5 text-balance text-4xl font-semibold tracking-tight leading-[1.04] sm:text-5xl lg:text-6xl"
                        >
                            Every conversation your team ships, in one place.
                        </motion.h1>
                        <motion.p
                            variants={entranceVariants}
                            className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
                        >
                            Channels, threads, and direct messages with live presence and rich
                            replies — built to keep your whole team in sync.
                        </motion.p>
                    </motion.div>

                    <motion.div
                        className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
                        initial={reduce ? false : { opacity: 0, y: 20 }}
                        animate={reduce ? undefined : { opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.55, ease: EASE_OUT }}
                    >
                        <Button
                            asChild
                            size="lg"
                            className="h-11 px-6 bg-brand text-brand-foreground transition-transform duration-200 hover:scale-[1.03] hover:bg-brand/90 active:scale-[0.98] motion-reduce:transform-none"
                        >
                            <Link to="/auth/register">
                                <span>Get started free</span>
                            </Link>
                        </Button>
                        <Button
                            asChild
                            size="lg"
                            variant="ghost"
                            className="h-11 px-6 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] motion-reduce:transform-none"
                        >
                            <a href="#product">
                                <span>See it in action</span>
                            </a>
                        </Button>
                    </motion.div>
                </div>

                <div className="relative" ref={previewRef}>
                    <motion.div
                        className="relative"
                        style={reduce ? undefined : { y: parallaxY }}
                        initial={reduce ? false : { opacity: 0, y: 40, scale: 0.98 }}
                        animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.35, ease: EASE_OUT }}
                    >
                        <ProductPreview />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}