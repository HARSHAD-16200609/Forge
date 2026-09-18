import { motion, useReducedMotion } from "framer-motion";
import { Mic } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { mediaService, type RecordingType } from "@/realtime/media";
import MediaPlayer from "@/components/media-player";
import { APP_EASE } from "@/components/ui/app-motion";

type ComposerRecorderProps = {
    mode: RecordingType;
    onComplete: (file: File) => void;
    onCancel: () => void;
};

type Review = { url: string; file: File; duration: number };

function formatElapsed(total: number): string {
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function ComposerRecorder({ mode, onComplete, onCancel }: ComposerRecorderProps) {
    const reduce = useReducedMotion();
    const [phase, setPhase] = useState<"starting" | "recording" | "review" | "error">("starting");
    const [error, setError] = useState("");
    const [seconds, setSeconds] = useState(0);
    const [review, setReview] = useState<Review | null>(null);

    const streamRef = useRef<MediaStream | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const secondsRef = useRef(0);
    const reviewRef = useRef<Review | null>(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const { stream, recorder } = await mediaService.start(mode);
                if (cancelled) {
                    mediaService.disposeStream(stream);
                    return;
                }
                streamRef.current = stream;
                recorderRef.current = recorder;
                if (mode === "video" && videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                recorder.start();
                setSeconds(0);
                secondsRef.current = 0;
                setPhase("recording");
            } catch {
                setError(
                    `We couldn't access your ${
                        mode === "video" ? "camera and microphone" : "microphone"
                    }. Check browser permissions and try again.`,
                );
                setPhase("error");
            }
        })();

        return () => {
            cancelled = true;
            if (recorderRef.current && recorderRef.current.state !== "inactive") {
                try {
                    recorderRef.current.stop();
                } catch {
                    /* noop */
                }
            }
            if (streamRef.current) mediaService.disposeStream(streamRef.current);
        };
    }, [mode]);

    useEffect(() => {
        if (phase !== "recording") return;
        const timer = setInterval(() => {
            secondsRef.current += 1;
            setSeconds(secondsRef.current);
        }, 1000);
        return () => clearInterval(timer);
    }, [phase]);

    useEffect(() => {
        return () => {
            if (reviewRef.current) URL.revokeObjectURL(reviewRef.current.url);
        };
    }, []);

    const handleClose = useCallback(() => {
        onCancel();
    }, [onCancel]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") handleClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [handleClose]);

    const handleStop = useCallback(async () => {
        const recorder = recorderRef.current;
        if (!recorder || recorder.state === "inactive") return;
        try {
            const { url, file } = await mediaService.stop(recorder);
            if (streamRef.current) mediaService.disposeStream(streamRef.current);
            const next: Review = { url, file, duration: secondsRef.current };
            reviewRef.current = next;
            setReview(next);
            setPhase("review");
        } catch {
            handleClose();
        }
    }, [handleClose]);

    const handleSave = useCallback(() => {
        if (reviewRef.current) onComplete(reviewRef.current.file);
    }, [onComplete]);

    const recording = phase === "starting" || phase === "recording";

    return (
        <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={mode === "video" ? "Video recording" : "Audio recording"}
            onClick={handleClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: APP_EASE }}
        >
            <motion.div
                onClick={(event) => event.stopPropagation()}
                className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card"
                initial={reduce ? false : { opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
                transition={{ duration: 0.2, ease: APP_EASE }}
            >
                {phase === "error" ? (
                    <div className="p-6 text-center">
                        <p className="text-sm leading-6 text-foreground">{error}</p>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="mt-5 inline-flex h-9 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
                        >
                            Close
                        </button>
                    </div>
                ) : phase === "review" && review ? (
                    <>
                        <div className="flex items-center justify-between border-b border-border px-4 py-3">
                            <span className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
                                {mode === "video" ? "Video recording" : "Voice note"}
                            </span>
                            <span className="font-mono text-sm text-foreground tabular-nums">
                                {formatElapsed(review.duration)}
                            </span>
                        </div>

                        <div className="p-3">
                            {mode === "video" ? (
                                <MediaPlayer kind="video" src={review.url} />
                            ) : (
                                <MediaPlayer kind="audio" src={review.url} />
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-4 py-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="inline-flex h-9 items-center rounded-md px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                Discard
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="inline-flex h-9 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
                            >
                                Save to message
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-between border-b border-border px-4 py-3">
                            <div className="flex items-center gap-2">
                                <motion.span
                                    aria-hidden="true"
                                    className="size-2 rounded-full bg-destructive"
                                    animate={
                                        reduce || phase !== "recording"
                                            ? undefined
                                            : { opacity: [1, 0.3, 1] }
                                    }
                                    transition={
                                        reduce || phase !== "recording"
                                            ? undefined
                                            : { repeat: Infinity, duration: 1.4, ease: "easeInOut" }
                                    }
                                />
                                <span className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
                                    {mode === "video" ? "Video recording" : "Voice note"}
                                </span>
                            </div>
                            <span className="font-mono text-sm text-foreground tabular-nums">
                                {formatElapsed(seconds)}
                            </span>
                        </div>

                        <div className="p-3">
                            {mode === "video" ? (
                                <div className="aspect-video overflow-hidden rounded-lg border border-border bg-muted">
                                    <video
                                        ref={videoRef}
                                        muted
                                        playsInline
                                        autoPlay
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="flex h-24 items-center justify-center gap-2 text-sm text-muted-foreground">
                                    <Mic className="size-4" />
                                    {phase === "starting" ? "Preparing…" : "Recording…"}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-4 py-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="inline-flex h-9 items-center rounded-md px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleStop}
                                disabled={recording && phase !== "recording"}
                                className="inline-flex h-9 items-center rounded-md bg-destructive px-4 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:opacity-40"
                            >
                                Stop
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </motion.div>
    );
}
