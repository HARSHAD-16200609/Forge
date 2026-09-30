import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Pause, Play } from "@carbon/icons-react";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

/**
 * Tracks the OS-level motion preference, and keeps tracking it if the reader
 * changes it mid-session. `useSyncExternalStore` rather than an effect that
 * calls setState: the media query list *is* an external store, and subscribing
 * to it avoids a render pass whose only job is to copy a boolean.
 */
function usePrefersReducedMotion() {
    return useSyncExternalStore(
        (onChange) => {
            const query = window.matchMedia(reducedMotionQuery);
            query.addEventListener("change", onChange);
            return () => query.removeEventListener("change", onChange);
        },
        () => window.matchMedia(reducedMotionQuery).matches,
        () => false,
    );
}

/**
 * The product recording, framed as a recording.
 *
 * Three decisions worth stating:
 *
 * 1. `preload="none"` and nothing plays until the clip is a fifth of the way
 *    into the viewport. This section is below the fold, so the bytes are not
 *    part of the initial load. The hero above is text, which keeps LCP a text
 *    paint rather than a video decode.
 *
 * 2. Under reduced motion it never autoplays, even on scroll, and the poster
 *    stands in permanently. The reader can still start it on purpose.
 *
 * 3. The control is a real button with a name, not a bare icon. Anything that
 *    moves on its own for more than five seconds needs a way to stop it, and
 *    WCAG 2.2.2 is not satisfied by clicking the video.
 */
export function ProductVideo() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const frameRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isHeld, setIsHeld] = useState(false);
    const reducedMotion = usePrefersReducedMotion();

    const play = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = true;
        // Autoplay can still be refused, and an unhandled rejection here would
        // surface as an error rather than as a paused video.
        video.play().catch(() => setIsPlaying(false));
    }, []);

    const pause = useCallback(() => {
        videoRef.current?.pause();
    }, []);

    const toggle = useCallback(() => {
        if (videoRef.current?.paused) {
            setIsHeld(false);
            play();
        } else {
            setIsHeld(true);
            pause();
        }
    }, [play, pause]);

    useEffect(() => {
        const video = videoRef.current;
        const frame = frameRef.current;
        if (!video || !frame || typeof IntersectionObserver === "undefined") return;

        // A reader who asked for less motion does not get it handed to them on
        // scroll, so the observer never starts playback in that case.
        if (reducedMotion) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.intersectionRatio >= 0.2) {
                    if (!isHeld) play();
                } else {
                    video.pause();
                }
            },
            { threshold: [0, 0.2, 1] },
        );

        observer.observe(frame);
        return () => observer.disconnect();
    }, [isHeld, play, reducedMotion]);

    // A held pause outranks the observer. Without this, scrolling the clip back
    // into view would restart a video the reader had deliberately stopped.
    useEffect(() => {
        if (!isHeld) return;
        videoRef.current?.pause();
    }, [isHeld]);

    const showPlayOverlay = !isPlaying;

    return (
        <div ref={frameRef} className="overflow-hidden rounded-[12px] border border-border bg-card">
            <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-2.5">
                {/* A plain address bar rather than faux window chrome. Mac-style
                    traffic lights are a stock "product screenshot" tell, and
                    they would be three coloured dots on a page that spends its
                    colour budget on meaning. */}
                <span className="landing-mono truncate">forge.app / app / home</span>

                <button
                    type="button"
                    onClick={toggle}
                    aria-label={isPlaying ? "Pause the recording" : "Play the recording"}
                    className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>
            </div>

            <div className="relative">
                <video
                    ref={videoRef}
                    className="block aspect-[16/10] w-full bg-card object-cover"
                    src="/media/forge-app.mp4"
                    poster="/media/forge-app-poster.webp"
                    muted
                    loop
                    playsInline
                    preload="none"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                >
                    {/* The recording is silent, so there is nothing to
                        caption. The surrounding prose describes it instead. */}
                </video>

                {showPlayOverlay && (
                    <button
                        type="button"
                        onClick={toggle}
                        aria-label="Play the recording"
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <span className="flex size-14 items-center justify-center rounded-full border border-border bg-background/85 text-foreground backdrop-blur-sm">
                            <Play size={20} />
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
}
