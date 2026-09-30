import { useEffect, useRef } from "react";

/**
 * Scroll entrance, built on IntersectionObserver.
 *
 * Why not a library: the only thing needed is "set an attribute once, then stop
 * looking". GSAP and Framer Motion both solve scroll orchestration, which this
 * page does not want, and between them they were 250 kB of the landing payload.
 *
 * Why not a scroll listener: a `scroll` handler runs on every frame of the
 * whole page and forces a read of layout that then has to be reconciled. The
 * observer callback is delivered by the browser off the main thread and only
 * fires at threshold crossings.
 *
 * The CSS side lives in `index.css` under `[data-reveal]`, and honours
 * `prefers-reduced-motion` by making content visible with no transform at all.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: {
    /** Fraction of the element that must be visible before it animates. */
    threshold?: number;
    /** Margin around the root, so an element can animate before it is reached. */
    rootMargin?: string;
}) {
    const ref = useRef<T>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // No observer, or nothing to observe: show the content rather than
        // leave it permanently invisible.
        if (typeof IntersectionObserver === "undefined") {
            element.setAttribute("data-revealed", "");
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    entry.target.setAttribute("data-revealed", "");
                    // `once` semantics: an element that has appeared must never
                    // disappear again as the reader scrolls back up.
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold: options?.threshold ?? 0.15,
                rootMargin: options?.rootMargin ?? "0px 0px -8% 0px",
            },
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [options?.threshold, options?.rootMargin]);

    return ref;
}

/**
 * Reveals a whole group from a single observer.
 *
 * Use this for a list or a grid whose items each carry `data-reveal`. One
 * observer on the container is both cheaper and steadier than one per card, and
 * it makes the cascade work the way it reads: the group arrives, then the items
 * step in behind it.
 *
 * The subtlety worth knowing: attaching the plain `useReveal` to a container
 * whose *children* are the ones marked `data-reveal` does nothing visible. The
 * attribute lands on the container, which has no rule attached to it, and the
 * children sit at `opacity: 0` forever. That is a section of the page rendered
 * but never seen, and no unit test with a hand-driven observer will catch it.
 */
export function useRevealGroup<T extends HTMLElement = HTMLDivElement>(options?: {
    threshold?: number;
    rootMargin?: string;
}) {
    const ref = useRef<T>(null);

    useEffect(() => {
        const root = ref.current;
        if (!root) return;

        const targets = [
            ...(root.matches("[data-reveal]") ? [root] : []),
            ...root.querySelectorAll<HTMLElement>("[data-reveal]"),
        ];

        if (targets.length === 0) return;

        if (typeof IntersectionObserver === "undefined") {
            for (const target of targets) target.setAttribute("data-revealed", "");
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;
                for (const target of targets) target.setAttribute("data-revealed", "");
                observer.disconnect();
            },
            {
                threshold: options?.threshold ?? 0.1,
                rootMargin: options?.rootMargin ?? "0px 0px -8% 0px",
            },
        );

        observer.observe(root);
        return () => observer.disconnect();
    }, [options?.threshold, options?.rootMargin]);

    return ref;
}

/**
 * Index attribute for the cascade delay. Set `--reveal-index` on each child of
 * a revealed group and the CSS adds 80ms per step, which is enough to read as a
 * sequence and short enough that the last item is not noticeably late.
 */
export const revealIndex = (index: number) => ({ "--reveal-index": index }) as React.CSSProperties;
