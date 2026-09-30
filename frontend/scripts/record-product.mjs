/**
 * Records the product video used on the landing page.
 *
 *   DEMO_EMAIL=... DEMO_PASSWORD=... node scripts/record-product.mjs
 *
 * Two browser contexts on purpose. Playwright starts recording the moment a
 * context is created, so a single context would open on the login screen and
 * the first second of the marketing video would be someone typing a password.
 * Instead the first context signs in and hands its `storageState` to a second
 * context that begins already inside the workspace.
 *
 * The tour returns to the state it started in, so the `loop` attribute cuts
 * between two matching frames instead of jumping.
 */
import { chromium } from "playwright";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "..", "public", "media");
const tmpDir = path.join(here, ".record-tmp");

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5173";
const EMAIL = process.env.DEMO_EMAIL;
const PASSWORD = process.env.DEMO_PASSWORD;

const VIDEO = { width: 1600, height: 1000 };

/** Runs a tour step, reporting rather than throwing when an affordance is absent. */
async function step(name, fn) {
    try {
        await fn();
        console.log(`  ok    ${name}`);
        return true;
    } catch (error) {
        console.log(`  SKIP  ${name} (${String(error.message).split("\n")[0]})`);
        return false;
    }
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

if (!EMAIL || !PASSWORD) {
    console.error("DEMO_EMAIL and DEMO_PASSWORD are required.");
    console.error("Use one of the accounts created by `backend/prisma/seed.ts`.");
    process.exit(1);
}

await rm(tmpDir, { recursive: true, force: true });
await mkdir(tmpDir, { recursive: true });
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
let videoPath;

// ── 1. Sign in, keep only the resulting session state ──────────────────────
const auth = await browser.newContext({ viewport: VIDEO });
const login = await auth.newPage();
await login.goto(`${BASE_URL}/auth/login`, { waitUntil: "domcontentloaded" });
await login.fill("#email", EMAIL);
await login.fill("#password", PASSWORD);
await login.click('button[type="submit"]');
await login.waitForURL(/\/app\//, { timeout: 20_000 });
const storageState = await auth.storageState();
await auth.close();
console.log("signed in, session captured");

// ── 2. Record the tour ─────────────────────────────────────────────────────
const context = await browser.newContext({
    viewport: VIDEO,
    deviceScaleFactor: 1,
    storageState,
    recordVideo: { dir: tmpDir, size: VIDEO },
});
const page = await context.newPage();

await page.goto(`${BASE_URL}/app/home`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500); // let avatars, threads and presence settle

// Park the pointer mid-list so wheel events land on the message history.
const width = VIDEO.width;
const height = VIDEO.height;
await page.mouse.move(width * 0.62, height * 0.5);
await page.waitForTimeout(400);

await step("scroll history up", async () => {
    for (let i = 0; i < 6; i++) {
        await page.mouse.wheel(0, -320);
        await page.waitForTimeout(160);
    }
});

await step("scroll history back down", async () => {
    for (let i = 0; i < 6; i++) {
        await page.mouse.wheel(0, 320);
        await page.waitForTimeout(160);
    }
});

await step("open a thread", async () => {
    const summary = page.getByText(/^\d+\s+repl(ies|y)$/).first();
    await summary.waitFor({ state: "visible", timeout: 8000 });
    await summary.click();
    await page.waitForTimeout(1800);
});

await step("close the thread", async () => {
    const close = page.locator('[aria-label="Close thread"]');
    await close.waitFor({ state: "visible", timeout: 8000 });
    await close.click();
    await page.waitForTimeout(1500);
});

// Return the wheel to the origin so the last frame matches the first.
await step("return to the starting scroll position", async () => {
    for (let i = 0; i < 3; i++) {
        await page.mouse.wheel(0, -400);
        await page.waitForTimeout(140);
    }
});

await page.waitForTimeout(1200);

// `close()` is what flushes the recording to disk.
await context.close();
await browser.close();

const [recorded] = await readdir(tmpDir);
videoPath = path.join(tmpDir, recorded);
console.log(`\nraw recording: ${((await stat(videoPath)).size / 1024).toFixed(0)} kB`);

// ── 3. Encode ──────────────────────────────────────────────────────────────
console.log("\nencoding");

const mp4 = path.join(outDir, "forge-app.mp4");
const poster = path.join(outDir, "forge-app-poster.webp");

// H.264 only. A VP9 copy was tried first and came out larger than the H.264
// encode at matched quality, and every browser that plays VP9 already plays
// H.264, so a second file would have been dead weight. No audio track at all:
// a silent looping clip should not carry a silent audio stream.
await run("ffmpeg", [
    "-y",
    "-i",
    videoPath,
    "-an",
    "-vf",
    "scale=1600:-2:flags=lanczos",
    "-c:v",
    "libx264",
    "-profile:v",
    "high",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "28",
    "-preset",
    "slow",
    "-movflags",
    "+faststart",
    mp4,
]);

// Poster from 1.5s in: past the initial paint, before any scroll.
await run("ffmpeg", [
    "-y",
    "-ss",
    "1.5",
    "-i",
    videoPath,
    "-frames:v",
    "1",
    "-vf",
    "scale=1600:-2:flags=lanczos",
    "-c:v",
    "libwebp",
    "-quality",
    "72",
    poster,
]);

// A poster is not optional decoration. It is the frame a reader sees while the
// video is still loading, and the only thing they see at all under reduced
// motion, so the page has to look finished before a single byte of video lands.
const sizes = {};
for (const [name, file] of Object.entries({ mp4, poster })) {
    sizes[name] = `${((await stat(file)).size / 1024).toFixed(0)} kB`;
}

console.log("\ndone");
for (const [name, size] of Object.entries(sizes)) {
    console.log(`  ${name.padEnd(7)} ${size}`);
}

await rm(tmpDir, { recursive: true, force: true });
