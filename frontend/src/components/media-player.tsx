"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Pause, Play, Volume1, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { requestMediaPlayback, releaseMediaPlayback } from "@/lib/single-media";
import { Button } from "@/components/ui/button";

type MediaKind = "audio" | "video";

const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const CustomSlider = ({
    value,
    onChange,
    className,
}: {
    value: number;
    onChange: (value: number) => void;
    className?: string;
}) => {
    return (
        <motion.div
            className={cn("relative w-full h-1 bg-white/20 rounded-full cursor-pointer", className)}
            onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = (x / rect.width) * 100;
                onChange(Math.min(Math.max(percentage, 0), 100));
            }}
        >
            <motion.div
                className="absolute top-0 left-0 h-full bg-white rounded-full"
                style={{ width: `${value}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
        </motion.div>
    );
};

/**
 * Shared media player used for both audio and video. Both kinds are backed by a
 * <video> element (hidden for audio), since some recorded WebM only plays in a
 * video element. The audio kind renders a compact bar; the video kind renders the
 * stage with a hover control overlay.
 */
const MediaPlayer = ({
    src,
    kind,
    className,
}: {
    src: string;
    kind: MediaKind;
    className?: string;
}) => {
    const mediaRef = useRef<HTMLVideoElement>(null);
    // Some hosts serve media bytes with a generic content-type (e.g. Cloudinary "raw"
    // uploads). When the direct URL fails to load we fetch the bytes and play them as a
    // blob, which browsers decode by container sniffing.
    const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);
    const retriedRef = useRef(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [progress, setProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showControls, setShowControls] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        return () => {
            if (resolvedSrc && resolvedSrc.startsWith("blob:")) {
                URL.revokeObjectURL(resolvedSrc);
            }
        };
    }, [resolvedSrc]);

    const togglePlay = () => {
        const media = mediaRef.current;
        if (!media) return;
        if (media.paused) {
            void media.play().catch(() => setIsPlaying(false));
        } else {
            media.pause();
        }
    };

    const handleError = () => {
        if (retriedRef.current || failed) return;
        retriedRef.current = true;

        if (src.startsWith("blob:") || src.startsWith("data:")) {
            setFailed(true);
            return;
        }

        fetch(src, { mode: "cors" })
            .then((response) => response.blob())
            .then((blob) => {
                setResolvedSrc(URL.createObjectURL(blob));
                setFailed(false);
            })
            .catch(() => setFailed(true));
    };

    const handleVolumeChange = (value: number) => {
        if (mediaRef.current) {
            const newVolume = value / 100;
            mediaRef.current.volume = newVolume;
            setVolume(newVolume);
            setIsMuted(newVolume === 0);
        }
    };

    const handleLoadedMetadata = () => {
        if (mediaRef.current) {
            setDuration(Number.isFinite(mediaRef.current.duration) ? mediaRef.current.duration : 0);
        }
    };

    const handleTimeUpdate = () => {
        if (mediaRef.current) {
            const p = (mediaRef.current.currentTime / mediaRef.current.duration) * 100;
            setProgress(isFinite(p) ? p : 0);
            setCurrentTime(mediaRef.current.currentTime);
            setDuration(Number.isFinite(mediaRef.current.duration) ? mediaRef.current.duration : 0);
        }
    };

    const handleSeek = (value: number) => {
        if (mediaRef.current && mediaRef.current.duration) {
            const time = (value / 100) * mediaRef.current.duration;
            if (isFinite(time)) {
                mediaRef.current.currentTime = time;
                setProgress(value);
            }
        }
    };

    const toggleMute = () => {
        if (mediaRef.current) {
            mediaRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
            if (!isMuted) {
                setVolume(0);
            } else {
                setVolume(1);
                mediaRef.current.volume = 1;
            }
        }
    };

    const setSpeed = (speed: number) => {
        if (mediaRef.current) {
            mediaRef.current.playbackRate = speed;
            setPlaybackSpeed(speed);
        }
    };

    const handleNativePlay = () => {
        if (mediaRef.current) requestMediaPlayback(mediaRef.current);
        setIsPlaying(true);
    };

    const handleNativePause = () => {
        if (mediaRef.current) releaseMediaPlayback(mediaRef.current);
        setIsPlaying(false);
    };

    const failedMessage =
        kind === "video"
            ? "This video couldn't be played here."
            : "This audio couldn't be played here.";
    const openLabel = kind === "video" ? "Open video" : "Open audio";
    const playLabel = kind === "video" ? "Play video" : "Play audio";
    const pauseLabel = kind === "video" ? "Pause video" : "Pause audio";

    if (kind === "video") {
        return (
            <motion.div
                className={cn(
                    "relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden bg-[#11111198] shadow-[0_0_20px_rgba(0,0,0,0.2)] backdrop-blur-sm",
                    className,
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
            >
                <video
                    ref={mediaRef}
                    className="block w-full max-h-[70vh] object-contain"
                    src={resolvedSrc ?? src}
                    playsInline
                    preload="metadata"
                    onPlay={handleNativePlay}
                    onPause={handleNativePause}
                    onEnded={handleNativePause}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onError={handleError}
                    onClick={togglePlay}
                />

                {failed ? (
                    <div className="flex flex-col items-center gap-3 p-8 text-center text-white">
                        <p className="text-sm text-white/80">{failedMessage}</p>
                        <a
                            href={src}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-sm transition-colors hover:bg-white/20"
                        >
                            <ExternalLink className="size-4" />
                            {openLabel}
                        </a>
                    </div>
                ) : (
                    <AnimatePresence>
                        {showControls && (
                            <motion.div
                                className="absolute bottom-0 mx-auto max-w-xl left-0 right-0 p-4 m-2 bg-[#11111198] backdrop-blur-md rounded-2xl"
                                initial={{ y: 20, opacity: 0, filter: "blur(10px)" }}
                                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                                exit={{ y: 20, opacity: 0, filter: "blur(10px)" }}
                                transition={{ duration: 0.6, ease: "circInOut", type: "spring" }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-white text-sm">
                                        {formatTime(currentTime)}
                                    </span>
                                    <CustomSlider
                                        value={progress}
                                        onChange={handleSeek}
                                        className="flex-1"
                                    />
                                    <span className="text-white text-sm">
                                        {formatTime(duration)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <Button
                                                onClick={togglePlay}
                                                variant="ghost"
                                                size="icon"
                                                className="text-white hover:bg-[#111111d1] hover:text-white"
                                            >
                                                {isPlaying ? (
                                                    <Pause className="h-5 w-5" />
                                                ) : (
                                                    <Play className="h-5 w-5" />
                                                )}
                                            </Button>
                                        </motion.div>
                                        <div className="flex items-center gap-x-1">
                                            <motion.div
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <Button
                                                    onClick={toggleMute}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-white hover:bg-[#111111d1] hover:text-white"
                                                >
                                                    {isMuted ? (
                                                        <VolumeX className="h-5 w-5" />
                                                    ) : volume > 0.5 ? (
                                                        <Volume2 className="h-5 w-5" />
                                                    ) : (
                                                        <Volume1 className="h-5 w-5" />
                                                    )}
                                                </Button>
                                            </motion.div>

                                            <div className="w-24">
                                                <CustomSlider
                                                    value={volume * 100}
                                                    onChange={handleVolumeChange}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {[0.5, 1, 1.5, 2].map((speed) => (
                                            <motion.div
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                key={speed}
                                            >
                                                <Button
                                                    onClick={() => setSpeed(speed)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn(
                                                        "text-white hover:bg-[#111111d1] hover:text-white",
                                                        playbackSpeed === speed && "bg-[#111111d1]",
                                                    )}
                                                >
                                                    {speed}x
                                                </Button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </motion.div>
        );
    }

    return (
        <div className={cn("w-full rounded-xl bg-[#11111198] px-4 py-3 text-white", className)}>
            <video
                ref={mediaRef}
                className="sr-only"
                src={resolvedSrc ?? src}
                playsInline
                preload="metadata"
                onPlay={handleNativePlay}
                onPause={handleNativePause}
                onEnded={handleNativePause}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onError={handleError}
            />

            {failed ? (
                <div className="flex items-center justify-between gap-3 py-1">
                    <p className="text-sm text-white/80">{failedMessage}</p>
                    <a
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-sm transition-colors hover:bg-white/20"
                    >
                        <ExternalLink className="size-4" />
                        {openLabel}
                    </a>
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={togglePlay}
                        aria-label={isPlaying ? pauseLabel : playLabel}
                        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                    >
                        {isPlaying ? (
                            <Pause className="size-5" />
                        ) : (
                            <Play className="size-5 pl-0.5" />
                        )}
                    </button>

                    <div className="flex flex-1 items-center gap-2">
                        <span className="text-xs tabular-nums text-white/75">
                            {formatTime(currentTime)}
                        </span>
                        <div
                            className="relative h-1 flex-1 cursor-pointer rounded-full bg-white/20"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                handleSeek(Math.min(Math.max((x / rect.width) * 100, 0), 100));
                            }}
                        >
                            <div
                                className="absolute top-0 left-0 h-full rounded-full bg-white"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-xs tabular-nums text-white/75">
                            {formatTime(duration)}
                        </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                        <button
                            type="button"
                            onClick={toggleMute}
                            aria-label={isMuted ? "Unmute" : "Mute"}
                            className="flex size-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            {isMuted ? (
                                <VolumeX className="size-4" />
                            ) : volume > 0.5 ? (
                                <Volume2 className="size-4" />
                            ) : (
                                <Volume1 className="size-4" />
                            )}
                        </button>
                        <div
                            className="relative h-1 w-16 cursor-pointer rounded-full bg-white/20"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                handleVolumeChange(
                                    Math.min(Math.max((x / rect.width) * 100, 0), 100),
                                );
                            }}
                        >
                            <div
                                className="absolute top-0 left-0 h-full rounded-full bg-white"
                                style={{ width: `${volume * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaPlayer;
