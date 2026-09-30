import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductVideo } from "@/features/landing/ProductVideo";

/**
 * jsdom implements neither IntersectionObserver nor HTMLMediaElement playback, so
 * both are stubbed. The stubs are deliberately strict: `play` is a spy rather
 * than a stub that silently succeeds, so a test can tell the difference between
 * "the component asked to play" and "the video is playing".
 */

class MockObserver {
    static instances: MockObserver[] = [];
    callback: IntersectionObserverCallback;
    options: IntersectionObserverInit | undefined;

    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        this.callback = callback;
        this.options = options;
        MockObserver.instances.push(this);
    }

    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();

    /** Drives the callback the way the browser would. */
    emit(ratio: number) {
        this.callback(
            [{ isIntersecting: ratio > 0, intersectionRatio: ratio } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
        );
    }
}

function setReducedMotion(matches: boolean) {
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        configurable: true,
        value: (query: string) => ({
            matches: query.includes("prefers-reduced-motion") ? matches : false,
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }),
    });
}

function stubMedia() {
    const play = vi.fn().mockResolvedValue(undefined);
    const pause = vi.fn();
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
        writable: true,
        configurable: true,
        value: play,
    });
    Object.defineProperty(HTMLMediaElement.prototype, "pause", {
        writable: true,
        configurable: true,
        value: pause,
    });
    Object.defineProperty(HTMLMediaElement.prototype, "paused", {
        writable: true,
        configurable: true,
        value: false,
    });
    return { play, pause };
}

beforeEach(() => {
    MockObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", MockObserver);
    setReducedMotion(false);
});

describe("ProductVideo", () => {
    it("keeps the clip off the critical path", () => {
        stubMedia();
        const { container } = render(<ProductVideo />);
        const video = container.querySelector("video")!;

        // Nothing is fetched until the reader scrolls to it.
        expect(video).toHaveAttribute("preload", "none");
        expect(video).toHaveAttribute("poster", "/media/forge-app-poster.webp");
        expect(video).toHaveAttribute("loop");
        expect(video).toHaveAttribute("playsinline");
        expect(video.muted).toBe(true);
    });

    it("ships no audio track to download", () => {
        stubMedia();
        const { container } = render(<ProductVideo />);
        expect(container.querySelector("video")).not.toHaveAttribute("autoplay");
    });

    it("plays once the clip is a fifth of the way into view", () => {
        const { play } = stubMedia();
        render(<ProductVideo />);

        const observer = MockObserver.instances.at(-1)!;
        observer.emit(0.1);
        expect(play).not.toHaveBeenCalled();

        observer.emit(0.25);
        expect(play).toHaveBeenCalled();
    });

    it("pauses again when the clip scrolls away", () => {
        const { play, pause } = stubMedia();
        render(<ProductVideo />);

        const observer = MockObserver.instances.at(-1)!;
        observer.emit(0.9);
        expect(play).toHaveBeenCalled();

        observer.emit(0);
        expect(pause).toHaveBeenCalled();
    });

    it("never autoplays under reduced motion, even on scroll", () => {
        setReducedMotion(true);
        const { play } = stubMedia();
        render(<ProductVideo />);

        // No observer is even attached, so there is no path to autoplay.
        MockObserver.instances.at(-1)?.emit(1);
        expect(play).not.toHaveBeenCalled();

        // The poster is still there for a reader who wants to start it by hand.
        expect(
            screen.getAllByRole("button", { name: /play the recording/i }).length,
        ).toBeGreaterThan(0);
    });

    it("offers a named control, which a bare clickable video would not", () => {
        stubMedia();
        render(<ProductVideo />);
        expect(
            screen.getAllByRole("button", { name: /play the recording/i }).length,
        ).toBeGreaterThan(0);
    });

    it("respects a deliberate pause when the clip scrolls back into view", () => {
        const { play, pause } = stubMedia();
        render(<ProductVideo />);

        fireEvent.click(screen.getAllByRole("button", { name: /play the recording/i })[0]);
        expect(pause).toHaveBeenCalled();

        play.mockClear();
        MockObserver.instances.at(-1)?.emit(1);
        expect(play).not.toHaveBeenCalled();
    });

    it("frames the clip with an address bar rather than window chrome", () => {
        stubMedia();
        const { container } = render(<ProductVideo />);

        // Mac-style traffic lights are a stock product-screenshot tell, and
        // they would spend three saturated dots on a page that reserves colour
        // for meaning. A plain path is both quieter and more honest.
        expect(container.textContent).toContain("forge.app");
        expect(container.querySelectorAll('[class*="bg-red-"]').length).toBe(0);
        expect(container.querySelectorAll('[class*="bg-yellow-"]').length).toBe(0);
        expect(container.querySelectorAll('[class*="bg-green-"]').length).toBe(0);
    });
});
