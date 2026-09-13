import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const DURATION = 0.45;
const STEP = 0.07;

function renderHighlight(title: string, highlight?: string) {
    if (!highlight) return title;
    const index = title.toLowerCase().indexOf(highlight.toLowerCase());
    if (index === -1) return title;
    return (
        <>
            {title.slice(0, index)}
            <span className="text-brand">{title.slice(index, index + highlight.length)}</span>
            {title.slice(index + highlight.length)}
        </>
    );
}

interface ErrorScreenProps {
    statusCode?: string;
    icon: ReactNode;
    title: string;
    description: string;
    highlight?: string;
    scope?: "ACCESS" | "CHANNEL" | "WORKSPACE" | "CONVERSATION" | "PAGE" | "ERROR";
    standalone?: boolean;
    actions?: ReactNode;
    className?: string;
}

export function ErrorScreen({
    statusCode,
    icon,
    title,
    description,
    highlight,
    scope,
    standalone = false,
    actions,
    className,
}: ErrorScreenProps) {
    const reduce = useReducedMotion();

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                "relative flex w-full items-center justify-center overflow-hidden",
                standalone ? "min-h-svh" : "h-full",
                className,
            )}
        >
            {standalone ? (
                <>
                    <div className="aurora-hero absolute inset-0" aria-hidden="true" />
                    <div
                        className="error-grain pointer-events-none fixed inset-0 z-[50] opacity-[0.03]"
                        aria-hidden="true"
                    />
                </>
            ) : (
                <>
                    <div className="error-stage absolute inset-0" aria-hidden="true" />
                    <div className="error-stage-glow absolute inset-0" aria-hidden="true" />
                </>
            )}

            <div className="relative w-full max-w-3xl px-4 py-16 md:py-24">
                <motion.div
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: DURATION, ease: EASE }}
                >
                    <div className="error-panel-shell rounded-[1.75rem] p-1 ring-1 ring-brand/15">
                        <div className="error-panel-core rounded-[1.375rem] p-8 md:p-12">
                            <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-12">
                                <div className="min-w-0 md:order-1">
                                    {statusCode && (
                                        <motion.div
                                            initial={reduce ? false : { opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                duration: DURATION,
                                                delay: STEP,
                                                ease: EASE,
                                            }}
                                            className="flex items-center gap-4"
                                        >
                                            <span className="rounded-full bg-brand-soft/70 px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.18em] text-brand uppercase ring-1 ring-brand/15">
                                                {statusCode}
                                                {scope ? ` · ${scope}` : ""}
                                            </span>
                                            <span
                                                className="h-px flex-1 bg-border"
                                                aria-hidden="true"
                                            />
                                        </motion.div>
                                    )}

                                    <motion.h2
                                        initial={reduce ? false : { opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: DURATION,
                                            delay: STEP * 2,
                                            ease: EASE,
                                        }}
                                        className="mt-6 text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
                                    >
                                        {renderHighlight(title, highlight)}
                                    </motion.h2>

                                    <motion.p
                                        initial={reduce ? false : { opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: DURATION,
                                            delay: STEP * 3,
                                            ease: EASE,
                                        }}
                                        className="mt-3 max-w-[46ch] text-sm leading-6 text-muted-foreground"
                                    >
                                        {description}
                                    </motion.p>

                                    {actions && (
                                        <motion.div
                                            initial={reduce ? false : { opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                duration: DURATION,
                                                delay: STEP * 4,
                                                ease: EASE,
                                            }}
                                            className="mt-8 flex flex-wrap items-center gap-3"
                                        >
                                            {actions}
                                        </motion.div>
                                    )}
                                </div>

                                <motion.div
                                    initial={reduce ? false : { opacity: 0, scale: 0.92 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        duration: DURATION,
                                        delay: STEP,
                                        ease: EASE,
                                    }}
                                    className="order-first md:col-start-2 md:row-start-1 md:order-none md:pt-1"
                                >
                                    <div className="auth-float relative">
                                        <span
                                            className="absolute -top-2 -right-2 z-10 size-3.5 rounded-[4px] bg-brand-soft ring-1 ring-brand/30"
                                            aria-hidden="true"
                                        />
                                        <div className="relative flex size-20 items-center justify-center rounded-2xl md:size-24">
                                            <span
                                                className="error-mark absolute inset-0 rounded-2xl"
                                                aria-hidden="true"
                                            />
                                            <span
                                                className="error-mark-hatch absolute inset-0 rounded-2xl"
                                                aria-hidden="true"
                                            />
                                            <span className="relative text-white [&>svg]:size-8 md:[&>svg]:size-9">
                                                {icon}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}