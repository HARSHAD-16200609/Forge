import { ExternalLink, File, FileArchive, FileAudio, FileText, FileVideo } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/features/Messages/utils/format";
import type { MessageAttachment } from "@/features/Messages/types";

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
    if (!uploads || uploads.length === 0) return null;

    return (
        <div className={cn("mt-2 flex flex-wrap gap-2", className)}>
            {uploads.map((upload) => {
                const mime = upload.mimeType.toLowerCase();
                const key = `${upload.url}-${upload.filename}`;

                if (mime.startsWith("image/")) {
                    return (
                        <a
                            key={key}
                            href={upload.url}
                            target="_blank"
                            rel="noreferrer"
                            className="group relative block max-w-xs"
                        >
                            <img
                                src={upload.url}
                                alt={upload.filename}
                                className="max-h-64 w-full rounded-lg border border-border object-cover"
                            />
                            <span className="absolute inset-0 hidden items-center justify-center rounded-lg bg-black/30 text-white group-hover:flex">
                                <ExternalLink className="size-5" />
                            </span>
                        </a>
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
    );
}
