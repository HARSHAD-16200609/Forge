import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export const APP_EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

export function FadeIn({
    children,
    className,
    active = true,
    y = 4,
    delay = 0,
    duration = 0.16,
}: {
    children: ReactNode;
    className?: string;
    active?: boolean;
    y?: number;
    delay?: number;
    duration?: number;
}) {
    const reduce = useReducedMotion();
    const shouldAnimate = !reduce && active;
    return (
        <motion.div
            className={className}
            initial={shouldAnimate ? { opacity: 0, y } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration, delay, ease: APP_EASE }}
        >
            {children}
        </motion.div>
    );
}