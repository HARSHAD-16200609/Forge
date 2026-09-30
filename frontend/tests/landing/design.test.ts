import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The landing page is held to a written set of rules that are easy to break by
 * accident and impossible to notice in review, because each one looks like a
 * reasonable choice on its own. A banned shadow reads as "just a little depth".
 * A lucide import reads as "the icon library we already use". So they are
 * asserted here rather than trusted.
 *
 * These are source-level checks on purpose. A screenshot would pass while a
 * future edit reintroduced `shadow-2xl`; a grep cannot.
 */

const landingDir = join(process.cwd(), "src", "features", "landing");

const sources = readdirSync(landingDir)
    .filter((name) => name.endsWith(".ts") || name.endsWith(".tsx"))
    .map((name) => ({
        name,
        text: readFileSync(join(landingDir, name), "utf8"),
    }));

const css = readFileSync(join(process.cwd(), "src", "index.css"), "utf8");

const homePage = readFileSync(join(process.cwd(), "src", "app", "pages", "HomePage.tsx"), "utf8");

describe("landing sources", () => {
    it("has source files to check", () => {
        expect(sources.length).toBeGreaterThan(5);
    });

    it("does not import lucide", () => {
        for (const { name, text } of sources) {
            expect(text, `${name} imports lucide`).not.toMatch(/lucide-react/);
        }
    });

    it("does not import framer-motion or gsap", () => {
        for (const { name, text } of sources) {
            expect(text, `${name} imports an animation library`).not.toMatch(
                /framer-motion|from "gsap"|@gsap\/react/,
            );
        }
    });

    it("uses no heavy shadows", () => {
        for (const { name, text } of sources) {
            expect(text, `${name} uses a heavy shadow`).not.toMatch(
                /shadow-(sm|md|lg|xl|2xl|inner)/,
            );
        }
    });

    it("uses no gradient utilities or text", () => {
        for (const { name, text } of sources) {
            expect(text, `${name} uses a gradient`).not.toMatch(
                /gradient|bg-gradient|from-\w+-\d{2,3}\s+to-/,
            );
        }
    });

    it("uses no oversized corner radii", () => {
        // 8px and 12px are the ceiling.
        for (const { name, text } of sources) {
            expect(text, `${name} uses an oversized radius`).not.toMatch(/rounded-(2xl|3xl)\b/);
        }
    });

    it("confines the one permitted circle to the video play control", () => {
        // `rounded-full` is a media affordance on the play button, not a
        // lozenge. Anywhere else it is the pill habit this page is avoiding.
        for (const { name, text } of sources) {
            const circles = text.match(/rounded-full\b/g) ?? [];
            if (name === "ProductVideo.tsx") {
                expect(circles.length).toBe(1);
            } else {
                expect(circles, `${name} uses rounded-full`).toHaveLength(0);
            }
        }
    });

    it("contains no emoji", () => {
        for (const { name, text } of sources) {
            const found = text.match(/\p{Extended_Pictographic}/gu);
            expect(found, `${name} contains ${found?.join(" ")}`).toBeNull();
        }
    });

    it("uses no infinite or attention-seeking animation classes", () => {
        for (const { name, text } of sources) {
            expect(text, `${name} animates in a loop`).not.toMatch(
                /animate-(pulse|bounce|ping|spin|marquee)/,
            );
        }
    });

    it("attaches no scroll event listeners", () => {
        for (const { name, text } of sources) {
            expect(text, `${name} listens to scroll`).not.toMatch(
                /addEventListener\(\s*["']scroll|onscroll|useScroll/,
            );
        }
    });
});

describe("landing composition", () => {
    it("renders the lean section order", () => {
        const order = [
            "LandingNav",
            "LandingHero",
            "CapabilityStrip",
            "ProductSection",
            "FeatureBento",
            "HowItWorks",
            "FinalCta",
            "LandingFooter",
        ];

        const positions = order.map((name) => homePage.indexOf(`<${name} />`));
        expect(positions.every((p) => p > -1)).toBe(true);
        // Every component appears after the one before it.
        expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    });

    it("keeps the page on the scoped landing surface", () => {
        expect(homePage).toContain("landing-surface");
    });

    it("does not pull the marquee or dot pattern back in", () => {
        expect(homePage).not.toMatch(/Marquee|DotPattern|dot-pattern/);
    });
});

describe("landing stylesheet", () => {
    it("scopes the warm palette to .landing-surface rather than :root", () => {
        // The workspace app keeps the cool tokens, so the landing override must
        // not be written against the global root.
        const rootBlock = css.slice(css.indexOf(":root"), css.indexOf(".dark {"));
        expect(rootBlock).not.toMatch(/#f7f6f3/);
        expect(css).toMatch(/\.landing-surface\s*\{[^}]*--background:\s*#f7f6f3/);
    });

    it("defines warm dark tokens", () => {
        expect(css).toMatch(/\.dark \.landing-surface\s*\{[^}]*--background:\s*#14120f/);
    });

    it("keeps component classes inside a cascade layer", () => {
        // Unlayered rules outrank every Tailwind utility, which would make
        // `h-9` or `rounded-md` alongside `.landing-cta` silently do nothing.
        const unlayered = css.match(/^\.landing-(cta|card|serif|mono)\s*\{/m);
        expect(unlayered).toBeNull();
    });

    it("no longer contains the marquee keyframes", () => {
        expect(css).not.toMatch(/@keyframes marquee|marquee-track/);
    });

    it("makes revealed content visible under reduced motion", () => {
        const block = css.slice(css.indexOf("prefers-reduced-motion"));
        expect(block).toMatch(/\[data-reveal\][^}]*opacity:\s*1\s*!important/);
    });
});

describe("product media", () => {
    const mediaDir = join(process.cwd(), "public", "media");

    it("ships a poster and one video, and nothing redundant", () => {
        const files = readdirSync(mediaDir);
        expect(files).toContain("forge-app.mp4");
        expect(files).toContain("forge-app-poster.webp");
        // A VP9 copy came out larger than the H.264 encode, so it was removed
        // rather than shipped as dead weight.
        expect(files).not.toContain("forge-app.webm");
    });

    it("keeps the video small enough to be worth a lazy load", () => {
        const bytes = statSync(join(mediaDir, "forge-app.mp4")).size;
        expect(bytes).toBeLessThan(1_200_000);
    });
});
