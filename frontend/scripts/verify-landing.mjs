/**
 * Visual and accessibility audit of the landing page.
 *
 *   node scripts/verify-landing.mjs [baseUrl]
 *
 * Runs the real page in a real browser across five viewports and both themes,
 * and fails loudly rather than reporting a soft warning. It checks the things a
 * source-level test cannot see: whether the headline actually wraps to two
 * lines at 390px, whether anything overflows sideways, what colour text really
 * resolves to once inherited backgrounds are composited, and what the browser
 * names as the Largest Contentful Paint.
 *
 * Contrast is measured against the first opaque background up the tree, not
 * against a hard-coded canvas, because most text on this page inherits its
 * background from a container several levels above it.
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:5173";

const VIEWPORTS = [
    { name: "mobile", width: 390, height: 844 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "laptop", width: 1280, height: 800 },
    { name: "wide", width: 1680, height: 1050 },
    { name: "narrow-tall", width: 360, height: 1200 },
];

const AA = 4.5;

const results = [];
const record = (scope, check, ok, detail = "") => results.push({ scope, check, ok, detail });

// ── helpers injected into the page ─────────────────────────────────────────
const PAGE_HELPERS = `
  const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const luminance = ([r, g, b]) =>
    0.2126 * toLinear(r / 255) + 0.7152 * toLinear(g / 255) + 0.0722 * toLinear(b / 255);

  const parse = (value) => {
    const m = value.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const parts = m[1].split(/[,\\s/]+/).filter(Boolean).map(Number);
    return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
  };

  // Walk up until an opaque background is found, compositing translucent layers
  // over whatever is behind them. Returns the resolved colour.
  const backdrop = (el) => {
    const layers = [];
    let node = el;
    while (node && node !== document.documentElement.parentNode) {
      const bg = parse(getComputedStyle(node).backgroundColor);
      if (bg && bg[3] > 0) {
        layers.push(bg);
        if (bg[3] === 1) break;
      }
      node = node.parentElement;
    }
    let out = [255, 255, 255, 1];
    for (let i = layers.length - 1; i >= 0; i--) {
      const [r, g, b, a] = layers[i];
      out = [
        r * a + out[0] * (1 - a),
        g * a + out[1] * (1 - a),
        b * a + out[2] * (1 - a),
        1,
      ];
    }
    return out;
  };

  const contrast = (el) => {
    const fg = parse(getComputedStyle(el).color);
    if (!fg) return null;
    const bg = backdrop(el);
    const a = fg[3] ?? 1;
    const composited = [
      fg[0] * a + bg[0] * (1 - a),
      fg[1] * a + bg[1] * (1 - a),
      fg[2] * a + bg[2] * (1 - a),
    ];
    const [hi, lo] = [luminance(composited), luminance(bg)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
`;

const auditPage = async (page) =>
    page.evaluate(
        ({ helpers }) => {
            const fn = new Function(
                `${helpers}; return { contrast, backdrop, parse, luminance };`,
            )();
            const out = {
                lines: null,
                overflow: null,
                contrast: [],
                lcp: null,
                lcpTag: null,
                targets: [],
                hidden: 0,
                hiddenLabels: [],
            };

            const h1s = document.querySelectorAll("h1");
            const h1 = h1s[0];
            out.h1Count = h1s.length;
            if (h1) {
                const range = document.createRange();
                range.selectNodeContents(h1);
                out.lines = range.getClientRects().length;
                out.h1Text = h1.textContent.trim();
            }

            out.overflow =
                document.documentElement.scrollWidth - document.documentElement.clientWidth;

            // Sample the text that actually carries meaning, rather than every
            // node, so the number stays readable and stable.
            const selectors = [
                "h1",
                "h2",
                "h3",
                ".landing-mono",
                "main p",
                "main li",
                "footer p",
                "footer a",
                "header a",
                "header span",
            ];
            const seen = new Set();
            for (const selector of selectors) {
                for (const el of document.querySelectorAll(selector)) {
                    const text = el.textContent.trim();
                    if (!text || seen.has(text)) continue;
                    seen.add(text);
                    const size = parseFloat(getComputedStyle(el).fontSize);
                    const ratio = fn.contrast(el);
                    if (ratio) {
                        out.contrast.push({
                            text: text.slice(0, 42),
                            ratio: Number(ratio.toFixed(2)),
                            size,
                            // Large text is 18.66px bold or 24px regular.
                            large: size >= 24,
                        });
                    }
                }
            }

            // Interactive targets on the smallest viewport.
            for (const el of document.querySelectorAll("a, button")) {
                const r = el.getBoundingClientRect();
                if (r.width === 0 && r.height === 0) continue;
                if (r.height < 24 || r.width < 24) {
                    out.targets.push({
                        text: (el.textContent || el.getAttribute("aria-label") || "?")
                            .trim()
                            .slice(0, 30),
                        w: Math.round(r.width),
                        h: Math.round(r.height),
                    });
                }
            }

            // Anything the reveal system left invisible.
            for (const el of document.querySelectorAll("[data-reveal]")) {
                if (Number(getComputedStyle(el).opacity) < 0.9) {
                    out.hidden++;
                    // Name the stragglers: "8 hidden" is a count, an identity
                    // is a diagnosis.
                    const label =
                        el.tagName.toLowerCase() +
                        (el.id ? `#${el.id}` : "") +
                        ': "' +
                        (el.textContent || "").trim().slice(0, 30) +
                        '"';
                    out.hiddenLabels.push(label);
                }
            }

            return out;
        },
        { helpers: PAGE_HELPERS },
    );

const measureLcp = (page) =>
    page.evaluate(
        () =>
            new Promise((resolve) => {
                let tag = null;
                new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const last = entries[entries.length - 1];
                    if (last) tag = last.element ? last.element.tagName : null;
                }).observe({ type: "largest-contentful-paint", buffered: true });

                setTimeout(() => resolve(tag), 600);
            }),
    );

const browser = await chromium.launch();

for (const viewport of VIEWPORTS) {
    for (const theme of ["light", "dark"]) {
        const scope = `${viewport.name} ${viewport.width}x${viewport.height} ${theme}`;
        const context = await browser.newContext({
            viewport: { width: viewport.width, height: viewport.height },
            colorScheme: theme,
            reducedMotion: "no-preference",
        });
        const page = await context.newPage();
        await page.addInitScript(([t]) => localStorage.setItem("theme", t), [theme]);
        await page.goto(BASE, { waitUntil: "networkidle" });

        // Scroll the whole page before measuring. Reveal content is *meant* to
        // be hidden while it is below the fold, so sampling at the top of the
        // page would report every section as a failure.
        await page.evaluate(async () => {
            const step = window.innerHeight * 0.8;
            for (let y = 0; y < document.body.scrollHeight; y += step) {
                window.scrollTo(0, y);
                await new Promise((r) => setTimeout(r, 90));
            }
            window.scrollTo(0, 0);
            await new Promise((r) => setTimeout(r, 500));
        });
        await page.waitForTimeout(400);

        const audit = await auditPage(page);
        const lcpTag = await measureLcp(page);

        record(scope, "exactly one h1", audit.h1Count === 1, `found ${audit.h1Count}`);
        record(
            scope,
            "h1 wraps to 2 lines or fewer",
            audit.lines !== null && audit.lines <= 2,
            `${audit.lines} lines`,
        );
        record(scope, "no horizontal overflow", audit.overflow <= 0, `${audit.overflow}px`);
        record(
            scope,
            "nothing left invisible by reveals",
            audit.hidden === 0,
            `${audit.hidden} hidden: ${audit.hiddenLabels.slice(0, 4).join(" | ")}`,
        );

        const failing = audit.contrast.filter((c) => c.ratio < (c.large ? 3 : AA));
        record(
            scope,
            `text contrast >= ${AA}:1`,
            failing.length === 0,
            failing.length
                ? failing.map((c) => `${c.text} (${c.ratio}:1 @${c.size}px)`).join("; ")
                : `${audit.contrast.length} samples`,
        );

        // WCAG 2.5.8 (Target Size Minimum, AA) asks for 24x24 CSS px, not 44.
        const small = audit.targets.filter((t) => t.h < 24 || t.w < 24);
        record(
            scope,
            "tap targets >= 24px (WCAG 2.5.8)",
            small.length === 0,
            small.length ? small.map((t) => `${t.text} ${t.w}x${t.h}`).join("; ") : "",
        );

        if (theme === "light" && viewport.name === "laptop") {
            record(scope, "LCP element is text, not video", lcpTag !== "VIDEO", `lcp: ${lcpTag}`);
        }

        await context.close();
    }
}

// ── reduced motion ─────────────────────────────────────────────────────────
for (const theme of ["light", "dark"]) {
    const scope = `reduced-motion ${theme}`;
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        colorScheme: theme,
        reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.addInitScript(([t]) => localStorage.setItem("theme", t), [theme]);
    await page.goto(BASE, { waitUntil: "networkidle" });

    const state = await page.evaluate(() => {
        const video = document.querySelector("video");
        return {
            paused: video ? video.paused : null,
            revealsVisible: [...document.querySelectorAll("[data-reveal]")].every(
                (el) => Number(getComputedStyle(el).opacity) > 0.9,
            ),
        };
    });

    // Scroll the video into view: a reduced-motion reader must still not get it
    // started for them.
    await page.locator("video").scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    const stillPaused = await page.evaluate(() => document.querySelector("video").paused);

    record(scope, "reveal content visible without scrolling", state.revealsVisible);
    record(scope, "video does not autoplay under reduced motion", stillPaused);
    await context.close();
}

// ── the video does start when motion is welcome ────────────────────────────
{
    const scope = "playback (motion allowed)";
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });

    const video = page.locator("video");
    await video.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);

    const state = await video.evaluate((el) => ({
        paused: el.paused,
        readyState: el.readyState,
        currentTime: el.currentTime,
    }));

    // The headline feature has to actually run, not merely be present.
    record(scope, "video plays when scrolled into view", !state.paused, JSON.stringify(state));
    record(
        scope,
        "video has decoded frames",
        state.readyState >= 2,
        `readyState ${state.readyState}`,
    );
    record(
        scope,
        "video is progressing",
        state.currentTime > 0,
        `t=${state.currentTime.toFixed(2)}s`,
    );

    await context.close();
}

await browser.close();

// ── report ─────────────────────────────────────────────────────────────────
const failed = results.filter((r) => !r.ok);
const byCheck = new Map();
for (const r of results) {
    const entry = byCheck.get(r.check) ?? { total: 0, failed: [] };
    entry.total++;
    if (!r.ok) entry.failed.push(`${r.scope}: ${r.detail}`);
    byCheck.set(r.check, entry);
}

console.log("\nlanding audit — " + BASE + "\n");
for (const [check, entry] of byCheck) {
    const mark = entry.failed.length === 0 ? "PASS" : "FAIL";
    console.log(
        `  ${mark}  ${check.padEnd(42)} ${entry.total - entry.failed.length}/${entry.total}`,
    );
    // Every failing scope, not just the last, or a single systemic fault reads
    // as one isolated glitch.
    for (const detail of entry.failed) console.log(`        ${detail}`);
}

console.log(`\n  ${results.length - failed.length}/${results.length} checks passed\n`);

process.exit(failed.length === 0 ? 0 : 1);
