import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
    ExternalLink,
    File,
    FileArchive,
    FileAudio,
    FileText,
    FileVideo,
    X,
    ZoomIn,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/features/Messages/utils/format";
import type { MessageAttachment } from "@/features/Messages/types";
import { APP_EASE } from "@/components/ui/app-motion";

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

export function MessageAttachments({ uploads, className }: MessageAttachmentsProps) {
    const [lightbox, setLightbox] = useState<MessageAttachment | null>(null);
    const reduce = useReducedMotion();

    useEffect(() => {
        if (!lightbox) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setLightbox(null);
        };
        window.addEventListener("keydown", onKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = "";
        };
    }, [lightbox]);

    if (!uploads || uploads.length === 0) return null;

    return (
        <>
            <div className={cn("mt-2 flex flex-wrap gap-2", className)}>
                {uploads.map((upload) => {
                    const mime = upload.mimeType.toLowerCase();
                    const key = `${upload.url}-${upload.filename}`;

                    if (mime.startsWith("image/")) {
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setLightbox(upload)}
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

                    if (mime.startsWith("video/")) {
                        return (
                            <video
                                key={key}
                                src={upload.url}
                                controls
                                className="max-h-64 max-w-xs rounded-lg border border-border bg-muted"
                            >
                                <p>
                                    <a href={upload.url} target="_blank" rel="noreferrer">
                                        Download {upload.filename}
                                    </a>
                                </p>
                            </video>
                        );
                    }

                    if (mime.startsWith("audio/")) {
                        return (
                            <div
                                key={key}
                                className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-border p-2"
                            >
                                <FileAudio className="size-5 shrink-0 text-muted-foreground" />
                                <span className="min-w-0 flex-1 truncate text-sm">
                                    {upload.filename}
                                </span>
                                <audio controls className="h-9 min-w-0 flex-1" src={upload.url}>
                                    <a href={upload.url} target="_blank" rel="noreferrer">
                                        Download
                                    </a>
                                </audio>
                            </div>
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
                {lightbox && (
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Image preview: ${lightbox.filename}`}
                        onClick={() => setLightbox(null)}
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-4 sm:p-10"
                        initial={reduce ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18, ease: APP_EASE }}
                    >
                        <button
                            type="button"
                            autoFocus
                            aria-label="Close image preview"
                            onClick={() => setLightbox(null)}
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
                            <img
                                src={lightbox.url}
                                alt={lightbox.filename}
                                className="max-h-[80vh] max-w-[90vw] rounded-lg border border-white/15 object-contain shadow-2xl"
                            />
                        </motion.div>

                        <div className="mt-3 flex items-center gap-2 text-sm text-white">
                            <span className="max-w-72 truncate">{lightbox.filename}</span>
                            <a
                                href={lightbox.url}
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
