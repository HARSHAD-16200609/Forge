import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export function Reveal({
    children,
    className,
    delay = 0,
    y = 24,
}: {
    children: ReactNode;
    className?: string;
    delay?: number;
    y?: number;
}) {
    const reduce = useReducedMotion();

    if (reduce) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay, ease: EASE_OUT }}
        >
            {children}
        </motion.div>
    );
}

export function RevealStagger({
    children,
    className,
    delayChildren = 0.1,
    stagger = 0.06,
}: {
    children: ReactNode;
    className?: string;
    delayChildren?: number;
    stagger?: number;
}) {
    const reduce = useReducedMotion();
    const variants: Variants = {
        hidden: {},
        visible: {
            transition: { staggerChildren: stagger, delayChildren },
        },
    };

    return (
        <motion.div
            className={className}
            variants={variants}
            initial={reduce ? false : "hidden"}
            whileInView={reduce ? undefined : "visible"}
            viewport={{ once: true, amount: 0.15 }}
        >
            {children}
        </motion.div>
    );
}

export function RevealItem({
    children,
    className,
    y = 20,
}: {
    children: ReactNode;
    className?: string;
    y?: number;
}) {
    const reduce = useReducedMotion();
    const variants: Variants = {
        hidden: { opacity: 0, y },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.55, ease: EASE_OUT },
        },
    };

    return (
        <motion.div className={className} variants={reduce ? undefined : variants}>
            {children}
        </motion.div>
    );
}