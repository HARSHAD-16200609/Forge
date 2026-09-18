import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
    ExternalLink,
    File,
    FileArchive,
    FileAudio,
    FileText,
    FileVideo,
    Play,
    X,
    ZoomIn,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/features/Messages/utils/format";
import { getVideoThumbnail } from "@/features/Messages/utils/videoThumbnail";
import type { MessageAttachment } from "@/features/Messages/types";
import { APP_EASE } from "@/components/ui/app-motion";
import MediaPlayer from "@/components/media-player";

type MessageAttachmentsProps = {
    uploads?: MessageAttachment[];
    className?: string;
};

function renderIcon(fileType: string) {
    const type = fileType.toLowerCase();
    if (type === "video") return <FileVideo className="size-6" />;
    if (type === "audio") return <FileAudio className="size-6" />;
    if (type === "archive") return <FileArchive className="size-6" />;
    if (type === "document") return <FileText className="size-6" />;
    return <File className="size-6" />;
}

const VIDEO_EXTS = ["webm", "mp4", "mov", "m4v", "ogv", "mkv"];
const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif", "bmp"];
const AUDIO_EXTS = ["mp3", "wav", "ogg", "oga", "m4a", "opus", "aac", "flac"];

function categoryOf(upload: MessageAttachment): "image" | "video" | "audio" | "file" {
    const mime = (upload.mimeType ?? "").toLowerCase();
    const type = (upload.fileType ?? "").toLowerCase();
    const ext = (upload.filename ?? "").toLowerCase().split(".").pop() ?? "";

    if (mime.startsWith("video/") || type === "video" || VIDEO_EXTS.includes(ext)) return "video";
    if (mime.startsWith("image/") || type === "image" || IMAGE_EXTS.includes(ext)) return "image";
    if (mime.startsWith("audio/") || type === "audio" || AUDIO_EXTS.includes(ext)) return "audio";
    return "file";
}

function VideoAttachmentCard({
    upload,
    onOpen,
}: {
    upload: MessageAttachment;
    onOpen: () => void;
}) {
    const [thumb, setThumb] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        void getVideoThumbnail(upload.url).then((data) => {
            if (active) setThumb(data);
        });
        return () => {
            active = false;
        };
    }, [upload.url]);

    return (
        <button
            type="button"
            onClick={onOpen}
            aria-label={`Play ${upload.filename}`}
            className="group relative block max-w-xs cursor-zoom-in overflow-hidden rounded-lg border border-border bg-muted"
        >
            {thumb ? (
                <img
                    src={thumb}
                    alt=""
                    className="aspect-video w-full object-cover"
                    draggable={false}
                />
            ) : (
                <span className="flex aspect-video w-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
                    <FileVideo className="size-7" />
                    <span className="max-w-40 truncate px-2 text-xs">{upload.filename}</span>
                </span>
            )}

            <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-[2px] transition-transform group-hover:scale-105">
                    <Play className="size-5 fill-current" />
                </span>
            </span>
        </button>
    );
}

export function MessageAttachments({ uploads, className }: MessageAttachmentsProps) {
    const [preview, setPreview] = useState<MessageAttachment | null>(null);
    const reduce = useReducedMotion();

    const isVideoPreview = preview?.mimeType.toLowerCase().startsWith("video/") ?? false;
    const isAudioPreview = preview?.mimeType.toLowerCase().startsWith("audio/") ?? false;

    useEffect(() => {
        if (!preview) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setPreview(null);
        };
        window.addEventListener("keydown", onKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = "";
        };
    }, [preview]);

    if (!uploads || uploads.length === 0) return null;

    return (
        <>
            <div className={cn("mt-2 flex flex-wrap gap-2", className)}>
                {uploads.map((upload) => {
                    const category = categoryOf(upload);
                    const key = `${upload.url}-${upload.filename}`;

                    if (category === "image") {
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setPreview(upload)}
                                aria-label={`Preview ${upload.filename}`}
                                className="group relative block max-w-xs cursor-zoom-in overflow-hidden rounded-lg border border-border"
                            >
                                <img
                                    src={upload.url}
                                    alt={upload.filename}
                                    className="max-h-64 w-full object-cover"
                                />
                                <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white opacity-0 transition-opacity group-hover:opacity-100">
                                    <ZoomIn className="size-6" />
                                </span>
                            </button>
                        );
                    }

                    if (category === "video") {
                        return (
                            <VideoAttachmentCard
                                key={key}
                                upload={upload}
                                onOpen={() => setPreview(upload)}
                            />
                        );
                    }

                    if (category === "audio") {
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setPreview(upload)}
                                aria-label={`Play ${upload.filename}`}
                                className="group flex w-full max-w-md min-w-0 items-center gap-2.5 overflow-hidden rounded-lg border border-border bg-muted p-2.5 text-left transition-colors hover:bg-muted/70"
                            >
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-card text-muted-foreground">
                                    <FileAudio className="size-5" />
                                </span>
                                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                    {upload.filename}
                                </span>
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-black/50 text-white transition-transform group-hover:scale-105">
                                    <Play className="size-4 fill-current" />
                                </span>
                            </button>
                        );
                    }

                    return (
                        <a
                            key={key}
                            href={upload.url}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex min-w-0 items-center gap-2 rounded-lg border border-border p-2 transition-colors hover:bg-muted"
                        >
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                {renderIcon(upload.fileType)}
                            </span>
                            <span className="flex min-w-0 flex-col">
                                <span className="max-w-56 truncate text-sm font-medium">
                                    {upload.filename}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {formatFileSize(upload.fileSize)}
                                </span>
                            </span>
                            <ExternalLink className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </a>
                    );
                })}
            </div>

            <AnimatePresence>
                {preview && (
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label={`${isVideoPreview ? "Video" : isAudioPreview ? "Audio" : "Image"} preview: ${preview.filename}`}
                        onClick={() => setPreview(null)}
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-4 sm:p-10"
                        initial={reduce ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18, ease: APP_EASE }}
                    >
                        <button
                            type="button"
                            autoFocus
                            aria-label="Close preview"
                            onClick={() => setPreview(null)}
                            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                        >
                            <X className="size-5" />
                        </button>

                        <motion.div
                            className="max-h-full max-w-full"
                            onClick={(event) => event.stopPropagation()}
                            initial={reduce ? false : { opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.22, ease: APP_EASE }}
                        >
                            {isVideoPreview ? (
                                <div className="w-[min(92vw,64rem)]">
                                    <MediaPlayer kind="video" src={preview.url} />
                                </div>
                            ) : isAudioPreview ? (
                                <div className="w-full max-w-md">
                                    <MediaPlayer kind="audio" src={preview.url} />
                                </div>
                            ) : (
                                <img
                                    src={preview.url}
                                    alt={preview.filename}
                                    className="max-h-[80vh] max-w-[90vw] rounded-lg border border-white/15 object-contain shadow-2xl"
                                />
                            )}
                        </motion.div>

                        <div className="mt-3 flex items-center gap-2 text-sm text-white">
                            <span className="max-w-72 truncate">{preview.filename}</span>
                            <a
                                href={preview.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs transition-colors hover:bg-white/20"
                            >
                                <ExternalLink className="size-3.5" />
                                Open in new tab
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
