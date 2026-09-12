import { useEffect, useMemo, useState } from "react";
import {
    File,
    FileArchive,
    FileAudio,
    FileImage,
    FileText,
    FileVideo,
    Files as FilesIcon,
    Search,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageEmptyState } from "@/components/ui/page-empty-state";
import { PresenceAvatar } from "@/components/ui/presence-avatar";
import { Swirling } from "@/components/ui/Swirling";
import { useWorkspace, useWorkspaces } from "@/features/Workspaces/hooks/useWorkspaces";
import { useWorkspaceStore } from "@/features/Workspaces/store/workspaceStore";
import { useFiles } from "@/features/Files/hooks/useFiles";
import type { FileCategory, WorkspaceFile } from "@/features/Files/files.types";
import { formatFileSize } from "@/features/Messages/utils/format";
import { cn } from "@/lib/utils";

const FILE_TABS: { label: string; value?: FileCategory }[] = [
    { label: "All" },
    { label: "Images", value: "IMAGE" },
    { label: "Videos", value: "VIDEO" },
    { label: "Audio", value: "AUDIO" },
    { label: "Documents", value: "DOCUMENT" },
    { label: "Archives", value: "ARCHIVE" },
    { label: "Other", value: "OTHER" },
];

function typeIcon(fileType: FileCategory) {
    switch (fileType) {
        case "IMAGE":
            return <FileImage className="size-5" />;
        case "VIDEO":
            return <FileVideo className="size-5" />;
        case "AUDIO":
            return <FileAudio className="size-5" />;
        case "DOCUMENT":
            return <FileText className="size-5" />;
        case "ARCHIVE":
            return <FileArchive className="size-5" />;
        default:
            return <File className="size-5" />;
    }
}

function formatUploadedAt(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
    }).format(date);
}

function FileCard({ file, workspaceId }: { file: WorkspaceFile; workspaceId: string }) {
    return (
        <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-border hover:bg-card/70"
        >
            <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-brand/10 group-hover:text-brand">
                    {typeIcon(file.fileType)}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                        {file.filename}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatFileSize(file.fileSize)} · {formatUploadedAt(file.uploadedAt)}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                <span className="inline-flex min-w-0 max-w-[55%] items-center gap-1.5 truncate rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                    <span className="truncate">{file.source.label}</span>
                </span>
                <span className="flex min-w-0 items-center gap-1.5">
                    <PresenceAvatar
                        name={file.uploader?.name ?? file.uploader?.username ?? "Unknown"}
                        avatarUrl={file.uploader?.avatar ?? null}
                        size="sm"
                        workspaceId={workspaceId}
                        userId={file.uploader?.id}
                        dot="hidden"
                    />
                    <span className="truncate text-xs text-muted-foreground">
                        {file.uploader?.name ?? file.uploader?.username ?? "Unknown"}
                    </span>
                </span>
            </div>
        </a>
    );
}

export function Files() {
    const Workspaces = useWorkspaces();
    const { selectedWorkspaceId } = useWorkspaceStore();
    const [fileType, setFileType] = useState<FileCategory | undefined>(undefined);
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    const activeWorkspaceId =
        selectedWorkspaceId ?? Workspaces?.data?.[0]?.workspace?.id ?? null;

    const details = useWorkspace(activeWorkspaceId ?? "");
    const search = debouncedQuery.trim() || undefined;

    const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useFiles(
        {
            workspaceId: activeWorkspaceId ?? "",
            fileType,
            search,
        },
    );

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    const files = useMemo(() => data?.pages.flatMap((page) => page.files) ?? [], [data]);

    const workspaceName = useMemo(() => details.data?.workspaceName, [details.data]);

    if (isPending) {
        return (
            <div className="flex h-full items-center justify-center">
                <Swirling className="size-10 text-brand" />
            </div>
        );
    }

    if (isError || !activeWorkspaceId) {
        return (
            <div className="flex h-full items-center justify-center px-6">
                <div className="text-sm text-destructive">Failed to load files.</div>
            </div>
        );
    }

    return (
        <div className="mx-auto h-full max-w-4xl overflow-y-auto p-6">
            <PageHeader
                title="Files"
                description={
                    files.length > 0
                        ? `${files.length} ${files.length === 1 ? "file" : "files"} in ${workspaceName ?? "your workspace"}`
                        : `Uploads shared in ${workspaceName ?? "your workspace"}`
                }
            />

            <div className="mb-5 flex flex-wrap items-center gap-2">
                {FILE_TABS.map((tab) => (
                    <button
                        key={tab.label}
                        type="button"
                        onClick={() => setFileType(tab.value)}
                        className={cn(
                            "inline-flex h-8 items-center rounded-full px-3.5 text-sm font-medium transition-colors",
                            fileType === tab.value
                                ? "bg-brand text-brand-foreground"
                                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <label className="relative mb-5 block w-full max-w-sm">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search files…"
                    className="h-9 w-full rounded-lg border border-border/70 bg-muted/40 pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-brand/40 focus:bg-background focus:ring-2 focus:ring-brand/15"
                />
            </label>

            {files.length === 0 && !search && !fileType ? (
                <PageEmptyState
                    icon={<FilesIcon className="size-5" />}
                    title="No files yet"
                    description="Files shared in channels and conversations you can access will show up here."
                />
            ) : files.length === 0 ? (
                <PageEmptyState
                    icon={<Search className="size-5" />}
                    title="No matching files"
                    description="Try a different search or clear the filters."
                />
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {files.map((file) => (
                        <FileCard key={file.id} file={file} workspaceId={activeWorkspaceId} />
                    ))}
                </div>
            )}

            {hasNextPage && (
                <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="mt-6 inline-flex h-9 items-center gap-2 rounded-lg border border-border/70 bg-muted/40 px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
                >
                    {isFetchingNextPage ? "Loading…" : "Load more"}
                </button>
            )}
        </div>
    );
}